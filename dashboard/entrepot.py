from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django import forms
from .models import *
from .auth import login_required_custom,admin_required
from django.core.exceptions import PermissionDenied


@login_required_custom
@admin_required
def entrepot(request):

    return render(request, "dashboard/entrepot.html")

@login_required_custom
@admin_required
def get_entrepot(request):

    user = request.current_user

    qs = Entrepot.objects.select_related(
        'login',
        'login__id_equipe',
        'login__id_secteur'
    )

    if user.is_superviseur:
        qs = qs.filter(
            login__id_equipe=user.id_equipe.id_equipe
        )

    equipe = request.GET.get("equipes", "")
    secteur = request.GET.get("secteurs", "")

    if equipe:
        qs = qs.filter(login__id_equipe=equipe)

    if secteur:
        qs = qs.filter(login__id_secteur=secteur)

    data = []
    for item in qs:
        data.append({
            'id_entrepot': item.id_entrepot,
            'id_equipe': item.login.id_equipe.id_equipe if item.login.id_equipe else None,
            'id_secteur': item.login.id_secteur.id_secteur if item.login.id_secteur else '',
            'nom_user': item.login.nom_user,
        })
    return JsonResponse({"entrepots": data})

class EntrepotForm(forms.ModelForm):
    class Meta:
        model = Entrepot
        # On liste les champs du modèle
        fields = [
            'id_entrepot', 'login'
        ]
        
        # Ajout des classes Bootstrap aux widgets
        widgets = {
            'id_entrepot': forms.TextInput(attrs={'class': 'form-control'}),
            'login': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['login'].queryset = Utilisateur.objects.all()

        self.fields['login'].empty_label = ""

@login_required_custom
@admin_required
def manage_entrepot(request, pk=None):
    if pk:
        entrepots = get_object_or_404(Entrepot, pk=pk)
        
        # Sécurité superviseur
        if request.current_user.is_superviseur:
            if entrepots.login.id_equipe != request.current_user.id_equipe:
                raise PermissionDenied
    else:
        entrepots = None

    if request.method == 'POST':
        form = EntrepotForm(request.POST, instance=entrepots)
        if form.is_valid():

            # Sauvegarde de l'entrepôt
            entrepot = form.save()

            # Récupération de tous les produits
            produits = Produit.objects.all()

            # Création automatique du stock pour chaque produit
            stocks = []

            for produit in produits:

                # Vérifie si le stock existe déjà
                existe = StockEntrepot.objects.filter(
                    id_entrepot=entrepot,
                    id_produit=produit
                ).exists()

                if not existe:
                    stocks.append(
                        StockEntrepot(
                            id_entrepot=entrepot,
                            id_produit=produit,
                            quantite=0
                        )
                    )
            # Insertion rapide en masse
            if stocks:
                StockEntrepot.objects.bulk_create(stocks)

            return HttpResponse(status=204)
    else:
        form = EntrepotForm(instance=entrepots)

    return render(request, 'dashboard/form_entrepot.html', {'form': form, 'entrepots': entrepots})
