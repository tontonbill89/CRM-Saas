from django.urls import path
from . import formsclient, formsproduit, formsvisite, mouvementstock
from . import formsvente, formsuser, formsconfig, rapport, formsEquipeSecteurProfile
from . import stockentrepot, entrepot,views


urlpatterns = [
    path('', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('rapport/', rapport.rapport, name='dashboard'),

    path('api/equipes/', formsEquipeSecteurProfile.get_equipes),
    path('api/secteurs/', formsEquipeSecteurProfile.get_secteurs),
    path('api/profiles/', formsEquipeSecteurProfile.get_profiles),

    path('clients/', formsclient.clients_page),
    path('produits/', formsproduit.produits_page),
    path('visites/', formsvisite.visites_page),
    path('ventes/', formsvente.ventes_page),
    path('user/', formsuser.user_page),
    path('rapport/', rapport.rapport),
    path('config/', formsconfig.config_page),
    path('entrepot/',entrepot.entrepot),
    #path('distribution/',""),

    # LES API DU DASHBOARD
    path('api/clients-map/', rapport.clients_map_kpi),
    
    # LES API POUR LA GESTION DES CLIENTS
    path('api/liste-clients/', formsclient.liste_clients),
    path('api/export-clients/', formsclient.export_clients),
    path('api/villes/', formsclient.get_villes),
    path('api/statuts/', formsclient.get_statuts),
    path('api/clients/create/', formsclient.manage_client),
    path('api/clients/update/<int:pk>/', formsclient.manage_client),

    # LES API POUR LA GESTION DES PRODUITS
    path('api/liste-produits/', formsproduit.liste_produits),
    path('api/export-produits/', formsproduit.export_produits),
    path('api/produit-formats/', formsproduit.get_formats),
    path('api/produits/create/', formsproduit.manage_produit),
    path('api/produits/update/<int:pk>/', formsproduit.manage_produit),

    #API POUR LA LISTE DES VISITES
    path('api/liste-visites/', formsvisite.liste_visites),
    path('api/export-visites/', formsvisite.export_visites),

    #API DES VENTES
    path('api/liste-ventes/', formsvente.liste_ventes),
    path('api/evolution-ventes/', formsvente.evolution_ventes),
    path('api/ventes-par-equipe/', formsvente.ventes_par_equipe),
    path('api/top-produits/', formsvente.top_produits),

    # API POUR LA GESTION DES USERS
    path('api/liste-users/', formsuser.liste_user),
    path('api/users/create/', formsuser.manage_user),
    path('api/users/update/<str:pk>/', formsuser.manage_user),
    path('api/profiles-user/', formsuser.get_profiles),

    # API CONFIG
    
    path('api/equipes/create/', formsconfig.manage_equipe),
    path('api/equipes/update/<int:pk>/', formsconfig.manage_equipe),
    path('api/secteurs/create/', formsconfig.manage_secteur),
    path('api/secteurs/update/<int:pk>/', formsconfig.manage_secteur),
    path('api/profiles/create/', formsconfig.manage_profile),
    path('api/profiles/update/<int:pk>/', formsconfig.manage_profile),


    path('api/rapport-ventes/', rapport.dashboard_ventes_list),
    path('api/rapport-visites/', rapport.dashboard_visites_list),
    path('api/rapport-export-visites/', rapport.export_visites),
    path('api/dashboard-kpi/', rapport.dashboard_kpi),
    path('api/dashboard-graph_vente/', rapport.dashboard_graph_vente),
    path('api/dashboard-graph_top/', rapport.dashboard_top5_vente),


    path('api/entrepot/',entrepot.get_entrepot),
    path('api/entrepot/create/', entrepot.manage_entrepot),
    path('api/entrepot/update/<str:pk>/', entrepot.manage_entrepot),

    #path('api/liste-stock/',stockentrepot.get_listestock),


    path('mouvementenvoyer/', mouvementstock.mouvement_envoyer),
    path('mouvementrecu/', mouvementstock.mouvement_recu),
    path('mouvementhistorique/', mouvementstock.mouvement_historique),
    path('mouvementsenreg/', mouvementstock.mouvement_enreg),
    path('api/mouvement/create/', mouvementstock.manage_mouvement),
    path('api/mouvement/<str:id_mvt>/', mouvementstock.detail_mouvement),
    path('api/mouvement/details/<str:id_mvt>/', mouvementstock.liste_details_mouvement),
    path('api/mouvements-envoyes/', mouvementstock.liste_mouvements_envoyes),
    path('api/mouvements-recus/', mouvementstock.liste_mouvements_recus),
    path('api/mouvements-historique/', mouvementstock.liste_mouvements_historique),
    path('api/mouvement/valider/<str:id_mvt>/', mouvementstock.valider_mouvement),
    path('api/mouvement/refuser/<str:id_mvt>/', mouvementstock.refuser_mouvement),
    path('api/destinataires/', mouvementstock.get_destinataires),
    
    path('etatstock/', stockentrepot.etatstock),
    path('api/utilisateurs-stock/', stockentrepot.liste_utilisateurs_stock),
    path('api/etat-stock/', stockentrepot.liste_etat_stock),
]