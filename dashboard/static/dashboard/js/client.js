let currentPage = 1;

// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    loadClients(1);
    loadVilles();
    loadStatuts();
    loadMap();

    // Écouteurs pour les filtres
    ["filterVille", "filterStatut", "searchInput", "pageSize"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => loadClients(1));
    });

    // Recherche avec debounce
    let searchTimeout;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadClients(1), 400);
        });
    }
});

// --- GESTION DU TABLEAU ---
function getParams(page = 1) {
    return {
        page: page,
        page_size: document.getElementById("pageSize").value,
        search: document.getElementById("searchInput").value,
        ville: document.getElementById("filterVille").value,
        statut: document.getElementById("filterStatut").value,
    };
}

function loadClients(page = 1) {
    currentPage = page;
    const params = new URLSearchParams(getParams(page)).toString();
    const table = document.getElementById("clientsTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/liste-clients/?${params}`)
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
                <td>${c.id_client}</td>
                <td>${c.nom_boutique}</td>
                <td>${c.tel_gerant}</td>
                <td><span class="badge bg-light text-dark">${c.statut}</span></td>
                <td>${c.cat}</td>
                <td>${c.arrond}</td>
                <td>${c.ville}</td>
                <td>${c.lat}</td>
                <td>${c.lon}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${c.id_client})">
                        <i class="fas fa-edit"></i>
                    </button>
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
    modalTitle.innerText = "Ajouter un nouveau client";
    fetchFormContent('/api/clients/create/');
}

function openEditModal(id) {
    const modalTitle = document.getElementById("modalTitle");
    modalTitle.innerText = `Modifier le client #${id}`;
    fetchFormContent(`/api/clients/update/${id}/`);
}

function fetchFormContent(url) {
    const modalBody = document.getElementById("modalBody");
    const modalEl = document.getElementById('clientModal');
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
                loadClients(currentPage);
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
                <a class="page-link" href="#" onclick="loadClients(${data.current_page - 1}); return false;">«</a>
             </li>`;

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === data.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadClients(${i}); return false;">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${!data.has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadClients(${data.current_page + 1}); return false;">»</a>
             </li>`;
    container.innerHTML = html;
}

function exportData(type) {
    const params = new URLSearchParams({...getParams(), type: type}).toString();
    window.open(`/api/export-clients/?${params}`, "_blank");
}

function loadVilles() {
    fetch("/api/villes/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterVille");
        data.forEach(v => { select.innerHTML += `<option value="${v.ville}">${v.ville}</option>`; });
    });
}

function loadStatuts() {
    fetch("/api/statuts/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterStatut");
        data.forEach(v => { select.innerHTML += `<option value="${v.statut}">${v.statut}</option>`; });
    });
}



// --- CARTE ---

const ICONS = {
    "hotel": "/static/dashboard/icons/hotel.png",
    "supermarche": "/static/dashboard/icons/supermarket.png",
    "station service": "/static/dashboard/icons/station.png",
    "pharmacie": "/static/dashboard/icons/pharmacie.png",
    "restaurant": "/static/dashboard/icons/restaurant.png",
    "semi-grossiste": "/static/dashboard/icons/semigrossiste.png",
    "grande boutique": "/static/dashboard/icons/grandeboutique.png"
};

function getIcon(type) {
    const t = (type || "").toLowerCase();
    return ICONS[t] || "/static/dashboard/icons/store.png";
}


let map = null, markers = null;

function loadMap() {
    if (!map) {
        map = L.map('map').setView([9.6412, -13.5784], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        markers = L.markerClusterGroup();
        map.addLayer(markers);
    }
    
    markers.clearLayers();
    const params = new URLSearchParams(getParams()).toString();
    
    fetch(`/api/clients-map/?${params}`)
    .then(res => res.json())
    .then(data => {
        data.forEach(pos_clients => {
            if (pos_clients.lat && pos_clients.lon) {
                
                const icon = L.icon({
                    iconUrl: getIcon(pos_clients.sub_cat),
                    iconSize: [32, 32],
                    iconAnchor: [17,32]
                });

                const marker = L.marker([pos_clients.lat, pos_clients.lon], { icon: icon })
                    .bindPopup(`
                        <div style="min-width:150px">
                            <b style="font-size:15px">${pos_clients.nom_boutique}</b><br>
                            <span style="color:gray">Client</span><br>
                            <small>Lat: ${pos_clients.lat}</small><br>
                            <small>Lon: ${pos_clients.lon}</small>
                        </div>
                `   );
                markers.addLayer(marker);
            }
        });
        if (markers.getLayers().length > 0) map.fitBounds(markers.getBounds(), {padding: [30,30]});
    });
}