# views.py
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import *
from django.db.models import F, Sum
from django.db.models.functions import TruncDate
from django.core.paginator import Paginator
from .auth import login_required_custom


@login_required_custom
def ventes_page(request):

    return render(request, "dashboard/ventes.html")

# API pour le Calcul des KPI
@login_required_custom
def liste_ventes(request):
    user = request.current_user

    qs = DetailsVente.objects.select_related(
        'id_vente', 
        'id_vente__login',      # Jointure vers Utilisateur via le champ login
        'id_produit',           # Jointure vers Produit
        'id_vente__login__id_equipe'
    ).all()

    if user.is_superviseur:
        qs = qs.filter(
            id_vente__login__id_equipe=user.id_equipe.id_equipe
        )

    # 1. Récupération des filtres depuis l'URL (ex: ?date_start=2023-01-01&id_equipe=2)
    date_start = request.GET.get('date_start')
    date_end = request.GET.get('date_end')
    equipe = request.GET.get("equipes", "")
    page = int(request.GET.get("page", 1))

    try:
        page_size = int(request.GET.get("page_size", 10))
    except:
        page_size = 10
    
    # 3. Application des filtres
    if date_start and date_end:
        qs = qs.filter(id_vente__date_vente__range=[date_start, date_end])

    if equipe:
        qs = qs.filter(id_vente__login__id_equipe=equipe)

    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)
    
    # 4. Préparation des données pour le JSON
    results = []
    for item in page_obj.object_list:
        results.append({
            'id_detail': item.id_detail,
            'date_vente': item.id_vente.date_vente,
            'nom_vendeur': item.id_vente.login.nom_user if item.id_vente.login else "N/A",
            'produit': item.id_produit.nom_produit if item.id_produit else "Inconnu",
            'quantite': item.quantite,
            'prix_vente': float(item.prix_vente),
            'total_vente': float(item.quantite * item.prix_vente),
        })

    data = {
        "results": results,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "total": paginator.count
    }

    # 5. Retour de la réponse
    return JsonResponse(data, safe=False)


# Affichage Evolution des vente sur la periode
@login_required_custom
def evolution_ventes(request):
    user = request.current_user

    qs = DetailsVente.objects.select_related('id_vente')

    if user.is_superviseur:
        qs = qs.filter(
            id_vente__login__id_equipe=user.id_equipe.id_equipe
        )

    date_start = request.GET.get('date_start')
    date_end = request.GET.get('date_end')
    equipe = request.GET.get('equipes')

    if date_start and date_end:
        qs = qs.filter(id_vente__date_vente__range=[date_start, date_end])

    if equipe:
        qs = qs.filter(id_vente__login__id_equipe=equipe)

    data = (qs.annotate(date=TruncDate('id_vente__date_vente'))
        .values('date')
        .annotate(total=Sum(F('quantite') * F('prix_vente')))
        .order_by('date')
    )

    dates = [d['date'].strftime("%Y-%m-%d") for d in data]
    totals = [float(d['total']) for d in data]

    return JsonResponse({
        "dates": dates,
        "totals": totals
    })

@login_required_custom
def ventes_par_equipe(request):   #Ou par secteur en fonction de l'utilisateur connecté
    user = request.current_user

    qs = DetailsVente.objects.select_related(
        'id_vente',
        'id_vente__login',
        'id_vente__login__id_equipe'
    )

    if user.is_superviseur:
        qs = qs.filter(
            id_vente__login__id_equipe=user.id_equipe.id_equipe
        )

        date_start = request.GET.get('date_start')
        date_end = request.GET.get('date_end')

        if date_start and date_end:
            qs = qs.filter(id_vente__date_vente__range=[date_start, date_end])

        data = (
            qs.values('id_vente__login__id_secteur__nom_secteur')
            .annotate(total=Sum(F('quantite') * F('prix_vente')))
            .order_by('-total')
        )

        equipes = [d['id_vente__login__id_secteur__nom_secteur'] or "Sans secteur" for d in data]
        totals = [float(d['total']) for d in data]
    else :

        date_start = request.GET.get('date_start')
        date_end = request.GET.get('date_end')

        if date_start and date_end:
            qs = qs.filter(id_vente__date_vente__range=[date_start, date_end])

        data = (
            qs.values('id_vente__login__id_equipe__nom_equipe')
            .annotate(total=Sum(F('quantite') * F('prix_vente')))
            .order_by('-total')
        )

        equipes = [d['id_vente__login__id_equipe__nom_equipe'] or "Sans équipe" for d in data]
        totals = [float(d['total']) for d in data]

    return JsonResponse({
        "equipes": equipes,
        "totals": totals
    })

@login_required_custom
def top_produits(request):
    user = request.current_user

    date_start = request.GET.get('date_start')
    date_end = request.GET.get('date_end')
    equipe = request.GET.get('equipes')

    qs = DetailsVente.objects.select_related('id_produit', 'id_vente')

    if user.is_superviseur:
        qs = qs.filter(
            id_vente__login__id_equipe=user.id_equipe.id_equipe
        )
    

    if date_start and date_end:
        qs = qs.filter(id_vente__date_vente__range=[date_start, date_end])

    if equipe:
        qs = qs.filter(id_vente__login__id_equipe=equipe)

    data = (
        qs.values('id_produit__nom_produit')
        .annotate(total=Sum(F('quantite') * F('prix_vente')))
        .order_by('-total')[:5]
    )

    produits = [d['id_produit__nom_produit'] for d in data]
    totals = [float(d['total']) for d in data]

    return JsonResponse({
        "produits": produits,
        "totals": totals
    })
