from rest_framework.permissions import BasePermission


class IsFirebaseAdmin(BasePermission):
    message = 'Admin claim required.'

    def has_permission(self, request, _view):
        user = getattr(request, 'user', None)
        claims = getattr(user, 'claims', {}) if user is not None else {}
        return claims.get('admin') is True