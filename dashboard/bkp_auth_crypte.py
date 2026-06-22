from functools import wraps

from django.shortcuts import redirect, render
from django.contrib.auth.hashers import check_password

from .models import Utilisateur


# ===== RECUPERATION USER CONNECTE =====

def get_current_user(request):

    user_id = request.session.get('user_id')

    if not user_id:
        return None

    try:

        return Utilisateur.objects.select_related(
            'id_profile_user',
            'id_equipe'
        ).get(pk=user_id)

    except Utilisateur.DoesNotExist:

        return None


# ===== DECORATEUR LOGIN =====

def login_required_custom(view_func):

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):

        user = get_current_user(request)

        if not user:
            return redirect('login')

        request.current_user = user

        return view_func(request, *args, **kwargs)

    return wrapper


# ===== LOGIN =====

def login_view(request):

    erreur = None

    if request.method == 'POST':

        email = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password', '').strip()

        try:

            user = Utilisateur.objects.select_related(
                'id_profile_user',
                'id_equipe'
            ).get(email__iexact=email)

            test_password = check_password(
                password,
                user.mot_de_passe
            )

            #print("CHECK :", test_password)

            if test_password:

                request.session['user_id'] = user.pk

                return redirect('dashboard')

            else:

                erreur = "Mot de passe incorrect"

        except Utilisateur.DoesNotExist:

            erreur = "Utilisateur introuvable"

    return render(
        request,
        'dashboard/login.html',
        {
            'erreur': erreur
        }
    )


# ===== LOGOUT =====

def logout_view(request):

    request.session.flush()

    return redirect('login')