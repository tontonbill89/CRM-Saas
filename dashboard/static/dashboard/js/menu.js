//Script pour le menu
document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");
    const content = document.querySelector(".container-fluid");

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("active");
        content.classList.toggle("shift");
    });
});


function getFilters() {
    return {
        date_start: document.getElementById("date_start")?.value || "",
        date_end: document.getElementById("date_end")?.value || ""
    };
}

//Centralisation des filtres

function applyFilters(){
    loadKPI();
    loadgraph_top();
    loadgraph_vente();
    loadMap();
    loadClients(1);
    //loadMap();
}


function loadKPI() {
    const filters = getFilters();
    //console.log("Filters:", filters);

    const query = new URLSearchParams(filters).toString();
    //console.log("Query:", query);

    fetch(`/api/dashboard-kpi/?${query}`)
    .then(res => res.json())
    .then(data => {

        document.getElementById("conversion_kpi").innerText = data.conversion + " %";
        document.getElementById("couverture_kpi").innerText = data.couverture + " %";
        document.getElementById("nombre_visites_kpi").innerText = data.nombre_visites;
       // document.getElementById("nombre_ventes_kpi").innerText = data.nombre_ventes;
        document.getElementById("montant_ventes_kpi").innerText = data.montant_ventes + " GNF";
        document.getElementById("nombre_clients_kpi").innerText = data.nombre_clients;
        document.getElementById("nombre_produits_kpi").innerText = data.nombre_produits_SDF;
        document.getElementById("clients_visites_kpi").innerText = data.clients_visites;
        document.getElementById("moyenne_visite_jour_kpi").innerText = data.moyenne_visite_jour;

    })
    .catch(error => console.error("Erreur KPI:", error));

}
document.addEventListener("DOMContentLoaded", loadKPI);
//window.onload = loadKPI;


//Chargement graph evolution des ventes
let chartVente;
function loadgraph_vente() {
    const query = new URLSearchParams(getFilters()).toString();

    fetch(`/api/dashboard-graph_vente/?${query}`)
    .then(res => res.json())
    .then(data => {
        if(chartVente) chartVente.destroy();

        const ctx = document.getElementById('lineChart');

        chartVente = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Vente par jours',
                    data: data.values,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales:{
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                            beginAtZero: true
                    }
                }
            }
        });
        // Mise en forme PowerBI
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, "rgba(75,192,192,0.4)");
        gradient.addColorStop(1, "rgba(75,192,192,0)");

        datasets: [{
            label: "Ventes",
            data: data.values,
            backgroundColor: gradient,
            borderColor: "#4bc0c0",
            tension: 0.4,
            fill: true
        }]
        
    });
}
document.addEventListener("DOMContentLoaded", loadgraph_vente);
//window.onload = loadgraph;

//Chargement graph top produit vente
let chartTop;
function loadgraph_top() {
    const query = new URLSearchParams(getFilters()).toString();

    fetch(`/api/dashboard-graph_top/?${query}`)
    .then(res => res.json())
    .then(data => {
        if(chartTop) chart.destroy();

        const ctx = document.getElementById('barChart');

        chartTop = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Top ventes produit',
                    data: data.values,
                }]
            }
        });
    });
}
document.addEventListener("DOMContentLoaded", loadgraph_top);

let map = null;
let markers = null;
// Personalisation des icones
const ICONS = {
    "hotel": "/static/icons/hotel.svg",
    "supermarche": "/static/icons/supermarket.png",
    "station service": "/static/icons/station.png",
    "pharmacie": "/static/icons/pharmacie.png",
    "restaurant": "/static/icons/restaurant.png",
    "semi-grossiste": "/static/icons/semigrossiste.png",
    "grande boutique": "/static/icons/grandeboutique.png"
};

function getIcon(type) {
    const t = (type || "").toLowerCase();
    return ICONS[t] || "/static/icons/store.png";
}

//Chargement de la carte client
function loadMap() {

    if (!map) {
        map = L.map('map',{
            zoomControl: true
        }).setView([9.6412, -13.5784], 12); // Conakry

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
    }
    if (!markers) {
        markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 50,
            iconCreateFunction: function(cluster) {
                return L.divIcon({
                    html: `<div class="cluster-circle">${cluster.getChildCount()}</div>`,
                    className: 'custom-cluster',
                    iconSize: [40, 40]
                });
            }
        });
        map.addLayer(markers);
    }

    markers.clearLayers();
    
    fetch('/api/clients-map/')
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
                markers.addLayer(marker); // ✅ seulement ici
            }
        });
        map.addLayer(markers);
        if (markers.getLayers().length > 0) {
            map.fitBounds(markers.getBounds(),{ padding: [30,30]});
        }
    });
}
document.addEventListener("DOMContentLoaded", loadMap);
//window.onload = loadMap

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

//Chargement de la liste client

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