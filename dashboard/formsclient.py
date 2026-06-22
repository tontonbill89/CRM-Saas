from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse,JsonResponse
from django import forms
from .models import Client, Equipe, Secteur
import csv
import openpyxl
from django.core.paginator import Paginator
from .auth import login_required_custom


# Affichage page clients
@login_required_custom
def clients_page(request):
    return render(request, "dashboard/clients.html")


#API liste des clients
@login_required_custom
def liste_clients(request):
    
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 50))
    search = request.GET.get("search", "")
    ville = request.GET.get("ville", "")
    statut = request.GET.get("statut", "")

    qs = Client.objects.all()

    if search:
        qs = qs.filter(nom_boutique__icontains=search)

    if ville:
        qs = qs.filter(ville__iexact=ville)

    if statut:
        qs = qs.filter(statut__iexact=statut)

    qs = qs.order_by("id_client")

    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)

    data = {
        "results": list(page_obj.object_list.values(
            'id_client','nom_boutique','lat','lon',
            'nom_gerant','tel_gerant','statut','cat','arrond','ville'
        )),
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "total": paginator.count
    }
    return JsonResponse(data)

def export_clients(request):
    search = request.GET.get("search", "")
    ville = request.GET.get("ville", "")
    statut = request.GET.get("statut", "")
    export_type = request.GET.get("type", "csv")

    qs = Client.objects.all()
    
    if search:
        qs = qs.filter(nom_boutique__icontains=search)
    if ville:
        qs = qs.filter(ville__iexact=ville)
    if statut:
        qs = qs.filter(statut__iexact=statut)

    qs = qs.order_by("id_client")

    fields = ['id_client','nom_boutique','tel_gerant','statut','cat','arrond','ville','lat','lon']

    # Export CSV
    if export_type == "csv":
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="clients.csv"'

        writer = csv.writer(response)
        writer.writerow(fields)

        for obj in qs:
            writer.writerow([getattr(obj, f) for f in fields])

        return response

    # Export EXCEL
    elif export_type == "excel":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Clients"

        ws.append(fields)

        for obj in qs:
            ws.append([getattr(obj, f) for f in fields])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=clients.xlsx'

        wb.save(response)
    
    return response

def get_villes(request):
    villes = Client.objects.values('ville').distinct()
    return JsonResponse(list(villes), safe=False)

def get_statuts(request):
    statuts = Client.objects.values('statut').distinct()
    return JsonResponse(list(statuts), safe=False)


# Définition rapide du formulaire
class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        # On liste les champs du modèle Client
        fields = [
            'nom_boutique', 'nom_gerant', 'tel_gerant', 'statut', 'cat', 'sub_cat',
            'ville', 'arrond', 'quartier', 'region', 'lat', 'lon', 'id_equipe', 'id_secteur'
        ]
        
        # Ajout des classes Bootstrap aux widgets
        widgets = {
            field: forms.TextInput(attrs={'class': 'form-control'}) 
                for field in [ 'nom_boutique', 'nom_gerant', 'tel_gerant', 'statut', 'cat', 'sub_cat',
                'ville', 'arrond', 'quartier', 'region', 'lat', 'lon'
            ]
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Personnalisation spécifique pour les listes déroulantes et les nombres
        self.fields['statut'].widget = forms.Select(choices=[
            ('Client', 'Client'), 
            ('Prospect', 'Prospect')
        ], attrs={'class': 'form-select'})
        
        self.fields['id_equipe'].queryset = Equipe.objects.all()
        self.fields['id_secteur'].queryset = Secteur.objects.all()
        
        self.fields['id_equipe'].widget.attrs.update({'class': 'form-select'})
        self.fields['id_secteur'].widget.attrs.update({'class': 'form-select'})

        self.fields['id_equipe'].empty_label = ""
        self.fields['id_secteur'].empty_label = ""
        
        self.fields['lat'].widget = forms.NumberInput(attrs={'class': 'form-control', 'step': 'any'})
        self.fields['lon'].widget = forms.NumberInput(attrs={'class': 'form-control', 'step': 'any'})


def manage_client(request, pk=None):
    if pk:
        client = get_object_or_404(Client, pk=pk)
    else:
        client = None

    if request.method == 'POST':
        form = ClientForm(request.POST, instance=client)
        if form.is_valid():
            form.save()
            return HttpResponse(status=204) # Succès (Pas de contenu à renvoyer)
    else:
        form = ClientForm(instance=client)

    return render(request, 'dashboard/form_client.html', {'form': form, 'client': client})