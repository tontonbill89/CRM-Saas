from django.shortcuts import render
from .auth import login_required_custom
from django import forms
from .models import *
from datetime import datetime
from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction

@login_required_custom
def mouvement_page(request):
    return render(
        request,
        'dashboard/mouvementstock.html'
    )

class MouvementForm(forms.Form):

    destinataire = forms.ModelChoiceField(
        queryset=Utilisateur.objects.none(),
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    produit = forms.ModelChoiceField(
        queryset=Produit.objects.all(),
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    quantite = forms.IntegerField(
        min_value=1,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if user.is_admin:

            self.fields['destinataire'].queryset = Utilisateur.objects.filter(
                id_profile_user__nom_profile='Superviseur',
                activer='Oui'
            )

        elif user.is_superviseur:

            self.fields['destinataire'].queryset = Utilisateur.objects.filter(
                id_profile_user__nom_profile='Agent',
                activer='Oui'
            )

#Generons un id mouvement
def generer_id_mvt():

    dernier = MvtEntrepot.objects.order_by('-id_mvt').first()

    if not dernier:
        return "MVT000001"

    numero = int(dernier.id_mvt.replace("MVT", ""))

    return f"MVT{numero + 1:06d}"

@login_required_custom
def create_mouvement(request):

    stock = StockEntrepot.objects.filter(
        id_entrepot=entrepot_source,
        id_produit=produit
    ).first()

    if not stock:

        return JsonResponse({
            'success': False,
            'message': 'Produit absent du stock'
        })

    if stock.quantite < quantite:

        return JsonResponse({
            'success': False,
            'message': 'Stock insuffisant'
        })

    if request.method != 'POST':
        return JsonResponse(
            {'success': False},
            status=400
        )

    form = MouvementForm(
        request.current_user,
        request.POST
    )

    if not form.is_valid():

        return JsonResponse({
            'success': False,
            'errors': form.errors
        })

    destinataire = form.cleaned_data['destinataire']
    produit = form.cleaned_data['produit']
    quantite = form.cleaned_data['quantite']

    entrepot_source = Entrepot.objects.get(
        login=request.current_user
    )

    entrepot_destination = Entrepot.objects.get(
        login=destinataire
    )

    id_mvt = generer_id_mvt()

    mouvement = MvtEntrepot.objects.create(
        id_mvt=id_mvt,
        date_mvt=timezone.now().date(),
        entrepot_source=entrepot_source.id_entrepot,
        entrepot_destination=entrepot_destination.id_entrepot,
        valider='Non',
        mode_mvt='TRANSFERT'
    )

    DetailMvtEntrepot.objects.create(
        id_mvt=mouvement,
        id_produit=produit,
        quantite=quantite
    )

    return JsonResponse({
        'success': True,
        'message': 'Mouvement enregistré'
    })

@login_required_custom
def liste_mouvements_attente(request):

    user = request.current_user

    try:
        entrepot = Entrepot.objects.get(login=user)
    except Entrepot.DoesNotExist:
        return JsonResponse({
            'mouvements': []
        })

    mouvements = (
        MvtEntrepot.objects
        .filter(
            entrepot_destination=entrepot.id_entrepot,
            valider='Non'
        )
        .order_by('-date_mvt')
    )

    data = []

    for mvt in mouvements:

        details = DetailMvtEntrepot.objects.filter(
            id_mvt=mvt
        ).select_related('id_produit')

        for detail in details:

            data.append({
            'id_mvt': mvt.id_mvt,
            'date_mvt': mvt.date_mvt.strftime('%d/%m/%Y'),
            'source': mvt.entrepot_source,
            'id_produit': detail.id_produit.id_produit,
            'produit': detail.id_produit.nom_produit,
            'quantite': detail.quantite,
        })

    return JsonResponse({
        'mouvements': data
    })

@login_required_custom
@transaction.atomic
def valider_mouvement(request, id_mvt):

    mouvement = MvtEntrepot.objects.select_for_update().get(
        id_mvt=id_mvt
    )

    entrepot_user = Entrepot.objects.get(
        login=request.current_user
    )

    if mouvement.entrepot_destination != entrepot_user.id_entrepot:

        return JsonResponse({
            'success': False,
            'message': 'Accès refusé'
        })

    if mouvement.valider == 'Oui':

        return JsonResponse({
            'success': False,
            'message': 'Déjà validé'
        })

    details = DetailMvtEntrepot.objects.filter(
        id_mvt=mouvement
    )

    for detail in details:

        stock_source = StockEntrepot.objects.select_for_update().get(
            id_entrepot__id_entrepot=mouvement.entrepot_source,
            id_produit=detail.id_produit
        )

        entrepot_dest = Entrepot.objects.get(
            id_entrepot=mouvement.entrepot_destination
        )

        stock_dest, created = StockEntrepot.objects.get_or_create(
            id_entrepot=entrepot_dest,
            id_produit=detail.id_produit,
            defaults={
                'quantite': 0
            }
        )

        if stock_source.quantite < detail.quantite:

            return JsonResponse({
                'success': False,
                'message': (
                    f'Stock insuffisant '
                    f'pour {detail.id_produit.nom_produit}'
                )
            })

        stock_source.quantite -= detail.quantite
        stock_dest.quantite += detail.quantite

        stock_source.save()
        stock_dest.save()

    mouvement.valider = 'Oui'
    mouvement.save()

    return JsonResponse({
        'success': True
    })


@login_required_custom
def refuser_mouvement(
    request,
    id_mvt
):

    mouvement = MvtEntrepot.objects.get(
        id_mvt=id_mvt
    )

    mouvement.mode_mvt = 'REFUSE'

    mouvement.save()

    return JsonResponse({
        'success': True
    })


@login_required_custom
def liste_mouvements_envoyes(request):

    user = request.current_user

    try:
        entrepot = Entrepot.objects.get(login=user)
    except Entrepot.DoesNotExist:
        return JsonResponse({
            'mouvements': []
        })

    mouvements = (
        MvtEntrepot.objects
        .filter(
            entrepot_source=entrepot.id_entrepot
        )
        .order_by('-date_mvt')
    )

    data = []

    for mvt in mouvements:

        details = DetailMvtEntrepot.objects.filter(
            id_mvt=mvt
        ).select_related('id_produit')

        for detail in details:

            statut = "En attente"

            if mvt.valider == "Oui":
                statut = "Validé"

            if mvt.mode_mvt == "REFUSE":
                statut = "Refusé"

            data.append({
                'id_mvt': mvt.id_mvt,
                'date_mvt': mvt.date_mvt.strftime('%d/%m/%Y'),
                'destination': mvt.entrepot_destination,
                'produit': detail.id_produit.nom_produit,
                'quantite': detail.quantite,
                'statut': statut
            })

    return JsonResponse({
        'mouvements': data
    })