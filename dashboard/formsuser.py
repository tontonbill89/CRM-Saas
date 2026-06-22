from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse,HttpResponse
from .models import Utilisateur, Equipe, Secteur, ProfileUser, Entrepot, StockEntrepot,Produit
from django import forms
from .auth import login_required_custom
from django.contrib.auth.hashers import make_password


@login_required_custom
def user_page(request):
    
    return render(request, "dashboard/user.html")

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
        qs = qs.filter(id_equipe__id_equipe=equipe)

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
            #'mot_de_passe': item.mot_de_passe,
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
    mot_de_passe = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}),required=False)
    class Meta:
        model = Utilisateur

        fields = [
            'login',
            'nom_user',
            'tel_user',
            'email',
            'mot_de_passe',
            'id_equipe',
            'id_secteur',
            'id_profile_user'
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
        current_user = kwargs.pop('current_user', None)

        super().__init__(*args, **kwargs)

        if not self.instance.pk:
            self.fields['mot_de_passe'].required = True

        if current_user and current_user.is_superviseur:
            self.fields['id_equipe'].queryset = Equipe.objects.filter(
                id_equipe=current_user.id_equipe.id_equipe
            )

            self.fields['id_profile_user'].queryset = (
                ProfileUser.objects.exclude(
                    nom_profile='Admin'
                )
            )
        else:
            self.fields['id_equipe'].queryset = Equipe.objects.all()
            self.fields['id_profile_user'].queryset = ProfileUser.objects.all()

        self.fields['id_secteur'].queryset = Secteur.objects.all()

        self.fields['id_equipe'].empty_label = ""
        self.fields['id_secteur'].empty_label = ""


@login_required_custom
def manage_user(request, pk=None):
    if pk:
        user = get_object_or_404(Utilisateur, pk=pk)

        if request.current_user.is_superviseur:
            if user.id_equipe != request.current_user.id_equipe:
                return HttpResponse(status=403)

        initial_password = user.mot_de_passe
    else:
        user = None
        initial_password = None

    if request.method == 'POST':
        form = UserForm(request.POST,instance=user,current_user=request.current_user)
        if form.is_valid():
            utilisateur = form.save(commit=False)
            nouveau_password = form.cleaned_data.get('mot_de_passe')

            if user:
                if not nouveau_password:
                    utilisateur.mot_de_passe = initial_password
                else:
                    utilisateur.mot_de_passe = make_password(nouveau_password)
            else:
                utilisateur.mot_de_passe = make_password(nouveau_password)

            if request.current_user.is_superviseur:
                if form.cleaned_data['id_equipe'] != request.current_user.id_equipe:
                    return HttpResponse(status=403)
            
            utilisateur.save()

            # Création entrepot uniquement si nouvel utilisateur
            if not Entrepot.objects.filter(login=utilisateur).exists():

                typeentrepot = ''

                if utilisateur.id_profile_user:

                    profile = utilisateur.id_profile_user.nom_profile

                    if profile == 'Admin':
                        typeentrepot = 'Admin'

                    elif profile == 'Superviseur':
                        typeentrepot = 'Superviseur'

                    elif profile == 'Agent':
                        typeentrepot = 'Agent'

                    elif profile == 'Delegue':
                        typeentrepot = 'Delegue'

                # ID entrepot
                id_entrepot = f"ENT_{utilisateur.tel_user}"

                # Création entrepot
                entrepot = Entrepot.objects.create(
                    id_entrepot=id_entrepot,
                    login=utilisateur,
                    typeentrepot=typeentrepot
                )

                # Récupération de tous les produits
                produits = Produit.objects.all()

                # Création automatique du stock pour les produits manquants
                stocks = []

                for produit in produits:

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

            return HttpResponse(status=204) # Succès (Pas de contenu à renvoyer)

    else:
        form = UserForm(instance=user,current_user=request.current_user)
        
    return render(request, 'dashboard/form_user.html', {'form': form, 'user': user})
