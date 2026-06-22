from django.shortcuts import get_object_or_404, render
from .auth import login_required_custom
from django import forms
from .models import *
from django.http import JsonResponse,HttpResponse
from django.db import transaction
from django.db.models import Q
import json
from datetime import datetime
from django.utils import timezone

@login_required_custom
def mouvement_envoyer(request):
    return render(
        request,
        'dashboard/mouvementenvoyer.html'
    )

@login_required_custom
def mouvement_recu(request):
    return render(
        request,
        'dashboard/mouvementrecu.html'
    )

@login_required_custom
def mouvement_historique(request):
    return render(
        request,
        'dashboard/mouvementhistorique.html'
    )

@login_required_custom
def mouvement_enreg(request):
    return render(
        request,
        'dashboard/mouvementenreg.html'
    )

@login_required_custom
def get_destinataires(request):

    user = request.current_user

    if user.is_admin:

        utilisateurs = Utilisateur.objects.filter(
            id_profile_user__nom_profile='Superviseur'
        ).order_by('nom_user')

    elif user.is_superviseur:

        utilisateurs = Utilisateur.objects.filter(
            id_profile_user__nom_profile='Agent'
        ).order_by('nom_user')

    else:

        utilisateurs = Utilisateur.objects.none()

    data = []

    for u in utilisateurs:

        data.append({
            'login': u.login,
            'nom_user': u.nom_user
        })

    return JsonResponse(data, safe=False)

class MouvementForm(forms.Form):
    date_mvt = forms.DateField(
        widget=forms.DateInput(
            attrs={
                'class': 'form-control',
                'type': 'date'
            }
        )
    )

    MODE_MVT_CHOICES = [
        ('TRANSFERT', 'TRANSFERT'),
        ('RETOUR', 'RETOUR'),
        ('AJUSTEMENT', 'AJUSTEMENT'),
    ]

    mode_mvt = forms.ChoiceField(
        choices=MODE_MVT_CHOICES,
        required=True,
        label="Mode mouvement",
        widget=forms.Select(
            attrs={'class': 'form-select'}
        )
    )

    destinataire = forms.ModelChoiceField(
        queryset=Utilisateur.objects.none(),
        widget=forms.Select(
            attrs={'class': 'form-select'}
        )
    )

    def __init__(self,*args,**kwargs):

        current_user = kwargs.pop(
            'current_user',
            None
        )

        super().__init__(*args,**kwargs)

        if current_user.is_admin:

            self.fields[
                'destinataire'
            ].queryset = Utilisateur.objects.filter(
                id_profile_user__nom_profile='Superviseur'
            )

        elif current_user.is_superviseur:

            self.fields[
                'destinataire'
            ].queryset = Utilisateur.objects.exclude(
                login=current_user.login
            ).order_by('nom_user')

    def clean_date_mvt(self):
        date_mvt = self.cleaned_data['date_mvt']
        if date_mvt > timezone.now().date():
            raise forms.ValidationError(
                "La date ne peut pas être dans le futur."
            )
        return date_mvt

#Generons un id mouvement
def generer_id_mvt():
    dernier = (MvtEntrepot.objects.order_by('-id_mvt').first())

    if not dernier:
        return "MVT000001"

    try:
        numero = int(dernier.id_mvt.replace("MVT", ""))
        return f"MVT{numero+1:06d}"
    
    except:
        return "MVT000001"

@transaction.atomic
@login_required_custom
def manage_mouvement(request):

    if request.method == 'POST':

        form = MouvementForm(request.POST,current_user=request.current_user)

        if form.is_valid():

            lignes_json = request.POST.get('lignesMouvement','[]')
            lignes = json.loads(lignes_json)
            
            user = request.current_user
            
            entrepot_source = Entrepot.objects.get(login=user)
            
            destinataire = form.cleaned_data['destinataire']

            if destinataire.id_user == user.id_user:
                return JsonResponse({
                    'success': False,
                    'message':
                    "Vous ne pouvez pas vous envoyer un mouvement à vous-même."
                })

            entrepot_destination = Entrepot.objects.get(login=destinataire)
            date_mvt = form.cleaned_data['date_mvt']
            mode_mvt = form.cleaned_data['mode_mvt']
            id_mvt = generer_id_mvt()

            for ligne in lignes:

                produit = Produit.objects.get(
                    id_produit=ligne['id']
                )

                stock = StockEntrepot.objects.filter(
                    id_entrepot=entrepot_source,
                    id_produit=produit
                ).first()

                if not stock:

                    form.add_error(
                        None,
                        f"{produit.nom_produit} absent du stock."
                    )

                    return render(
                        request,
                        'dashboard/form_mouvement.html',
                        {'form': form}
                    )

                if stock.quantite < ligne['quantite']:

                    form.add_error(
                        None,
                        f"Stock insuffisant pour "
                        f"{produit.nom_produit}"
                    )

                    return render(
                        request,
                        'dashboard/form_mouvement.html',
                        {'form': form}
                    )
            
            mouvement = MvtEntrepot.objects.create(
                id_mvt=id_mvt,
                date_mvt=date_mvt,
                entrepot_source=entrepot_source.id_entrepot,
                entrepot_destination=entrepot_destination.id_entrepot,
                mode_mvt=mode_mvt,
                statut='En attente'
            )

            for ligne in lignes:
                produit = Produit.objects.get(id_produit=ligne['id'])
                DetailMvtEntrepot.objects.create(
                    id_mvt=mouvement,
                    id_produit=produit,
                    quantite=ligne['quantite']
                )

            return HttpResponse(status=204)

        else:
            print("ERREURS FORMULAIRE")
            print(form.errors)
    else:
        
        form = MouvementForm(current_user=request.current_user)

    return render(request,'dashboard/form_mouvement.html', {'form': form })

@login_required_custom
def liste_mouvements_recus(request):

    user = request.current_user

    try:
        entrepot = Entrepot.objects.get(login=user)

    except Entrepot.DoesNotExist:

        return JsonResponse({'results': []})

    mouvements = (
        MvtEntrepot.objects
        .filter(
            entrepot_destination=entrepot.id_entrepot
        ).order_by('-date_mvt')
    )

    data = []

    for mvt in mouvements:
        
        data.append({

            'id_mvt': mvt.id_mvt,
            'date_mvt': mvt.date_mvt.strftime('%d/%m/%Y'),
            'source':mvt.entrepot_source,
            'mode_mvt':mvt.mode_mvt,
            'statut': mvt.statut
        })

    return JsonResponse({'results': data})

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
        
        data.append({
            'id_mvt': mvt.id_mvt,
            'date_mvt': mvt.date_mvt.strftime('%d/%m/%Y'),
            'destination': mvt.entrepot_destination,
            'mode_mvt': mvt.mode_mvt,
            'statut': mvt.statut
        })
            

    return JsonResponse({
        'mouvements': data
    })

@transaction.atomic
@login_required_custom
def valider_mouvement(request, id_mvt):

    mouvement = get_object_or_404(MvtEntrepot,pk=id_mvt)

    if mouvement.statut != 'En attente':

        return JsonResponse({'success': False,'message': 'Mouvement déjà traité.'})

    user = request.current_user
    entrepot_user = Entrepot.objects.get(
        login=user
    )

    if (mouvement.entrepot_destination != entrepot_user.id_entrepot):

        return JsonResponse({
            'success': False,
            'message':
            'Vous ne pouvez pas valider ce mouvement.'
        })
    
    entrepot_source = Entrepot.objects.get(id_entrepot=mouvement.entrepot_source)
    entrepot_destination = Entrepot.objects.get(id_entrepot=mouvement.entrepot_destination)
    details = DetailMvtEntrepot.objects.filter(id_mvt=mouvement)

    for detail in details:

        stock_source = (
            StockEntrepot.objects
            .filter(
                id_entrepot=entrepot_source,
                id_produit=detail.id_produit
            ).first()
        )

        if not stock_source:

            raise Exception(
                f"Produit absent du stock source : "
                f"{detail.id_produit.nom_produit}"
            )

        if stock_source.quantite < detail.quantite:

            raise Exception(
                f"Stock insuffisant : "
                f"{detail.id_produit.nom_produit}"
            )

    for detail in details:

        stock_source = StockEntrepot.objects.get(
            id_entrepot=entrepot_source,
            id_produit=detail.id_produit
        )

        stock_source.quantite -= detail.quantite
        stock_source.save()

        stock_destination = (
            StockEntrepot.objects
            .filter(
                id_entrepot=entrepot_destination,
                id_produit=detail.id_produit
            ).first()
        )

        if not stock_destination:

            stock_destination = StockEntrepot.objects.create(
                id_entrepot=entrepot_destination,
                id_produit=detail.id_produit,
                quantite=0
            )
        stock_destination.quantite += detail.quantite
        stock_destination.save()

    mouvement.statut = 'Validé'
    mouvement.date_validation = (timezone.now().date())
    mouvement.save()
    
    return JsonResponse({'success': True})

@login_required_custom
def refuser_mouvement(request, id_mvt):

    mouvement = get_object_or_404(
        MvtEntrepot,
        pk=id_mvt
    )

    mouvement.statut = 'Refusé'
    mouvement.date_validation = timezone.now().date()

    mouvement.save()

    return JsonResponse({
        'success': True
    })

@login_required_custom
def liste_details_mouvement(request, id_mvt):

    mouvement = get_object_or_404(
        MvtEntrepot,
        pk=id_mvt
    )

    details = (
        DetailMvtEntrepot.objects
        .filter(id_mvt=mouvement)
        .select_related('id_produit')
    )

    data = []

    for detail in details:

        data.append({

            'id_detail':
                detail.id_detail_mvt,

            'produit':
                detail.id_produit.nom_produit,

            'quantite':
                detail.quantite

        })

    return JsonResponse({
        'results': data
    })

@login_required_custom
def detail_mouvement(request, id_mvt):

    mouvement = get_object_or_404(MvtEntrepot,pk=id_mvt)

    details = (
        DetailMvtEntrepot.objects
        .filter(id_mvt=mouvement)
        .select_related('id_produit')
    )

    data = []

    for item in details:

        data.append({
            'produit': item.id_produit.nom_produit,
            'quantite':item.quantite
        })

    return JsonResponse({
        'id_mvt': mouvement.id_mvt,
        'date_mvt': mouvement.date_mvt.strftime('%d/%m/%Y'),
        'source': mouvement.entrepot_source,
        'destination': mouvement.entrepot_destination,
        'details': data
    })

@login_required_custom
def liste_mouvements_historique(request):
    user = request.current_user
    try:
        entrepot = Entrepot.objects.get(login=user)
        statut = request.GET.get('statut', '')

        date_debut = request.GET.get('date_debut')
        date_fin = request.GET.get('date_fin')

    except Entrepot.DoesNotExist:
        return JsonResponse({'results': []})

    mouvements = (
        MvtEntrepot.objects
        .filter(
            Q(entrepot_source= entrepot.id_entrepot) | Q(entrepot_destination= entrepot.id_entrepot)
        )
    )

    if statut:

        mouvements = mouvements.filter(statut=statut)

    if date_debut:

        mouvements = mouvements.filter(date_mvt__gte=date_debut)

    if date_fin:

        mouvements = mouvements.filter(date_mvt__lte=date_fin)

    mouvements = mouvements.order_by('-date_mvt')

    data = []
    for mvt in mouvements:
        data.append({
            'id_mvt': mvt.id_mvt,
            'date_mvt': mvt.date_mvt.strftime('%d/%m/%Y'),
            'source': mvt.entrepot_source,
            'destination': mvt.entrepot_destination,
            'mode_mvt': mvt.mode_mvt,
            'statut': mvt.statut,
            'date_validation':
                (
                    mvt.date_validation.strftime('%d/%m/%Y')
                    if mvt.date_validation
                    else ''
                )
        })

    return JsonResponse({'results': data})

