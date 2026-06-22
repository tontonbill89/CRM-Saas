// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    
    loadEquipes();
    loadVentes(1);
    loadChart();
    loadProductChart();
    loadTeamChart();

    // Écouteurs pour les filtres
    ["pageSize","date_start","date_end","filterEquipe"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => loadVentes(1));
    });

    // Recherche avec debounce
    let searchTimeout;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadVentes(1), 400);
        });
    }
});

// --- GESTION DU TABLEAU ---
function getParams(page = 1) {
    return {
        page: page,
        page_size: document.getElementById("pageSize")?.value || 10,
        date_start: document.getElementById("date_start")?.value || "",
        date_end: document.getElementById("date_end")?.value || "",
        equipes: document.getElementById("filterEquipe")?.value || ""
    };
}

function loadEquipes() {
    fetch("/api/equipes/").then(res => res.json()).then(data => {
        const select = document.getElementById("filterEquipe");
        data.forEach(v => { select.innerHTML += `<option value="${v.id_equipe}">${v.nom_equipe}</option>`; });
    });
}

let currentPage = 1;
function loadVentes(page = 1) {
    currentPage = page;
    const params = new URLSearchParams(getParams(page)).toString();
    const table = document.getElementById("ventesTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/liste-ventes/?${params}`)
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
                <td>${c.id_detail}</td>
                <td>${c.date_vente}</td>
                <td>${c.produit}</td>
                <td>${c.quantite}</td>
                <td>${c.prix_vente.toLocaleString()} GNF</td>
                <td>${c.total_vente.toLocaleString()} GNF</td>
                <td>${c.nom_vendeur}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editClient(${c.id_detail})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>`;
        });

        document.getElementById("tableInfo").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        renderPagination(data);
    })
    .catch(err => {
    table.innerHTML = `<tr><td colspan="10">Erreur de chargement</td></tr>`;
    console.error("Erreur API :", err);
    });

    loadChart();

}

// --- PAGINATION, EXPORT & FILTRES ---
function renderPagination(data) {
    const container = document.getElementById("pagination");
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

function exportData(type) {
    const params = new URLSearchParams({...getParams(), type: type}).toString();
    window.open(`/api/export-visites/?${params}`, "_blank");
}

//Graphique évolution des ventes par parametres.
let chartInstance = null;
function loadChart() {
    const params = new URLSearchParams(getParams()).toString();

    fetch(`/api/evolution-ventes/?${params}`)
    .then(res => res.json())
    .then(data => {

        const ctx = document.getElementById("evolutionChart").getContext("2d");

        // Détruire ancien graphique
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [{
                    label: "Ventes",
                    data: data.totals,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true }
                }
            }
        });
    })
    .catch(err => console.error("Erreur chart:", err));
}

//Graphique vente par équipes.
let teamChart = null;
function loadTeamChart() {
    const params = new URLSearchParams(getParams()).toString();

    fetch(`/api/ventes-par-equipe/?${params}`)
    .then(res => res.json())
    .then(data => {
        const ctx = document.getElementById("teamChart").getContext("2d");

        if (teamChart) teamChart.destroy();

        teamChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.equipes,
                datasets: [{
                    label: "Ventes",
                    data: data.totals
                }]
            },
            options: {
                responsive: true
            }
        });
    });
}

// top-produit vente
let productChart = null;
function loadProductChart() {
    const params = new URLSearchParams(getParams()).toString();

    fetch(`/api/top-produits/?${params}`)
    .then(res => res.json())
    .then(data => {
        const ctx = document.getElementById("topProduit").getContext("2d");

        if (productChart) productChart.destroy();

        productChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.produits,
                datasets: [{
                    label: "Top produits",
                    data: data.totals
                }]
            },
            options: {
                responsive: true
            }
        });
    });
}