from django.shortcuts import redirect
from dashboard.models import Utilisateur


def login_required_custom(view_func):
    def wrapper(request, *args, **kwargs):
        user_id = request.session.get('user_id')

        if not user_id:
            return redirect('login')

        request.current_user = Utilisateur.objects.select_related(
            'id_profile_user',
            'id_equipe'
        ).get(login=user_id)

        return view_func(request, *args, **kwargs)

    return wrapper