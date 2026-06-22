let currentPage = 1;

// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    loadProduits(1);
    // Écouteurs pour les filtres
    ["filterFormat", "pageSize"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => loadProduits(1));
    });

    // Recherche avec debounce
    let searchTimeout;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadProduits(1), 400);
        });
    }
});

// --- GESTION DU TABLEAU ---
function getParams(page = 1) {
    return {
        page: page,
        page_size: document.getElementById("pageSize").value,
        search: document.getElementById("searchInput").value,
        format: document.getElementById("filterFormat").value,
    };
}

function loadProduits(page = 1) {
    currentPage = page;
    const params = new URLSearchParams(getParams(page)).toString();
    const table = document.getElementById("produitsTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/liste-produits/?${params}`)
    .then(res => res.json())
    .then(data => {
        table.innerHTML = "";
        if (data.results.length === 0) {
            table.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        data.results.forEach(c => {
            table.innerHTML += `
            <tr>
                <td>${c.nom_produit}</td>
                <td>${c.description}</td>
                <td>${c.format}</td>
                <td>${c.prix_ht}</td>
                <td>${c.prix_carton}</td>
                <td>${c.prix_semi_gros}</td>
                <td>${c.prix_achat_pdv}</td>
                <td>${c.prix_consommateur}</td>
                <td>
                ${
                    !IS_SUPERVISEUR
                    ?
                    `
                    <button class="btn btn-sm btn-outline-primary" onclick="editProduit(${c.id_produit})">
                        <i class="fas fa-edit"></i>
                    </button>
                    `
                    :
                    ''
                }
            </td>
            </tr>`;
        });

        document.getElementById("tableInfo").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        renderPagination(data);
    });
}

// --- GESTION DES MODALES (DJANGO FORM) ---
function openAddModal() {
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerText = "Ajouter un nouveau produit";
    fetchFormContent('/api/produits/create/');
}

function editProduit(id) {
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerText = `Modifier le produit #${id}`;
    fetchFormContent(`/api/produits/update/${id}/`);
}

function fetchFormContent(url) {
    const modalBody = document.getElementById("modalBody");
    const modalEl = document.getElementById('produitModal');
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
    
    fetch(url)
    .then(res => res.text())
    .then(html => {
        modalBody.innerHTML = html;
        instance.show();
        // On appelle une fonction dédiée pour attacher l'event listener
        attachFormSubmit(url, instance);
    });
}

function attachFormSubmit(url, instance) {
    const modalBody = document.getElementById("modalBody");
    const form = modalBody.querySelector('form');
    
    // On cible précisément le bouton de type submit à l'intérieur du formulaire
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // On utilise onclick pour intercepter le clic avant même que le navigateur
    // n'essaie de valider le formulaire de son côté
    submitBtn.onclick = function(e) {
        e.preventDefault(); // Empêche le rechargement de la page

        const formData = new FormData(form);
        
        fetch(url, {
            method: 'POST',
            body: formData,
            headers: { 
                // Récupération du token CSRF indispensable pour Django
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value 
            }
        })
        .then(response => {
            
            if (response.status === 204) {
                // Succès : on ferme la modale et on rafraîchit la liste
                instance.hide();
                loadProduits(currentPage);
            } else {
                // Erreur de validation : on récupère le HTML du formulaire avec les erreurs
                return response.text();
            }
        })
        .then(html => {
            if (html) {
                // On réinjecte le formulaire contenant les erreurs de validation
                modalBody.innerHTML = html;
                // CRUCIAL : On relance l'attachement sur le nouveau bouton injecté
                attachFormSubmit(url, instance);
            }
        })
        .catch(error => {
            console.error("Erreur lors de l'envoi :", error);
        });
    };
}

// --- PAGINATION, EXPORT & FILTRES ---
function renderPagination(data) {
    const container = document.getElementById("pagination");
    container.innerHTML = "";
    let start = Math.max(1, data.current_page - 2);
    let end = Math.min(data.total_pages, data.current_page + 2);
    let html = "";

    html += `<li class="page-item ${!data.has_previous ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadProduits(${data.current_page - 1}); return false;">«</a>
             </li>`;

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === data.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadProduits(${i}); return false;">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${!data.has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadProduits(${data.current_page + 1}); return false;">»</a>
             </li>`;
    container.innerHTML = html;
}

function exportData(type) {
    const params = new URLSearchParams({...getParams(), type: type}).toString();
    window.open(`/api/export-produits/?${params}`, "_blank");
}

function loadFormats() {
    fetch("/api/produit-formats/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterFormat");
        data.forEach(v => { select.innerHTML += `<option value="${v}">${v}</option>`; });
    });
}
