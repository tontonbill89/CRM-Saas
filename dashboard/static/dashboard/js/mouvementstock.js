document.addEventListener("DOMContentLoaded", () => {
    chargerMouvementsEnvoyes(1);
    chargerMouvementsRecus(1);
    chargerMouvementsHistorique(1);
});

// --- PAGINATION, EXPORT & FILTRES ---
function renderPagination(data) {
    const container = document.getElementById("pagination");
    container.innerHTML = "";
    let start = Math.max(1, data.current_page - 2);
    let end = Math.min(data.total_pages, data.current_page + 2);
    let html = "";

    html += `<li class="page-item ${!data.has_previous ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="chargerMouvementsEnvoyes(${data.current_page - 1}); return false;">«</a>
             </li>`;

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === data.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="chargerMouvementsEnvoyes(${i}); return false;">${i}</a>
                 </li>`;
    }

    html += `<li class="page-item ${!data.has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="chargerMouvementsEnvoyes(${data.current_page + 1}); return false;">»</a>
             </li>`;
    container.innerHTML = html;
}

let produitsMouvement = [];
function chargerProduits() {

    fetch('/api/liste-produits/')
    .then(response => response.json())
    .then(data => {

        const select =
            document.getElementById(
                'produitSelect'
            );

        if(!select){
            return;
        }

        select.innerHTML = '';

        data.results.forEach(item => {

            select.innerHTML += `
                <option value="${item.id_produit}">
                    ${item.nom_produit}
                </option>
            `;

        });

    });

}
//Chargement de la liste des mouvements envoyés
function chargerMouvementsEnvoyes(page = 1){

    fetch('/api/mouvements-envoyes/')
    .then(r => r.json())
    .then(data => {

        let tbody = document.getElementById('TableMouvementsEnvoyer');

        tbody.innerHTML = '';

        data.mouvements.forEach(item => {
            let badge = '';

            if(item.statut === 'En attente'){
                badge =
                '<span class="badge bg-warning">En attente</span>';
            }
            else if(item.statut === 'Validé'){
                badge ='<span class="badge bg-success">Validé</span>';
            }
            else{
                badge ='<span class="badge bg-danger">Refusé</span>';
            }
            tbody.innerHTML += `
                <tr style="cursor:pointer" onclick="chargerDetailsMouvement('${item.id_mvt}')">
                    <td>${item.id_mvt}</td>
                    <td>${item.date_mvt}</td>
                    <td>${item.destination}</td>
                    <td>${item.mode_mvt}</td>
                    <td>${badge}</td>
                </tr>
            `;
        });
        document.getElementById("tableInfo").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        renderPagination(data);
    });

}
//Chargement de la liste des mouvements réçus
function chargerMouvementsRecus(page = 1){

    fetch('/api/mouvements-recus/')
    .then(r => r.json())
    .then(data => {

        let tbody = document.getElementById('TableMouvementsRecus');

        if(!tbody){
            return;
        }

        tbody.innerHTML = '';

        data.results.forEach(item => {

            let badge = '';

            if(item.statut === 'En attente'){
                badge =
                '<span class="badge bg-warning">En attente</span>';
            }
            else if(item.statut === 'Validé'){
                badge ='<span class="badge bg-success">Validé</span>';
            }
            else{
                badge ='<span class="badge bg-danger">Refusé</span>';
            }

            tbody.innerHTML += `

                <tr style="cursor:pointer" onclick="chargerDetailsMouvement('${item.id_mvt}')">

                    <td>${item.id_mvt}</td>
                    <td>${item.date_mvt}</td>
                    <td>${item.source}</td>
                    <td>${item.mode_mvt}</td>
                    <td>${badge}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="voirMouvement('${item.id_mvt}')">
                            Voir
                        </button>
                        <button class="btn btn-success btn-sm" onclick="validerMouvement('${item.id_mvt}')">
                            Valider
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="refuserMouvement('${item.id_mvt}')">
                            Refuser
                        </button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("tableInfo").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        renderPagination(data);
    });
}

//Chargement de l'historique des mouvements
function chargerMouvementsHistorique(page = 1){

    const statut = document.getElementById('filtreStatut')?.value || '';
    const dateDebut = document.getElementById('dateDebut')?.value || '';
    const dateFin = document.getElementById('dateFin')?.value || '';

    fetch(`/api/mouvements-historique/?statut=${encodeURIComponent(statut)}&date_debut=${dateDebut}&date_fin=${dateFin}`)
    .then(r => r.json())
    .then(data => {

        const tbody = document.getElementById('TableMouvementsHistorique');

        if(!tbody){
            return;
        }

        tbody.innerHTML = '';

        data.results.forEach(item => {

            let badge = '';

            if(item.statut === 'En attente'){
                badge = '<span class="badge bg-warning">En attente</span>';
            }else if(item.statut === 'Validé'){
                badge = '<span class="badge bg-success">Validé</span>';
            }else{
                badge ='<span class="badge bg-danger">Refusé</span>';
            }

            tbody.innerHTML += `
                <tr style="cursor:pointer" onclick="chargerDetailsMouvement('${item.id_mvt}')">
                    <td>${item.id_mvt}</td>
                    <td>${item.date_mvt}</td>
                    <td>${item.source}</td>
                    <td>${item.destination}</td>
                    <td>${item.mode_mvt}</td>
                    <td>${badge}</td>
                    <td>${item.date_validation}</td>
                </tr>
            `;
        });
        document.getElementById("tableInfo").innerText = 
            `${data.total} résultats • Page ${data.current_page}/${data.total_pages}`;
        renderPagination(data);
    });
}
document.addEventListener('change',
    function(e){
        if(e.target.id === 'filtreStatut'){
            chargerMouvementsHistorique();
        }
    }
);

//Chargement des détails mouvements
function chargerDetailsMouvement(id_mvt){

    fetch( `/api/mouvement/details/${id_mvt}/`)
    .then(r => r.json())
    .then(data => {

        const tbody = document.getElementById('TableDetailsMouvements');

        if(!tbody){
            return;
        }

        tbody.innerHTML = '';

        data.results.forEach(item => {

            tbody.innerHTML += `

                <tr>
                    <td>${item.id_detail}</td>
                    <td>${item.produit}</td>
                    <td>${item.quantite}</td>
                </tr>
            `;
        });
    });
}

function validerMouvement(id_mvt){

    if(!confirm("Valider ce mouvement ?")){
        return;
    }

    fetch(`/api/mouvement/valider/${id_mvt}/`)
    .then(r => r.json())
    .then(data => {

        if(data.success){
            chargerMouvementsRecus();
        }else{
            alert(data.message);
        }
    });
}

function refuserMouvement(id_mvt){

    if(!confirm("Refuser ce mouvement ?")){
        return;
    }

    fetch( `/api/mouvement/refuser/${id_mvt}/`)
    .then(r => r.json())
    .then(data => {
        chargerMouvementsRecus();
    });
}

function openAddModal() {
    document
        .getElementById("modalTitle")
        .innerText =
        "Nouveau mouvement";
    fetchFormContent('/api/mouvement/create/');
}

function fetchFormContent(url) {

    const modalBody = document.getElementById("modalBody");
    const modalEl = document.getElementById('mouvementModal');
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);

    fetch(url)
    .then(res => res.text())
    .then(html => {

        modalBody.innerHTML = html;

        instance.show();

        chargerProduits();

        attachFormSubmit( url, instance);
    });
}

function attachFormSubmit(url,instance){

    const modalBody = document.getElementById("modalBody");
    const form =  modalBody.querySelector('form');

    if(!form){
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');

    if(!submitBtn){
        return;
    }

    submitBtn.onclick = function(e){

        e.preventDefault();
        const formData = new FormData(form);

        fetch(url,{
            method:'POST',
            body:formData,
            headers:{
                'X-CSRFToken':
                document.querySelector(
                    '[name=csrfmiddlewaretoken]'
                ).value
            }
        })
        .then(response => {
            if(response.status === 204){
                instance.hide();
                chargerMouvementsEnvoyes();
            }else{
                return response.text();
            }
        })
        .then(html => {

            if(html){
                modalBody.innerHTML = html;
                attachFormSubmit(url, instance);
            }

        });

    };
}

function ajouterProduit(){

    const produit = document.getElementById('produitSelect');
    const quantite = document.getElementById('quantiteInput');

    if(!quantite.value){
        return;
    }
    const existe = produitsMouvement.find(x => x.id == produit.value);

    if(existe){
        existe.quantite += parseInt(quantite.value);
    }else{
        produitsMouvement.push({
            id:
                produit.value,
            nom:
                produit.options[produit.selectedIndex].text,
            quantite:
                parseInt(quantite.value)
        });
    }
    afficherProduits();
    quantite.value = '';
}

function afficherProduits(){
    const tbody = document.getElementById('tbodyProduits');
    tbody.innerHTML = '';
    produitsMouvement.forEach(
        (item,index)=>{
        tbody.innerHTML += `
            <tr>
                <td>${item.nom}</td>
                <td>${item.quantite}</td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm" onclick="supprimerProduit(${index})">
                        X
                    </button>
                </td>
            </tr>
        `;
    });
    document.getElementById('lignesMouvement').value = JSON.stringify(produitsMouvement);
}

function supprimerProduit(index){

    produitsMouvement.splice(
        index,
        1
    );

    afficherProduits();
}

function voirMouvement(idMvt){

    fetch(
        `/api/mouvement/${idMvt}/`
    )
    .then(r => r.json())
    .then(data => {

        let html = `

            <table class="table">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Quantité</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.details.forEach(item => {
            html += `
                <tr>
                    <td>${item.produit}</td>
                    <td>${item.quantite}</td>
                </tr>
            `;
        });
        html += `
                </tbody>
            </table>
        `;
        document.getElementById('modalBody').innerHTML = html;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('mouvementModal')).show();
    });
}


