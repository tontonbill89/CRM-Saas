document.addEventListener("DOMContentLoaded", () => {

    chargerUtilisateursStock();

    const tbody = document.getElementById('TableEtatStock');

    if(tbody){
        tbody.innerHTML = '';
    }
});

function chargerUtilisateursStock(){

    fetch('/api/utilisateurs-stock/')
    .then(r => r.json())
    .then(data => {

        const select = document.getElementById('UtilisateurStock');

        if(!select){
            return;
        }

        select.innerHTML = '<option value="">Sélectionner</option>';

        data.results.forEach(item => {

            select.innerHTML += `

                <option value="${item.login}"> ${item.nom_user}</option>
            `;
        });
    });
}

let currentPage = 1;
function chargerEtatStock(page = 1){

    currentPage = page;
    const tbody = document.getElementById('TableEtatStock');
    const table = document.getElementById("TableEtatStock");

    const login =document.getElementById('UtilisateurStock')?.value || '';

    table.innerHTML = `<tr><td colspan="10" class="text-center">Chargement...</td></tr>`;

    if(!login){
        return;
    }

    fetch(`/api/etat-stock/?login=${login}&page=${page}&page_size=25`)
    .then(r => r.json())
    .then(data => {

        if(!login){
            table.innerHTML = '';
            document.getElementById('pagination').innerHTML = '';
            document.getElementById('tableInfo').innerHTML = '';
            return;
        }

        table.innerHTML = "";
        if (data.results.length === 0) {
            table.innerHTML = `<tr><td colspan="10" class="text-center">Aucun résultat</td></tr>`;
            return;
        }

        data.results.forEach(item => {

            let badgeEtat = '';

            if(item.quantite == 0){
                badgeEtat ='<span class="badge bg-danger">Rupture</span>';
            }else if(item.quantite < 50){
                badgeEtat ='<span class="badge bg-warning text-dark">Critique</span>';
            }else if(item.quantite < 100){
                badgeEtat ='<span class="badge bg-info text-dark">Faible</span>';
            }else{
                badgeEtat ='<span class="badge bg-success">Normal</span>';
            }

            tbody.innerHTML += `
                <tr>
                    <td>${item.produit}</td>
                    <td><strong>${item.quantite}</strong></td>
                    <td>${badgeEtat}</td>
                </tr>
            `;
        });
        document.getElementById("tableInfo").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        
        console.log(data);
        renderPagination(data);
    });
}
document.addEventListener('change',
    function(e){
        if(
            e.target.id === 'UtilisateurStock'
        ){
            chargerEtatStock();
        }
    }
);

// --- PAGINATION, EXPORT & FILTRES ---
function renderPagination(data) {
    const container = document.getElementById("pagination");
    container.innerHTML = "";
    let start = Math.max(1, data.current_page - 2);
    let end = Math.min(data.total_pages, data.current_page + 2);
    let html = "";

    html += `<li class="page-item ${!data.has_previous ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="chargerEtatStock(${data.current_page - 1}); return false;">«</a>
             </li>`;

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === data.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="chargerEtatStock(${i}); return false;">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${!data.has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="chargerEtatStock(${data.current_page + 1}); return false;">»</a>
             </li>`;
    container.innerHTML = html;
}