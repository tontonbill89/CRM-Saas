# views.py
import csv

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse, HttpResponse
from django.db.models import Sum
import openpyxl
from .models import *
from .auth import login_required_custom

# Affichage Dashboard/Accueil
@login_required_custom
def rapport(request):
    return render(request, "dashboard/rapport.html")

# API pour le Calcul des KPI
@login_required_custom
def dashboard_kpi(request):
    user = request.current_user

    ventes_qs = Vente.objects.select_related('login').all()
    visites_qs = Visite.objects.all()
    
    if user.is_superviseur:
        ventes_qs = ventes_qs.filter(login__id_equipe=user.id_equipe.id_equipe)
        visites_qs = visites_qs.filter(login__id_equipe=user.id_equipe.id_equipe)

    date_start = request.GET.get('date_start')
    date_end = request.GET.get('date_end')
    equipe = request.GET.get("equipes", "")
    secteur = request.GET.get('secteurs')

    if date_start and date_end:
        ventes_qs = ventes_qs.filter(date_vente__range=[date_start, date_end])
        visites_qs = visites_qs.filter(date_visite__range=[date_start, date_end])

    if equipe:
        ventes_qs = ventes_qs.filter(login__id_equipe=equipe)
        visites_qs = visites_qs.filter(login__id_equipe=equipe)

    if secteur:
        ventes_qs = ventes_qs.filter(login__id_secteur=secteur)
        visites_qs = visites_qs.filter(login__id_secteur=secteur)

    nombre_clients = Client.objects.count()
    nombre_visites = visites_qs.count()
    nombre_ventes = ventes_qs.count()
    clients_visites = visites_qs.values('id_client').distinct().count()
    nombre_produits_SDF = Produit.objects.count()
    
    conversion = (nombre_ventes / nombre_visites * 100) if nombre_visites else 0
    couverture = (clients_visites / nombre_clients * 100) if nombre_clients else 0

    montant_ventes = ventes_qs.aggregate(total=Sum('montant_vente'))['total'] or 0

    data = {
        "conversion": round(conversion, 2),
        "couverture": round(couverture, 2),
        "montant_ventes": montant_ventes,
        "nombre_visites": nombre_visites,
        "nombre_ventes": nombre_ventes,
        "nombre_clients": nombre_clients,
        "clients_visites": clients_visites,
        "moyenne_visite_jour": 0,
        "nombre_produits_SDF": nombre_produits_SDF,
    }

    return JsonResponse(data)


# Affichage graph vente
@login_required_custom
def dashboard_graph_vente(request):
    user = request.current_user

    ventes_qs = Vente.objects.select_related('login').all()

    if user.is_superviseur:
        ventes_qs = ventes_qs.filter(login__id_equipe=user.id_equipe.id_equipe)


    equipe = request.GET.get('equipes')
    secteur = request.GET.get('secteurs')
    date_start = request.GET.get('date_start')
    date_end = request.GET.get('date_end')

    if equipe:
        ventes_qs = ventes_qs.filter(login__id_equipe=equipe)

    if secteur:
        ventes_qs = ventes_qs.filter(login__id_secteur=secteur)

    if date_start and date_end:
        ventes_qs = ventes_qs.filter(date_vente__range=[date_start, date_end])

    ventes_par_jour = (
        ventes_qs
        .values('date_vente')
        .annotate(total=Sum('montant_vente'))
        .order_by('date_vente')
    )

    date_ventes = [str(v['date_vente']) for v in ventes_par_jour]
    montants = [float(v['total']) for v in ventes_par_jour]

    data = {
        "date_ventes": date_ventes,
        "montants": montants
    }
    return JsonResponse(data)

# Affichage des top 5 produits vendu
@login_required_custom
def dashboard_top5_vente(request):
    user = request.current_user
    ventes_top_qs = DetailsVente.objects.select_related('id_vente','id_produit').all()

    if user.is_superviseur:
        ventes_top_qs = ventes_top_qs.filter(id_vente__login__id_equipe=user.id_equipe.id_equipe)
    
    equipe = request.GET.get('equipes')
    secteur = request.GET.get('secteurs')
    date_start = request.GET.get('date_start')
    date_end = request.GET.get('date_end')

    if equipe:
        ventes_top_qs = ventes_top_qs.filter(id_vente__login__id_equipe=equipe)

    if secteur:
        ventes_top_qs = ventes_top_qs.filter(id_vente__login__id_secteur=secteur)
    
    if date_start and date_end:
        ventes_top_qs = ventes_top_qs.filter(id_vente__date_vente__range=[date_start, date_end]) # ici id_vente__ est la clé etrangère qui permet de lier details_vente et vente 

    top5_produit_vente = (
        ventes_top_qs
        .values('id_produit__nom_produit')
        .annotate(total=Sum('prix_vente'))
        .order_by('-total')[:5]
    )

    top_produits = [t['id_produit__nom_produit'] for t in top5_produit_vente]
    montants = [float(t['total']) for t in top5_produit_vente]

    data = {
        "top_produits": top_produits,
        "montants": montants,
    }
    return JsonResponse(data)

# Affichage liste des ventes
@login_required_custom
def dashboard_ventes_list(request):
    user = request.current_user
    ventes_qs = Vente.objects.select_related('id_visite','id_visite__id_client','login').all()

    if user.is_superviseur:
        ventes_qs = ventes_qs.filter(login__id_equipe=user.id_equipe.id_equipe)

    date_start = request.GET.get('date_start')
    date_end = request.GET.get('date_end')
    equipe = request.GET.get('equipes')
    secteur = request.GET.get('secteurs')
    page = int(request.GET.get("page", 1))
    page_size = 25

    if date_start and date_end:
        ventes_qs = ventes_qs.filter(date_vente__range=[date_start, date_end])

    if equipe:
        ventes_qs = ventes_qs.filter(login__id_equipe=equipe)

    if secteur:
        ventes_qs = ventes_qs.filter(login__id_secteur=secteur)

    paginator = Paginator(ventes_qs, page_size)
    page_obj = paginator.get_page(page)
    
    
    #ventes = ventes_qs.select_related('user','id_equipe','id_secteur').order_by('-date_vente')[:100]

    ventes = []
    for v in page_obj.object_list:
        ventes.append({
            "id_vente" : v.id_vente,
            "date_vente": v.date_vente,
            "montant_payer": v.montant_payer if v.montant_payer else 0,
            "montant_restant": v.montant_restant if v.montant_restant else 0,
            "remise": v.remise if v.remise else 0,
            "montant_vente": v.montant_vente if v.montant_vente else 0,
            "nom_boutique": v.id_visite.id_client.nom_boutique if v.id_visite and v.id_visite.id_client else "-"
        })

    return JsonResponse({
        "ventes": ventes,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
        "total": paginator.count
    })

@login_required_custom
def dashboard_visites_list(request):
    user = request.current_user
    visites_qs = Visite.objects.select_related('id_client','login').all()

    if user.is_superviseur:
        visites_qs = visites_qs.filter(login__id_equipe=user.id_equipe.id_equipe)
    
    date_start = request.GET.get('date_start')
    date_end = request.GET.get('date_end')
    equipe = request.GET.get('equipes')
    secteur = request.GET.get('secteurs')
    page = int(request.GET.get("page", 1))
    page_size = 25

    if date_start and date_end:
        visites_qs = visites_qs.filter(date_visite__range=[date_start, date_end])

    if equipe:
        visites_qs = visites_qs.filter(login__id_equipe=equipe)

    if secteur:
        visites_qs = visites_qs.filter(login__id_secteur=secteur)

    paginator = Paginator(visites_qs,page_size)
    page_obj = paginator.get_page(page)

    visites = []
    for v in page_obj:
        visites.append({
            "id_visite": v.id_visite,
            "boutique": v.id_client.nom_boutique if v.id_client else "-",
            "sous_categorie": v.id_client.sub_cat if v.id_client else "-",
            "categorie": v.id_client.cat if v.id_client else "-",
            "quartier": v.id_client.quartier if v.id_client else "-",
            "nom_user": v.login.nom_user if v.login.nom_user else "-",
            "date_visite": v.date_visite,
            "heure_debut": v.heure_debut.strftime("%H:%M") if v.heure_debut else "--:--",
            "heure_fin": v.heure_fin.strftime("%H:%M") if v.heure_fin else "--:--"
        })

    return JsonResponse({
        "visites": visites,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "current_page": page_obj.number,
        "total_pages": paginator.num_pages,
        "total": paginator.count
    })

############ EXOPRT EXCEL ET PDF

@login_required_custom
def export_visites(request):
    user = request.current_user

    qs = Visite.objects.select_related(
        'id_client', 'login',
        'login__id_equipe',
        'login__id_secteur'
    )

    if user.is_superviseur:
        qs = qs.filter(login__id_equipe=user.id_equipe.id_equipe)

    search = request.GET.get("search", "").strip()
    equipe = request.GET.get("equipe", "")
    secteur = request.GET.get("secteur", "")
    export_type = request.GET.get("type", "excel")


    if search:
        qs = qs.filter(id_client__nom_boutique__icontains=search)

    if equipe:
        qs = qs.filter(login__id_equipe__id_equipe=equipe)

    if secteur:
        qs = qs.filter(login__id_secteur__id_secteur=secteur)

    qs = qs.order_by("-date_visite")

    headers = [
        'Date', 'Boutique', 'Catégorie', 'Sous Catégorie',
        'Quartier', 'Agent', 'Heure début', 'Heure fin', 'Equipe', 'Secteur'
    ]

    rows = []
    for v in qs:
        rows.append([
            v.date_visite,
            v.id_client.nom_boutique if v.id_client else "",
            v.id_client.cat if v.id_client else "",
            v.id_client.sub_cat if v.id_client else "",
            v.id_client.quartier if v.id_client else "",
            v.login.nom_user if v.login else "",
            v.heure_debut.strftime("%H:%M") if v.heure_debut else "",
            v.heure_fin.strftime("%H:%M") if v.heure_fin else "",
            v.login.id_equipe.nom_equipe if v.login and v.login.id_equipe else "",
            v.login.id_secteur.nom_secteur if v.login and v.login.id_secteur else "",
        ])

    if export_type == "csv":
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="visites.csv"'
        writer = csv.writer(response)
        writer.writerow(headers)
        writer.writerows(rows)
        return response

    elif export_type == "excel":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Visites"
        ws.append(headers)
        for r in rows:
            ws.append(r)

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=visites.xlsx'
        wb.save(response)
        return response

@login_required_custom
def clients_map_kpi(request):

    pos_clients = list(Client.objects.values(
        'nom_boutique', 'lat', 'lon','sub_cat','cat','id_client'
    ))
    
    return JsonResponse(pos_clients, safe=False)

