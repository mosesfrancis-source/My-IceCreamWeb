from rest_framework.permissions import BasePermission
from django.conf import settings


class IsFirebaseAdmin(BasePermission):
    message = 'Admin claim required.'

    def has_permission(self, request, _view):
        user = getattr(request, 'user', None)
        claims = getattr(user, 'claims', {}) if user is not None else {}
        user_email = str(getattr(user, 'email', '')).strip().lower()
        owner_email = str(getattr(settings, 'OWNER_ADMIN_EMAIL', '')).strip().lower()
        return claims.get('admin') is True or (owner_email and user_email == owner_email)


class IsOwnerAdmin(BasePermission):
    message = 'Only the owner admin account can perform this action.'

    def has_permission(self, request, _view):
        user = getattr(request, 'user', None)
        user_email = str(getattr(user, 'email', '')).strip().lower()
        owner_email = str(getattr(settings, 'OWNER_ADMIN_EMAIL', '')).strip().lower()
        return bool(owner_email and user_email == owner_email)