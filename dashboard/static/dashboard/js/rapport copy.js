// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    loadEquipes();
    loadSecteurs();
    loadKPI();
    loadgraph_vente();
    loadgraph_top();
    loadVentes(1);
    loadVisites(1);

    initAutoFilters();
});

function initAutoFilters() {
    const fields = [
        "date_start",
        "date_end",
        "filterEquipe",
        "filterSecteur"
    ];

    fields.forEach(id => {
        const el = document.getElementById(id);

        if (el) {
            el.addEventListener("change", debounce(applyFilters, 500));
        }
    });
}

function debounce(func, delay) {
    let timeout;

    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func();
        }, delay);
    };
}

function getFilters(page = 1) {
    return {
        date_start: document.getElementById("date_start")?.value || "",
        date_end: document.getElementById("date_end")?.value || "",
        equipes: document.getElementById("filterEquipe")?.value || "",
        secteurs: document.getElementById("filterSecteur")?.value || "",
        page: page
    };
}

function showLoader() {
    document.body.style.opacity = "0.5";
}

function hideLoader() {
    document.body.style.opacity = "1";
}

//Centralisation des filtres

function applyFilters(){

    const { date_start, date_end } = getFilters();

    showLoader();
    currentPageVentes = 1;
    currentPageVisites = 1;

    Promise.all([
        loadKPI(),
        loadgraph_top(),
        loadgraph_vente(),
        loadVentes(1),
        loadVisites(1)
    ]).finally(hideLoader);
}

//KPI
function loadKPI() {
    const filters = getFilters();

    const query = new URLSearchParams(filters).toString();
    //console.log("Query:", query);

    fetch(`/api/dashboard-kpi-rapport/?${query}`)
    .then(res => res.json())
    .then(data => {

        document.getElementById("conversion_kpi").innerText = data.conversion + " %";
        document.getElementById("couverture_kpi").innerText = data.couverture + " %";
        document.getElementById("nombre_visites_kpi").innerText = data.nombre_visites;
        document.getElementById("nombre_ventes_kpi").innerText = data.nombre_ventes;
        document.getElementById("montant_ventes_kpi").innerText = data.montant_ventes + " GNF";
        document.getElementById("nombre_clients_kpi").innerText = data.nombre_clients;
        //document.getElementById("nombre_produits_kpi").innerText = data.nombre_produits_SDF;
        document.getElementById("clients_visites_kpi").innerText = data.clients_visites;
        document.getElementById("moyenne_visite_jour_kpi").innerText = data.moyenne_visite_jour;

    })
    .catch(error => console.error("Erreur KPI:", error));

}
document.addEventListener("DOMContentLoaded", loadKPI);

//Chargement graph evolution des ventes
let chart;
function loadgraph_vente() {

    const query = new URLSearchParams(getFilters()).toString();

    fetch(`/api/dashboard-graph_vente-rapport/?${query}`)
    .then(res => res.json())
    .then(data => {

        if(chart) {
            chart.destroy();
        }

        const canvas = document.getElementById('lineChart');
        const ctx = canvas.getContext('2d');

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.date_ventes,
                datasets: [{
                    label: 'Ventes par jour',
                    data: data.montants,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
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

    })
    .catch(err => console.error("Erreur graphique ventes:", err));
}

//Chargement graph top produit vente
let chartTop;
function loadgraph_top() {
    const query = new URLSearchParams(getFilters()).toString();

    fetch(`/api/dashboard-graph_top-rapport/?${query}`)
    .then(res => res.json())
    .then(data => {
        if(chartTop) chartTop.destroy();

        const ctx = document.getElementById('barChart');

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
    });
}
document.addEventListener("DOMContentLoaded", loadgraph_top);

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

let currentPageVentes = 1;
function loadVentes(page = 1) {
    currentPageVentes = page;

    const filters = getFilters();
    filters.page = page;

    const query = new URLSearchParams(filters).toString();

    fetch(`/api/rapport-ventes/?${query}`)
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById("ventesTable");
        tbody.innerHTML = "";
        if (data.ventes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        data.ventes.forEach(v => {
            tbody.innerHTML += `
                <tr>
                    <td>${v.date}</td>
                    <td>${v.montant_payer}</td>
                    <td>${v.montant_restant}</td>
                    <td>${v.remise}</td>
                    <td>${v.total}</td>
                    <td>${v.nom_user}</td>
                    <td>${v.equipe}</td>
                    <td>${v.secteur}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${v.id_vente})">
                            <i class="fas fa-edit">Edit</i>
                        </button>
                    </td>
                </tr>
            `;
        });

        renderPagination("ventesPagination",data, loadVentes);
    });
}


let currentPageVisites = 1;
function loadVisites(page =1) {
    currentPageVisites = page;

    const filters = getFilters();
    filters.page = page;
    
    const query = new URLSearchParams(getFilters(filters)).toString();

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
                    <td>${v.date}</td>
                    <td>${v.heure_debut}</td>
                    <td>${v.heure_fin}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${v.id_visite})">
                            <i class="fas fa-edit">Détails</i>
                        </button>
                    </td>
                </tr>
            `;
        });

        renderPagination("visitesPagination", data, loadVisites);
    });
}

function exportExcel() {
    const query = new URLSearchParams(getFilters()).toString();
    window.open(`/api/export/ventes/excel/?${query}`, "_blank");
}

function exportPDF() {
    const query = new URLSearchParams(getFilters()).toString();
    window.open(`/api/export/ventes/pdf/?${query}`, "_blank");
}

function renderPagination(containerId, data, callback) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (data.has_previous) {
        container.innerHTML += `<button onclick="${callback.name}(${data.current_page - 1})">Précédent</button>`;
    }

    container.innerHTML += ` Page ${data.current_page} / ${data.total_pages} `;

    if (data.has_next) {
        container.innerHTML += `<button onclick="${callback.name}(${data.current_page + 1})">Suivant</button>`;
    }
}