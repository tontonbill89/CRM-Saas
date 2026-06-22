document.addEventListener("DOMContentLoaded", () => {
    loadEquipes();
    loadSecteurs();
    loadKPI();
    loadgraph_vente();
    loadgraph_top();
    loadMap();
    loadVentes(1);
    loadVisites(1);
    

    
    document.getElementById("filterEquipe")
        ?.addEventListener("change", applyFilters);

    document.getElementById("filterSecteur")
        ?.addEventListener("change", applyFilters);

    document.getElementById("date_start")
        ?.addEventListener("change", applyFilters);

    document.getElementById("date_end")
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

function getFilters() {
    return {
        date_start: document.getElementById("date_start")?.value || "",
        date_end: document.getElementById("date_end")?.value || "",
        equipes: document.getElementById("filterEquipe")?.value || "",
        secteurs: document.getElementById("filterSecteur")?.value || ""
    };
}

function getFiltersListe(page = 1) {
    return {
        date_start: document.getElementById("date_start")?.value || "",
        date_end: document.getElementById("date_end")?.value || "",
        equipes: document.getElementById("filterEquipe")?.value || "",
        secteurs: document.getElementById("filterSecteur")?.value || "",
        page: page

    };
}

function applyFilters(){
    loadKPI();
    loadgraph_vente();
    loadgraph_top();
    loadMap();
    loadVisites(1);
    loadVentes(1);
}

//KPI
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
        document.getElementById("montant_ventes_kpi").innerText = data.montant_ventes.toLocaleString() + " GNF";
        document.getElementById("nombre_clients_kpi").innerText = data.nombre_clients;
        document.getElementById("nombre_produits_kpi").innerText = data.nombre_produits_SDF;
        document.getElementById("clients_visites_kpi").innerText = data.clients_visites;
        document.getElementById("moyenne_visite_jour_kpi").innerText = data.moyenne_visite_jour;

    })
    .catch(error => console.error("Erreur KPI:", error));

}

let chart;
function loadgraph_vente() {

    const filters = getFilters();

    const query = new URLSearchParams(filters).toString();

    fetch(`/api/dashboard-graph_vente/?${query}`)
    .then(res => res.json())
    .then(data => {

        const ctx = document.getElementById("evolutionChart").getContext("2d");

        // Détruire ancien graphique
        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.date_ventes,
                datasets: [{
                    label: "Ventes",
                    data: data.montants,
                    tension: 0.3,
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
    })
    .catch(err => console.error("Erreur chart:", err));
}

//Chargement graph top produit vente
let chartTop;
function loadgraph_top() {
    const filters = getFilters();

    const query = new URLSearchParams(filters).toString();

    fetch(`/api/dashboard-graph_top/?${query}`)
    .then(res => res.json())
    .then(data => {
        if(chartTop) chartTop.destroy();

        const ctx = document.getElementById('topProduitChart');

        chartTop = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.top_produits,
                datasets: [{
                    label: 'Top ventes produit',
                    data: data.montants,
                }]
            }
        });
        // Mise en forme PowerBI
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, "rgba(75,192,192,0.4)");
        gradient.addColorStop(1, "rgba(75,192,192,0)");
    });
}

// Personalisation des icones
const ICONS = {
    "hotel": "/static/dashboard/icons/hotel.svg",
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
let markers = null;
function loadMap() {

    const filters = getFilters();
    const query = new URLSearchParams(filters).toString();

    if (!map) {
        map = L.map('map',{
            zoomControl: true
        }).setView([9.6412, -13.5784], 12); // Conakry

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);
    }
    if (!markers) {
        markers = L.markerClusterGroup();
        map.addLayer(markers);
    }

    markers.clearLayers();
    
    fetch(`/api/clients-map/?${query}`)
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

//liste vente
let currentPageVentes = 1;
function loadVentes(page = 1) {
    currentPageVentes = page;

    const query = new URLSearchParams(getFiltersListe(page)).toString();

    fetch(`/api/rapport-ventes/?${query}`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById("ventesTable");
        tbody.innerHTML = "";
        if (data.ventes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        data.ventes.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.date_vente}</td>
                    <td>${c.montant_vente.toLocaleString()} GNF</td>
                    <td>${c.montant_payer.toLocaleString()} GNF</td>
                    <td>${c.remise.toLocaleString()} GNF</td>
                    <td>${c.montant_restant.toLocaleString()} GNF</td>
                    <td>${c.nom_boutique}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editClient(${c.id_vente})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>`;
        });

        document.getElementById("tableInfoVente").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        renderPaginationVente(data);
    });
}

let currentPageVisites = 1;
function loadVisites(page =1) {

    currentPageVisites = page;

    const query = new URLSearchParams(getFiltersListe(page)).toString();

    fetch(`/api/rapport-visites/?${query}`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById("visitesTable");
        tbody.innerHTML = "";
        if (data.visites.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        data.visites.forEach(v => {
            tbody.innerHTML += `
                <tr>
                    <td>${v.boutique}</td>
                    <td>${v.sous_categorie}</td>
                    <td>${v.categorie}</td>
                    <td>${v.quartier}</td>
                    <td>${v.nom_user}</td>
                    <td>${v.date_visite}</td>
                    <td>${v.heure_debut}</td>
                    <td>${v.heure_fin}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${v.id_visite})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        document.getElementById("tableInfoVisite").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        renderPaginationVisite(data);
    });
}

function renderPaginationVisite(data) {
    const container = document.getElementById("visitesPagination");
    container.innerHTML = "";
    let start = Math.max(1, data.current_page - 2);
    let end = Math.min(data.total_pages, data.current_page + 2);
    let html = "";

    html += `<li class="page-item ${!data.has_previous ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadVisites(${data.current_page - 1}); return false;">«</a>
             </li>`;

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === data.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadVisites(${i}); return false;">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${!data.has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadVisites(${data.current_page + 1}); return false;">»</a>
             </li>`;
    container.innerHTML = html;
}

function renderPaginationVente(data) {
    const container = document.getElementById("ventesPagination");
    container.innerHTML = "";
    let start = Math.max(1, data.current_page - 2);
    let end = Math.min(data.total_pages, data.current_page + 2);
    let html = "";

    html += `<li class="page-item ${!data.has_previous ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadVentes(${data.current_page - 1}); return false;">«</a>
             </li>`;

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === data.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadVentes(${i}); return false;">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${!data.has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="loadVentes(${data.current_page + 1}); return false;">»</a>
             </li>`;
    container.innerHTML = html;
}