def user_permissions(request):
    if hasattr(request, 'current_user'):
        return {
            'is_admin': request.current_user.is_admin,
            'is_superviseur': request.current_user.is_superviseur,
        }

    return {
        'is_admin': False,
        'is_superviseur': False,
    }