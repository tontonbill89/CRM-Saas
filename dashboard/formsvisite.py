from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from .models import Visite, DetailsVisiteProduit
from django.core.paginator import Paginator
import csv, openpyxl
from .auth import login_required_custom


@login_required_custom
def visites_page(request):
    return render(request, "dashboard/visites.html")

@login_required_custom
def liste_visites(request):
    user = request.current_user

    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 50))
    search = request.GET.get("search", "")

    qs = Visite.objects.select_related('id_client', 'login').all().order_by('-date_visite')

    if user.is_superviseur:
        qs = qs.filter(
            login__id_equipe=user.id_equipe
    )

    equipe = request.GET.get("equipes", "")
    secteur = request.GET.get("secteurs", "")
    
    if search:
        qs = qs.filter(id_client__nom_boutique__icontains=search)

    if equipe:
        qs = qs.filter(login__id_equipe__id_equipe=equipe)

    if secteur:
        qs = qs.filter(login__id_secteur__id_secteur=secteur)

    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)
    
    results = []
    for v in page_obj.object_list:
        results.append({
            "date_visite": v.date_visite,
            "nom_boutique": v.id_client.nom_boutique if v.id_client else "N/A",
            "cat": v.id_client.cat if v.id_client else "N/A",
            "sub_cat": v.id_client.sub_cat if v.id_client else "N/A",
            "quartier": v.id_client.quartier if v.id_client else "N/A",

            # sécurisé
            "nom_user": (
                v.login.nom_user.strip()
                if v.login and v.login.nom_user
                else "Anonyme"
            ),

            "heure_debut": v.heure_debut.strftime("%H:%M") if v.heure_debut else "--:--",
            "heure_fin": v.heure_fin.strftime("%H:%M") if v.heure_fin else "--:--",
            "id_visite": v.id_visite,

            # affichage lisible
            "equipe": v.login.id_equipe.nom_equipe if v.login and v.login.id_equipe else "N/A",
            "secteur": v.login.id_secteur.nom_secteur if v.login and v.login.id_secteur else "N/A"
        })

    data = {
        "results": results,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "total": paginator.count
    }
    
    return JsonResponse(data)

def export_visites(request):
    
    search = request.GET.get("search", "")
    equipe = request.GET.get("equipe", "")
    secteur = request.GET.get("secteur","")
    export_type = request.GET.get("type", "csv")

    qs = Visite.objects.select_related('id_client', 'login').all().order_by('-date_visite')

    if search:
        qs = qs.filter(nom_boutique__icontains=search)

    if equipe:
        qs = qs.filter(equipe__iexact=format)

    if secteur:
        qs = qs.filter(secteur__iexact=format)

    qs = qs.order_by("-date_visite")

    fields = ['date_visite', 'nom_boutique', 'cat', 'sub_cat', 'quartier',
        'nom_utilisateur', 'heure_debut','heure_fin','nom_user','id_equipe','id_secteur'
    ]

    # Export CSV

    if export_type == "csv":
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="Visites.csv"'

        writer = csv.writer(response)
        writer.writerow(fields)

        for obj in qs:
            writer.writerow([getattr(obj, f) for f in fields])

        return response

    # Export EXCEL
    elif export_type == "excel":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Visites"

        ws.append(fields)

        for obj in qs:
            ws.append([getattr(obj, f) for f in fields])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=Visites.xlsx'

        wb.save(response)
    
    return response

def export_visites(request):
    search = request.GET.get("search", "").strip()
    equipe = request.GET.get("equipe", "")
    secteur = request.GET.get("secteur", "")
    export_type = request.GET.get("type", "csv")

    qs = Visite.objects.select_related(
        'id_client', 'login',
        'login__id_equipe',
        'login__id_secteur'
    )

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
    
def details_visite_produit(request, id_visite):

    details = DetailsVisiteProduit.objects.select_related(
        'id_produit',
        'id_visite'
    ).filter(id_visite=id_visite)

    data = []

    for d in details:
        data.append({
            "produit": d.id_produit.nom_produit if d.id_produit else "-",
            "quantite": d.quantite if d.quantite else 0,
            "prix": float(d.prix) if d.prix else 0,
            "montant": float(d.montant) if d.montant else 0,
            "montant": float(d.montant) if d.montant else 0,
            "montant": float(d.montant) if d.montant else 0,
        })

    return JsonResponse(data, safe=False)