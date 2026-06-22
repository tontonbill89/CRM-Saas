from django.shortcuts import render, get_object_or_404
from django.core.paginator import Paginator
from django.http import JsonResponse, HttpResponse
from django.db.models import Sum
import openpyxl
from django import forms
from .models import *
from .auth import login_required_custom

@login_required_custom
def etatstock(request):
    return render(
        request,
        'dashboard/etatstock.html'
    )

class EntrepotForm(forms.ModelForm):
    class Meta:
        model = StockEntrepot
        # On liste les champs du modèle
        fields = [
            'id_entrepot', 'id_produit','quantite'
        ]
        
        # Ajout des classes Bootstrap aux widgets
        widgets = {
            'id_entrepot': forms.Select(attrs={'class': 'form-select'}),
            'id_produit': forms.Select(attrs={'class': 'form-select'}),
            'quantite': forms.NumberInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['id_entrepot'].queryset = Entrepot.objects.all()
        self.fields['id_produit'].queryset = Produit.objects.all()
        self.fields['id_entrepot'].empty_label = ""
        self.fields['id_produit'].empty_label = ""

@login_required_custom
def liste_utilisateurs_stock(request):

    user = request.current_user

    if user.is_admin:

        utilisateurs = Utilisateur.objects.all()

    elif user.is_superviseur:

        utilisateurs = Utilisateur.objects.filter(id_equipe=user.id_equipe)

    data = []

    for u in utilisateurs:

        data.append({
            'login': u.login,
            'nom_user': u.nom_user
        })

    return JsonResponse({'results': data})

@login_required_custom
def liste_etat_stock(request):

    login = request.GET.get('login')

    user = request.current_user

    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 25))

    stocks = StockEntrepot.objects.select_related(
        'id_entrepot',
        'id_entrepot__login',
        'id_produit'
    )

    # ADMIN
    if user.is_admin:

        pass

    # SUPERVISEUR
    elif user.is_superviseur:

        stocks = stocks.filter(
            id_entrepot__login__id_equipe=
            user.id_equipe
        )
    
    if login:
        stocks = stocks.filter(id_entrepot__login__login=login)

    paginator = Paginator(stocks, page_size)
    page_obj = paginator.get_page(page)

    results = []
    for stock in page_obj.object_list:

        results.append({
            'utilisateur': stock.id_entrepot.login.nom_user,
            'entrepot': stock.id_entrepot.id_entrepot,
            'produit': stock.id_produit.nom_produit,
            'quantite': stock.quantite
        })

    data = {
        "results": results,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "total": paginator.count
    }

    return JsonResponse(data, safe=False)












