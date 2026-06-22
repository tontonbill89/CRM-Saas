function getFilters() {
    return {
        date_start: document.getElementById("date_start")?.value || "",
        date_end: document.getElementById("date_end")?.value || ""
    };
}

//Centralisation des filtres

function applyFilters(){
    loadKPI();
    loadMap();
    loadgraph_top();
    loadgraph_vente();
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
document.addEventListener("DOMContentLoaded", loadKPI);

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

//Chargement graph evolution des ventes
let chart;
function loadgraph_vente() {
    const query = new URLSearchParams(getFilters()).toString();

    fetch(`/api/dashboard-graph_vente/?${query}`)
    .then(res => res.json())
    .then(data => {
        if(chart) chart.destroy();

        const ctx = document.getElementById('lineChart');

        chart = new Chart(ctx, {
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
        
    });
}
document.addEventListener("DOMContentLoaded", loadgraph_vente);

//Chargement graph top produit vente
let chartTop;
function loadgraph_top() {
    const query = new URLSearchParams(getFilters()).toString();

    fetch(`/api/dashboard-graph_top/?${query}`)
    .then(res => res.json())
    .then(data => {
        if(chartTop) chartTop.destroy();

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