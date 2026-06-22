from functools import wraps
from django.shortcuts import redirect
from .models import Utilisateur
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied

def get_current_user(request):
    user_id = request.session.get('user_id')

    if not user_id:
        return None

    try:
        return Utilisateur.objects.select_related(
            'id_profile_user',
            'id_equipe'
        ).get(login=user_id)
    except Utilisateur.DoesNotExist:
        return None


def login_required_custom(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):

        user = get_current_user(request)

        if not user:
            return redirect('login')

        if not (user.is_admin or user.is_superviseur):
            request.session.flush()
            return redirect('login')

        request.current_user = user

        return view_func(request, *args, **kwargs)
    return wrapper

def admin_required(view_func):

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):

        if not hasattr(request, 'current_user'):
            raise PermissionDenied

        if not request.current_user.is_admin:
            raise PermissionDenied

        return view_func(request, *args, **kwargs)

    return wrapper