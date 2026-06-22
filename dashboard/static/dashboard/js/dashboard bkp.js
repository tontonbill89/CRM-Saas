
function loadKPI() {

    fetch('/api/dashboard-kpi/')
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
let chart;
function loadgraph() {
    fetch('/api/dashboard-graph/')
    .then(res => res.json())
    .then(data => {
        if(chart) chart.destroy();

        const ctx = document.getElementById('chart');

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
document.addEventListener("DOMContentLoaded", loadgraph);
//window.onload = loadgraph;

//Chargement de la carte client
let map = null;

function initMap(){
    if (!map) {
        map = L.map('map').setView([9.6412, -13.5784], 12); // Conakry

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
    }

    return map;
}

function loadMap(pos_clients) {

    fetch('/api/clients-map/')
    .then(res => res.json())
    .then(data => {
        data.forEach(pos_clients => {
            if (pos_clients.lat && pos_clients.lon) {
            L.marker([pos_clients.lat, pos_clients.lon])
                .addTo(map)
                .bindPopup(pos_clients.nom_boutique);
            }
        });
    });
}
//document.addEventListener("DOMContentLoaded", loadMap);
window.onload = loadMap
