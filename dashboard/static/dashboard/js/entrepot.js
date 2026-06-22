document.addEventListener("DOMContentLoaded", () => {
    loadEquipes();
    loadSecteurs();
    loadEntrepot();
    loadEntrepotListe();
    loadStockEntrepot(1);
    

    document.getElementById("filterEquipe")
        ?.addEventListener("change", applyFilters);

    document.getElementById("filterSecteur")
        ?.addEventListener("change", applyFilters);

    document.getElementById("filterEntrepot")
        ?.addEventListener("change", applyFilters);
});


function loadEquipes() {
    fetch("/api/equipes/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterEquipe");
        data.forEach(v => { select.innerHTML += `<option value="${v.id_equipe}">${v.nom_equipe}</option>`; });
    })
}

function loadSecteurs() {
    fetch("/api/secteurs/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterSecteur");
        data.forEach(v => { select.innerHTML += `<option value="${v.id_secteur}">${v.nom_secteur}</option>`; });
    })
    .catch(err => console.error("Erreur lors du chargement des secteurs:", err));
}

function loadEntrepotListe() {
    fetch("/api/entrepot/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterEntrepot");
        data.entrepots.forEach(v => { select.innerHTML += `<option value="${v.id_entrepot}">${v.id_entrepot}</option>`; });
        loadStockEntrepot(1);
    })
    .catch(err => console.error("Erreur lors du chargement des secteurs:", err));
}

function getFilters() {
    return {
        equipes: document.getElementById("filterEquipe")?.value || "",
        secteurs: document.getElementById("filterSecteur")?.value || ""
    };
}

function getFiltersListe(page = 1) {
    return {
        entrepots: document.getElementById("filterEntrepot")?.value || "",
        page: page
    };
}

function applyFilters(){
   loadEntrepot();
   loadStockEntrepot(1);
}


function loadEntrepot() {
    
    const query = new URLSearchParams(getFilters()).toString();

    fetch(`/api/entrepot/?${query}`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById("entrepotsTable");
        tbody.innerHTML = "";
        if (data.entrepots.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        data.entrepots.forEach(c => {
            tbody.innerHTML += `
            <tr>
                <td>${c.id_entrepot}</td>
                <td>${c.nom_user}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(\`${c.id_entrepot}\`)">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>`;
        });

    });
}

function loadStockEntrepot(page = 1) {
    
   currentPage = page;
    const params = new URLSearchParams(getFiltersListe(page)).toString();
    const table = document.getElementById("stockTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/liste-stock/?${params}`)
    .then(res => res.json())
    .then(data => {
        table.innerHTML = "";
        if (data.stocks.length === 0) {
            table.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        data.stocks.forEach(c => {
            table.innerHTML += `
            <tr>
                <td>${c.id_stock}</td>
                <td>${c.nom_produit}</td>
                <td>${c.quantite}</td>
                <td>${c.id_entrepot}</td>
            </tr>`;
        });

        document.getElementById("tableInfoStock").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        renderPagination(data);
    });
}

function renderPagination(data) {
    const container = document.getElementById("pagination");
    container.innerHTML = "";
    let start = Math.max(1, data.current_page - 2);
    let end = Math.min(data.total_pages, data.current_page + 2);
    let html = "";

    html += `<li class="page-item ${!data.has_previous ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadStockEntrepot(${data.current_page - 1}); return false;">«</a>
             </li>`;

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === data.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadStockEntrepot(${i}); return false;">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${!data.has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadStockEntrepot(${data.current_page + 1}); return false;">»</a>
             </li>`;
    container.innerHTML = html;
}

// --- GESTION DES MODALES (DJANGO FORM) ---
function openAddModal() {
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerText = "Ajouter un nouveau entrepot";
    fetchFormContent('/api/entrepot/create/');
}

function openEditModal(id) {
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerText = `Modifier l'entrepot #${id}`;
    fetchFormContent(`/api/entrepot/update/${id}/`);
}

function fetchFormContent(url) {
    const modalBody = document.getElementById("modalBody");
    const modalEl = document.getElementById('entrepotModal');
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
    
    if (!submitBtn) {
       // console.error("Bouton de soumission non trouvé !");
        return;
    }

    // On utilise onclick pour intercepter le clic avant même que le navigateur
    // n'essaie de valider le formulaire de son côté
    submitBtn.onclick = function(e) {
        e.preventDefault(); // Empêche le rechargement de la page
        //console.log("Clic détecté sur le bouton !");

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
            //console.log("Réponse reçue, statut :", response.status);
            if (response.status === 204) {
                // Succès : on ferme la modale et on rafraîchit la liste
                instance.hide();
                loadEntrepot();
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