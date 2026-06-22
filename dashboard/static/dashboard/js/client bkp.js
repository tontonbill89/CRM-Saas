
let currentPage = 1;
// recuperation des paramètres de recherche et filtre

function getParams(page = 1) {
    return {
        page: page,
        page_size: document.getElementById("pageSize").value,
        search: document.getElementById("searchInput").value,
        ville: document.getElementById("filterVille").value,
        statut: document.getElementById("filterStatut").value
    };
}







//Centralisation des filtres
function applyFilters(){
    loadClients(1);
    updateMap(allClients);
}

//Chargement de la liste client

function renderTable(clients) {

    let tbody = document.getElementById("clientsTable");
    tbody.innerHTML = "";

    clients.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${c.id}</td>
                <td>${c.nom_boutique}</td>
                <td>${c.tel_gerant}</td>
                <td>${c.statut}</td>
                <td>${c.categorie}</td>
                <td>${c.arrondissement}</td>
                <td>${c.ville}</td>
                <td>${c.latitude}</td>
                <td>${c.longitude}</td>
            </tr>
        `;
    });
}

function loadClients(page = 1) {

    currentPage = page;

    const params = new URLSearchParams(getParams(page)).toString();

    const table = document.getElementById("clientsTable");
    table.innerHTML = `<tr><td colspan="9" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/liste_clients/?${params}`)
    .then(res => res.json())
    .then(data => {

        table.innerHTML = "";

        if (data.results.length === 0) {
            table.innerHTML = `<tr><td colspan="9" class="text-center">Aucun résultat</td></tr>`;
        }

        data.results.forEach(c => {
            table.innerHTML += `
            <tr>
                <td>${c.id_client}</td>
                <td>${c.nom_boutique}</td>
                <td>${c.tel_gerant}</td>
                <td>${c.statut}</td>
                <td>${c.cat}</td>
                <td>${c.arrond}</td>
                <td>${c.ville}</td>
                <td>${c.lat}</td>
                <td>${c.lon}</td>
            </tr>`;
        });

        // Info table
        document.getElementById("tableInfo").innerText =
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;

        renderPagination(data);

    });
}
document.addEventListener("DOMContentLoaded", () => {loadClients(1);});
["searchInput", "filterVille", "filterStatut", "pageSize"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => loadClients(1));
});

function renderPagination(data) {

    const container = document.getElementById("pagination");
    container.innerHTML = "";

    let start = Math.max(1, data.current_page - 2);
    let end = Math.min(data.total_pages, data.current_page + 2);

    let html = "";

    // Bouton précédent
    html += `
        <li class="page-item ${!data.has_previous ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadClients(${data.current_page - 1}); return false;">«</a>
        </li>
    `;

    // Pages numérotées
    for (let i = start; i <= end; i++) {
        html += `
            <li class="page-item ${i === data.current_page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadClients(${i}); return false;">
                    ${i}
                </a>
            </li>
        `;
    }

    // Bouton suivant
    html += `
        <li class="page-item ${!data.has_next ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadClients(${data.current_page + 1}); return false;">»</a>
        </li>
    `;

    container.innerHTML = html;
}

function exportData(type) {

    const params = new URLSearchParams({
        ...getParams(),
        type: type
    }).toString();

    window.open(`/api/export-clients/?${params}`, "_blank");
}

function loadVilles() {
    fetch("/api/villes/")
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById("filterVille");

        data.forEach(v => {
            select.innerHTML += `<option value="${v}">${v}</option>`;
        });
    });
}
document.addEventListener("DOMContentLoaded", loadVilles);

function loadStatuts() {
    fetch("/api/statuts/")
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById("filterStatut");

        data.forEach(v => {
            select.innerHTML += `<option value="${v}">${v}</option>`;
        });
    });
}
document.addEventListener("DOMContentLoaded", loadStatuts);

let searchTimeout;
document.getElementById("searchInput").addEventListener("keyup", () => {

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        loadClients(1);
    }, 400); // debounce
});

////////////////////***********************************/////////////////////////////

// Personalisation des icones
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


//Chargement de la carte client
let map = null;
let markersLayers = null;
let allClients = [];

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    fetchClients(); // charge tout au début
});

//Initialisation de la carte
function initMap(){
    if (!map) {
        map = L.map('map',{
            zoomControl: true
        }).setView([9.6412, -13.5784], 12); // Conakry

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
    }

    if (!markersLayers) {
        markersLayers = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 50,
        });
        map.addLayer(markersLayers);
    }
}

function fetchClients() {
    fetch("api/clients-map/")
        .then(res => res.json())
        .then(data => {
            allClients = data;

            renderTable(allClients);
            updateMap(allClients); // affichage initial
        })
        .catch(err => console.error(err));
}

function updateMap(clients) {

    markersLayer.clearLayers();

    let bounds = [];

    clients.forEach(Client => {

        if (Client.lat && Client.lon) {
            
            //cONSTRUCTION DES ICONES
            const icon = L.icon({
                iconUrl: getIcon(Client.sub_cat),
                iconSize: [32, 32],
                iconAnchor: [17,32]
            });

            const markers = L.marker([pos_clients.lat, pos_clients.lon], { icon: icon })
                .bindPopup(`
                    <div style="min-width:150px">
                        <b style="font-size:15px">${Client.nom_boutique}</b><br>
                        <span style="color:gray">Client</span><br>
                        <small>Lat: ${Client.lat}</small><br>
                        <small>Lon: ${Client.lon}</small>
                        <button class="btn btn-sm btn-primary w-100"
                            onclick="openEditModal(${client.id})">Modifier
                        </button>
                    </div>
            `   );
            markersLayer.addLayer(markers); // seulement ici
        }
        map.addLayer(markersLayer);
        if (markersLayer.getLayers().length > 0) {
            map.fitBounds(markersLayer.getBounds(),{ padding: [30,30]});
        }
    });
}

function openEditModal(clientId) {
    window.location.href = `/clients/${clientId}/edit/`;
}
