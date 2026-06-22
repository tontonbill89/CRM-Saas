# views.py
from .auth import login_required_custom
from django.shortcuts import render, redirect
from dashboard.models import Utilisateur
from django.contrib.auth.hashers import check_password


def login_view(request):
    erreur = None

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = Utilisateur.objects.select_related(
                'id_profile_user',
                'id_equipe'
            ).get(email=email)

            if check_password(password, user.mot_de_passe):

                 # Autoriser uniquement Admin et Superviseur
                if not (user.is_admin or user.is_superviseur):
                    erreur = "Accès réservé aux administrateurs et superviseurs"
                else:
                    request.session['user_id'] = user.login
                    request.session['nom_user'] = user.nom_user
                    

                    request.session['profile'] = (
                        user.id_profile_user.nom_profile
                        if user.id_profile_user else ''
                    )

                    request.session['equipe_id'] = (
                        user.id_equipe.id_equipe
                        if user.id_equipe else None
                    )

                    return redirect('/rapport')

            erreur = 'Mot de passe incorrect'

        except Utilisateur.DoesNotExist:
            erreur = 'Utilisateur introuvable'

    return render(request, 'dashboard/login.html', {
        'erreur': erreur
    })

def logout_view(request):
    request.session.flush()
    return redirect('login')

def error_403(request, exception=None):
    return render(request, 'errors/403.html', status=403)

def error_404(request, exception=None):
    return render(request, 'errors/404.html', status=404)

def error_500(request):
    return render(request, 'errors/500.html', status=500)