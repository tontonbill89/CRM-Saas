// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    loadEquipes();
    loadSecteurs();
    if (IS_ADMIN) {
        loadProfiles();
}

    // Écouteurs pour les filtres
    ["filterEquipe", "filterSecteur", "filterProfile"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => loadUsers());
    });

    // Recherche avec debounce
    let searchTimeout;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadUsers(), 400);
        });
    }
});


function getParams() {

    const profileSelect = document.getElementById("filterProfile");

    return {
        search: document.getElementById("searchInput").value,
        equipes: document.getElementById("filterEquipe").value,
        secteurs: document.getElementById("filterSecteur").value,
        profiles: profileSelect ? profileSelect.value : ""
    };
}

function loadUsers() {

    const params = new URLSearchParams(getParams()).toString();
    const table = document.getElementById("usersTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/liste-users/?${params}`)
    .then(res => res.json())
    .then(data => {
        table.innerHTML = "";
        if (data.utilisateurs.length === 0) {
            table.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        data.utilisateurs.forEach(c => {
            table.innerHTML += `
            <tr>
                <td>${c.login}</td>
                <td>${c.nom_user}</td>
                <td>${c.tel_user}</td>
                <td>${c.email}</td>
                <td>${c.nom_profile}</td>
                <td>${c.nom_equipe}</td>
                <td>${c.nom_secteur}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(\`${c.login}\`)">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>`;
        });
    });
}

// --- GESTION DES MODALES (DJANGO FORM) ---
function openAddModal() {
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerText = "Ajouter un nouveau utilisateur";
    fetchFormContent('/api/users/create/');
}

function openEditModal(id) {
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerText = `Modifier l'utilisateur #${id}`;
    fetchFormContent(`/api/users/update/${id}/`);
}

function fetchFormContent(url) {
    const modalBody = document.getElementById("modalBody");
    const modalEl = document.getElementById('userModal');
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
                loadUsers();
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

function loadEquipes() {
    fetch("/api/equipes/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterEquipe");
        data.forEach(v => { select.innerHTML += `<option value="${v.id_equipe}">${v.nom_equipe}</option>`; });
    });
}

function loadSecteurs() {
    fetch("/api/secteurs/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterSecteur");
        data.forEach(v => { select.innerHTML += `<option value="${v.id_secteur}">${v.nom_secteur}</option>`; });
    });
}

function loadProfiles() {

    const select = document.getElementById("filterProfile");

    if (!select) return;

    fetch("/api/profiles-user/")
    .then(res => res.json())
    .then(data => {
        data.forEach(v => {
            select.innerHTML += `
                <option value="${v.id_profile_user}">
                    ${v.nom_profile}
                </option>
            `;
        });
    });
}