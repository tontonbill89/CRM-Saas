$(document).ready(function () {

    $('#ventesTable').DataTable({
        processing: true,
        serverSide: true,
        pageLength: 50,

        ajax: {
            url: "/api/liste-ventes/",
            data: function (d) {
                d.date_start = $('#date_start').val();
                d.date_end = $('#date_end').val();
            }
        },

        columns: [
            { data: "id_detail" },
            { data: "date_vente" },
            { data: "produit" },
            { data: "quantite" },
            { data: "prix_vente" },
            { data: "total_vente" },
            { data: "nom_vendeur" }
        ],

        order: [[0, "desc"]],
        responsive: true
    });

    // Reload automatique quand filtre change
    $('#date_start, #date_end').change(function () {
        $('#ventesTable').DataTable().ajax.reload();
    });

});