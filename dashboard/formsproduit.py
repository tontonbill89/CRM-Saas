from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django import forms
from .models import Produit, MarqueProd, CategorieProd, FamilleProd, Packaging
from django.core.paginator import Paginator
import csv,openpyxl
from .auth import login_required_custom,admin_required


@login_required_custom
@admin_required
def produits_page(request):
    is_admin = request.current_user.is_admin
    is_superviseur = request.current_user.is_superviseur
    return render(request, "dashboard/produits.html", {
        "is_admin": is_admin,
        "is_superviseur": is_superviseur,
    })

#API liste des produits
@login_required_custom
#@admin_required
def liste_produits(request):
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 50))
    search = request.GET.get("search", "")
    format = request.GET.get("format", "")

    qs = Produit.objects.all()

    if search:
        qs = qs.filter(nom_produit__icontains=search)

    if format:
        qs = qs.filter(format__iexact=format)

    qs = qs.order_by("nom_produit")

    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)

    data = {
        "results": list(page_obj.object_list.values(
            'nom_produit', 'description', 'prix_ht', 'prix_carton', 'format', 'conditionnement', 'prix_semi_gros', 
            'prix_achat_pdv', 'prix_consommateur', 'id_categorie', 'id_famille', 'id_marque', 'id_packaging', 'id_produit'
        )),
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "total": paginator.count
    }
    return JsonResponse(data)
@login_required_custom
@admin_required
def export_produits(request):
    search = request.GET.get("search", "")
    format = request.GET.get("format", "")
    export_type = request.GET.get("type", "csv")

    qs = Produit.objects.all()

    if search:
        qs = qs.filter(nom_produit__icontains=search)

    if format:
        qs = qs.filter(format__iexact=format)

    qs = qs.order_by("nom_produit")

    fields = ['nom_produit', 'description', 'prix_ht', 'prix_carton', 'format', 'conditionnement', 'prix_semi_gros', 
        'prix_achat_pdv', 'prix_consommateur', 'id_categorie', 'id_famille', 'id_marque', 'id_packaging', 'id_produit'
    ]

    # Export CSV
    if export_type == "csv":
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="produits.csv"'

        writer = csv.writer(response)
        writer.writerow(fields)

        for obj in qs:
            writer.writerow([getattr(obj, f) for f in fields])

        return response

    # Export EXCEL
    elif export_type == "excel":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Produits"

        ws.append(fields)

        for obj in qs:
            ws.append([getattr(obj, f) for f in fields])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=produits.xlsx'

        wb.save(response)
    
    return response

@login_required_custom
@admin_required
def get_formats(request):
    formats = Produit.objects.values_list('format', flat=True).distinct()
    return JsonResponse(list(formats), safe=False)


# Définition rapide du formulaire
class ProduitForm(forms.ModelForm):
    class Meta:
        model = Produit
        fields = [
            'nom_produit', 'description', 'prix_carton', 'format', 'conditionnement', 'prix_semi_gros', 
            'prix_achat_pdv', 'prix_consommateur', 'id_categorie', 'id_famille', 'id_marque', 'id_packaging'
        ]
        # On définit les widgets de base
        # Ajout des classes Bootstrap aux widgets
        widgets = {
            'nom_produit': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.TextInput(attrs={'class': 'form-control'}),
            'prix_carton': forms.NumberInput(attrs={'class': 'form-control'}),
            'format': forms.TextInput(attrs={'class': 'form-control'}),
            'conditionnement': forms.TextInput(attrs={'class': 'form-control'}),
            'prix_semi_gros': forms.NumberInput(attrs={'class': 'form-control'}),
            'prix_achat_pdv': forms.NumberInput(attrs={'class': 'form-control'}),
            'prix_consommateur': forms.NumberInput(attrs={'class': 'form-control'}),
            'id_categorie': forms.Select(attrs={'class': 'form-select'}),
            'id_famille': forms.Select(attrs={'class': 'form-select'}),
            'id_marque': forms.Select(attrs={'class': 'form-select'}),
            'id_packaging': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # 
        self.fields['id_marque'].queryset = MarqueProd.objects.all()
        self.fields['id_famille'].queryset = FamilleProd.objects.all()
        self.fields['id_categorie'].queryset = CategorieProd.objects.all()
        self.fields['id_packaging'].queryset = Packaging.objects.all()

        self.fields['id_marque'].empty_label = ""
        self.fields['id_famille'].empty_label = ""
        self.fields['id_categorie'].empty_label = ""
        self.fields['id_packaging'].empty_label = ""

@login_required_custom
@admin_required
def manage_produit(request, pk=None):
    if pk:
        produit = get_object_or_404(Produit, pk=pk)
    else:
        produit = None

    if request.method == 'POST':
        form = ProduitForm(request.POST, instance=produit)
        if form.is_valid():
            form.save()
            return HttpResponse(status=204) # Succès (Pas de contenu à renvoyer)
    else:
        form = ProduitForm(instance=produit)

    return render(request, 'dashboard/form_produit.html', {'form': form, 'produit': produit})