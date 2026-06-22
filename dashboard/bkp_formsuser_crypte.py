from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse,HttpResponse
from django.contrib.auth.hashers import make_password, check_password
from .models import Utilisateur, Equipe, Secteur, ProfileUser, Entrepot, StockEntrepot,Produit
from django import forms
from .auth import login_required_custom


@login_required_custom
def user_page(request):
    is_admin = request.current_user.is_admin
    is_superviseur = request.current_user.is_superviseur

    return render(request, "dashboard/user.html", {
        "is_admin": is_admin,
        "is_superviseur": is_superviseur,
    })

#API liste des clients
@login_required_custom
def liste_user(request):

    user = request.current_user

    qs = Utilisateur.objects.select_related(
        'id_equipe', 'id_secteur', 'id_profile_user'
    ).all()

    if user.is_superviseur:
        qs = qs.filter(
            id_equipe__id_equipe=user.id_equipe.id_equipe
        )

    search = request.GET.get("search", "")
    equipe = request.GET.get("equipes", "")
    secteur = request.GET.get("secteurs", "")
    profile = request.GET.get("profiles", "")

    if search:
        qs = qs.filter(nom_user__icontains=search)

    if equipe:
        qs = qs.filter(id_equipe__id_equipe__iexact=equipe)

    if secteur:
        qs = qs.filter(id_secteur__nom_secteur__iexact=secteur)

    if profile:
        qs = qs.filter(id_profile_user__nom_profile__iexact=profile)

    data = []
    for item in qs:
        data.append({
            'id_equipe': item.id_equipe.id_equipe if item.id_equipe else None,
            'nom_equipe': item.id_equipe.nom_equipe if item.id_equipe else '',
            'id_secteur': item.id_secteur.id_secteur if item.id_secteur else None,
            'nom_secteur': item.id_secteur.nom_secteur if item.id_secteur else '',
            'nom_profile': item.id_profile_user.nom_profile if item.id_profile_user else '',
            'login': item.login,  # clé primaire (AutoField)
            'nom_user': item.nom_user,
            'email': item.email if item.email else '',
            'tel_user': item.tel_user,
        })

    return JsonResponse({"utilisateurs": data})

@login_required_custom
def get_profiles(request):
    profiles = ProfileUser.objects.values('id_profile_user','nom_profile')
    return JsonResponse(list(profiles), safe=False)


# Définition rapide du formulaire
class UserForm(forms.ModelForm):
    # On rend le mot de passe non requis par défaut pour la modification
    mot_de_passe = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        required=False, # Permet de le laisser vide si on modifie l'user
        label="Mot de passe"
    )

    class Meta:
        model = Utilisateur
        fields = [
            'login', 'nom_user', 'tel_user', 'email', 'mot_de_passe', 'id_equipe', 'id_secteur', 'id_profile_user'
        ]
        widgets = {
            'login': forms.TextInput(attrs={'class': 'form-control'}),
            'nom_user': forms.TextInput(attrs={'class': 'form-control'}),
            'tel_user': forms.NumberInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'id_equipe': forms.Select(attrs={'class': 'form-select'}),
            'id_secteur': forms.Select(attrs={'class': 'form-select'}),
            'id_profile_user': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Si c'est une création (pas d'instance), le mot de passe est obligatoire
        if not self.instance.pk:
            self.fields['mot_de_passe'].required = True
            
        self.fields['id_equipe'].queryset = Equipe.objects.all()
        self.fields['id_secteur'].queryset = Secteur.objects.all()
        self.fields['id_profile_user'].queryset = ProfileUser.objects.all()
        self.fields['id_equipe'].empty_label = ""
        self.fields['id_secteur'].empty_label = ""

@login_required_custom
def manage_user(request, pk=None):
    if pk:
        user = get_object_or_404(Utilisateur, pk=pk)
        # Optionnel : On vide le mot de passe initial pour ne pas afficher le hash dans le formulaire HTML
        initial_password = user.mot_de_passe
    else:
        user = None
        initial_password = None

    if request.method == 'POST':
        form = UserForm(request.POST, instance=user)
        if form.is_valid():
            # commit=False charge les données du formulaire sauf les champs qu'on va surcharger
            utilisateur = form.save(commit=False)
            
            nouveau_password = form.cleaned_data.get('mot_de_passe')

            if user: # Mode Modification
                if not nouveau_password:
                    # L'utilisateur a laissé le champ vide, on remet l'ancien hash
                    utilisateur.mot_de_passe = initial_password
                else:
                    # Un nouveau mot de passe a été saisi, on le hache
                    utilisateur.mot_de_passe = make_password(nouveau_password)
            else: # Mode Création
                utilisateur.mot_de_passe = make_password(nouveau_password)

            utilisateur.save()

            # ===== CREATION ENTREPOT ===== (Le reste de votre code reste identique)
            if not Entrepot.objects.filter(login=utilisateur).exists():
                typeentrepot = ''
                if utilisateur.id_profile_user:
                    profile = utilisateur.id_profile_user.nom_profile
                    if profile == 'Admin': typeentrepot = 'Admin'
                    elif profile == 'Superviseur': typeentrepot = 'Superviseur'
                    elif profile == 'Agent': typeentrepot = 'Agent'
                    elif profile == 'Delegue': typeentrepot = 'Delegue'

                id_entrepot = f"ENT_{utilisateur.tel_user}"
                entrepot = Entrepot.objects.create(
                    id_entrepot=id_entrepot,
                    login=utilisateur,
                    typeentrepot=typeentrepot
                )

                produits = Produit.objects.all()
                stock_list = [
                    StockEntrepot(id_entrepot=entrepot, id_produit=produit, quantite=0)
                    for produit in produits
                ]
                if stock_list:
                    StockEntrepot.objects.bulk_create(stock_list)

            return HttpResponse(status=204)
    else:
        form = UserForm(instance=user)
        # On efface le mot de passe du formulaire d'édition pour éviter d'afficher le hash textuel
        if user:
            form.initial['mot_de_passe'] = ''

    return render(request, 'dashboard/form_user.html', {'form': form, 'user': user})