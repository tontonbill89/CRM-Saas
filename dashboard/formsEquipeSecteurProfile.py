from django.http import JsonResponse
from .models import Equipe, Secteur,ProfileUser
from .auth import login_required_custom



@login_required_custom
def get_equipes(request):
    user = request.current_user

    equipes = Equipe.objects.values('id_equipe','nom_equipe')
    
    if user.is_superviseur:
        equipes = equipes.filter(id_equipe=user.id_equipe.id_equipe)

    return JsonResponse(list(equipes), safe=False)

@login_required_custom
def get_secteurs(request):
    user = request.current_user

    secteurs = Secteur.objects.values('id_secteur','nom_secteur')
    if user.is_superviseur:
        secteurs = secteurs.filter(id_equipe=user.id_equipe.id_equipe)

    return JsonResponse(list(secteurs), safe=False)

def get_profiles(request):
    
    profiles = ProfileUser.objects.values('id_profile_user','nom_profile')
    return JsonResponse(list(profiles), safe=False)
