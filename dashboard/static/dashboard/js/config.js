// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    loadEquipes();
    loadSecteurs();
    loadProfiles();
});

////// --- GESTION DES MODALES (DJANGO FORM) # Equipe /////////
function openAddModalEquipe() {
    const modalTitle = document.getElementById("modalTitleEquipe");
    modalTitle.innerText = "Ajouter une nouvelle équipe";
    fetchFormContentEquipe('/api/equipes/create/');
}
function openEditModalEquipe(id) {
    const modalTitle = document.getElementById("modalTitleEquipe");
    modalTitle.innerText = `Modifier l'équipe #${id}`;
    fetchFormContentEquipe(`/api/equipes/update/${id}/`);
}
function fetchFormContentEquipe(url) {
    const modalBody = document.getElementById("modalBodyEquipe");
    const modalEl = document.getElementById('equipeModal');
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
    
    fetch(url)
    .then(res => res.text())
    .then(html => {
        modalBody.innerHTML = html;
        instance.show();
        // On appelle une fonction dédiée pour attacher l'event listener
        attachFormSubmitEquipe(url, instance);
    });
}

function attachFormSubmitEquipe(url, instance) {
    const modalBody = document.getElementById("modalBodyEquipe");
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
                loadEquipes();
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
                attachFormSubmitEquipe(url, instance);
            }
        })
        .catch(error => {
            //console.error("Erreur lors de l'envoi :", error);
        });
    };
}


////// --- GESTION DES MODALES (DJANGO FORM) # Secteur /////////
function openAddModalSecteur() {
    const modalTitle = document.getElementById("modalTitleSecteur");
    modalTitle.innerText = "Ajouter un nouveau secteur";
    fetchFormContentSecteur('/api/secteurs/create/');
}
function openEditModalSecteur(id) {
    const modalTitle = document.getElementById("modalTitleSecteur");
    modalTitle.innerText = `Modifier le secteur #${id}`;
    fetchFormContentSecteur(`/api/secteurs/update/${id}/`);
}
function fetchFormContentSecteur(url) {
    const modalBody = document.getElementById("modalBodySecteur");
    const modalEl = document.getElementById('secteurModal');
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
    
    fetch(url)
    .then(res => res.text())
    .then(html => {
        modalBody.innerHTML = html;
        instance.show();
        // On appelle une fonction dédiée pour attacher l'event listener
        attachFormSubmitSecteur(url, instance);
    });
}

function attachFormSubmitSecteur(url, instance) {
    const modalBody = document.getElementById("modalBodySecteur");
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
                loadSecteurs();
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
                attachFormSubmitSecteur(url, instance);
            }
        })
        .catch(error => {
            //console.error("Erreur lors de l'envoi :", error);
        });
    };
}


////// --- GESTION DES MODALES (DJANGO FORM) # Profile /////////
function openAddModalProfile() {
    const modalTitle = document.getElementById("modalTitleProfile");
    modalTitle.innerText = "Ajouter un nouveau profile";
    fetchFormContentProfile('/api/profiles/create/');
}
function openEditModalProfile(id) {
    const modalTitle = document.getElementById("modalTitleProfile");
    modalTitle.innerText = `Modifier le profile #${id}`;
    fetchFormContentProfile(`/api/profiles/update/${id}/`);
}
function fetchFormContentProfile(url) {
    const modalBody = document.getElementById("modalBodyProfile");
    const modalEl = document.getElementById('profileModal');
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
    
    fetch(url)
    .then(res => res.text())
    .then(html => {
        modalBody.innerHTML = html;
        instance.show();
        // On appelle une fonction dédiée pour attacher l'event listener
        attachFormSubmitProfile(url, instance);
    });
}

function attachFormSubmitProfile(url, instance) {
    const modalBody = document.getElementById("modalBodyProfile");
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
                loadProfiles();
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
                attachFormSubmitProfile(url, instance);
            }
        })
        .catch(error => {
            //console.error("Erreur lors de l'envoi :", error);
        });
    };
}


//// CHARGEMENT TABLEAU EQUIPE /////
function loadEquipes() {

    const table = document.getElementById("equipeTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/equipes/`)
    .then(res => res.json())
    .then(res => {
        table.innerHTML = "";
        if (res.length === 0) {
            table.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        res.forEach(c => {
            table.innerHTML += `
            <tr>
                <td>${c.id_equipe}</td>
                <td>${c.nom_equipe}</td>
                
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditModalEquipe(${c.id_equipe})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>`;
        });
    });
}


//// CHARGEMENT TABLEAU SECTEUR /////
function loadSecteurs() {

    const table = document.getElementById("secteurTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/secteurs/`)
    .then(res => res.json())
    .then(res => {
        table.innerHTML = "";
        if (res.length === 0) {
            table.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        res.forEach(c => {
            table.innerHTML += `
            <tr>
                <td>${c.id_secteur}</td>
                <td>${c.nom_secteur}</td>
                
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditModalSecteur(${c.id_secteur})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>`;
        });
    });
}


//// CHARGEMENT TABLEAU PROFILE /////
function loadProfiles() {

    const table = document.getElementById("profileTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/profiles/`)
    .then(res => res.json())
    .then(res => {
        table.innerHTML = "";
        if (res.length === 0) {
            table.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        res.forEach(c => {
            table.innerHTML += `
            <tr>
                <td>${c.id_profile_user}</td>
                <td>${c.nom_profile}</td>
                
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditModalProfile(${c.id_profile_user})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>`;
        });
    });
}