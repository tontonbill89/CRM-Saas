from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django import forms
from .models import Equipe, Secteur,ProfileUser
import csv
import openpyxl
from django.core.paginator import Paginator
from .auth import login_required_custom, admin_required


@login_required_custom
@admin_required
def config_page(request):

    return render(request, "dashboard/config.html")

#API liste des clients

# Définition rapide du formulaire (Equipe)
class EquipeForm(forms.ModelForm):
    class Meta:
        model = Equipe
        # On liste les champs du modèle
        fields = [
            'id_equipe', 'nom_equipe'
        ]
        
        # Ajout des classes Bootstrap aux widgets
        widgets = {
            field: forms.TextInput(attrs={'class': 'form-control'}) 
                for field in [ 'id_equipe', 'nom_equipe'
            ]
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Personnalisation spécifique pour les listes déroulantes et les nombres

@login_required_custom
@admin_required
def manage_equipe(request, pk=None):
    if pk:
        equipes = get_object_or_404(Equipe, pk=pk)
    else:
        equipes = None

    if request.method == 'POST':
        form = EquipeForm(request.POST, instance=equipes)
        if form.is_valid():
            form.save()
            return HttpResponse(status=204) # Succès (Pas de contenu à renvoyer)
    else:
        form = EquipeForm(instance=equipes)

    return render(request, 'dashboard/form_equipe.html', {'form': form, 'equipes': equipes})


# Définition rapide du formulaire (Secteur)
class SecteurForm(forms.ModelForm):
    class Meta:
        model = Secteur
        # On liste les champs du modèle
        fields = [
            'id_secteur', 'nom_secteur'
        ]
        
        # Ajout des classes Bootstrap aux widgets
        widgets = {
            field: forms.TextInput(attrs={'class': 'form-control'}) 
                for field in [ 'id_secteur', 'nom_secteur'
            ]
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Personnalisation spécifique pour les listes déroulantes et les nombres

@login_required_custom
@admin_required
def manage_secteur(request, pk=None):
    if pk:
        secteurs = get_object_or_404(Secteur, pk=pk)
    else:
        secteurs = None

    if request.method == 'POST':
        form = SecteurForm(request.POST, instance=secteurs)
        if form.is_valid():
            form.save()
            return HttpResponse(status=204) # Succès (Pas de contenu à renvoyer)
    else:
        form = SecteurForm(instance=secteurs)

    return render(request, 'dashboard/form_secteur.html', {'form': form, 'secteurs': secteurs})


# Définition rapide du formulaire (Profile user)
class ProfileUserForm(forms.ModelForm):
    class Meta:
        model = ProfileUser
        # On liste les champs du modèle
        fields = [
            'id_profile_user', 'nom_profile'
        ]
        
        # Ajout des classes Bootstrap aux widgets
        widgets = {
            field: forms.TextInput(attrs={'class': 'form-control'}) 
                for field in [ 'id_profile_user', 'nom_profile'
            ]
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Personnalisation spécifique pour les listes déroulantes et les nombres

@login_required_custom
@admin_required
def manage_profile(request, pk=None):
    if pk:
        profiles = get_object_or_404(ProfileUser, pk=pk)
    else:
        profiles = None

    if request.method == 'POST':
        form = ProfileUserForm(request.POST, instance=profiles)
        if form.is_valid():
            form.save()
            return HttpResponse(status=204) # Succès (Pas de contenu à renvoyer)
    else:
        form = ProfileUserForm(instance=profiles)

    return render(request, 'dashboard/form_profile_user.html', {'form': form, 'profiles': profiles})