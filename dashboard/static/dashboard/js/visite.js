let currentPage = 1;

// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    loadVisites(1);
    loadEquipes();
    loadSecteurs();

    // Écouteurs pour les filtres
    ["filterEquipe", "filterSecteur", "searchInput", "pageSize"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => loadVisites(1));
    });

    // Recherche avec debounce
    let searchTimeout;
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadVisites(1), 400);
        });
    }
});

// --- GESTION DU TABLEAU ---
function getParams(page = 1) {
    return {
        page: page,
        page_size: document.getElementById("pageSize")?.value || "",
        search: document.getElementById("searchInput")?.value || "",
        equipes: document.getElementById("filterEquipe")?.value || "",
        secteurs: document.getElementById("filterSecteur")?.value || ""
    };
}

function loadVisites(page = 1) {
    currentPage = page;
    const params = new URLSearchParams(getParams(page)).toString();
    const table = document.getElementById("visitesTable");
    
    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    fetch(`/api/liste-visites/?${params}`)
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
                <td>${c.date_visite}</td>
                <td>${c.nom_boutique}</td>
                <td>${c.cat}</td>
                <td>${c.sub_cat}</td>
                <td>${c.quartier}</td>
                <td>${c.nom_user}</td>
                <td>${c.heure_debut}</td>
                <td>${c.heure_fin}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editClient(${c.id_visite})">
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

// --- PAGINATION, EXPORT & FILTRES ---
function renderPagination(data) {
    const container = document.getElementById("pagination");
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

function exportData(type) {
    const params = new URLSearchParams({...getParams(), type: type}).toString();
    window.open(`/api/export-visites/?${params}`, "_blank");
}

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