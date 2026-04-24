from dataclasses import dataclass
from typing import Any

from django.utils.translation import gettext_lazy as _
from firebase_admin import auth as firebase_auth
from rest_framework import authentication, exceptions

from icecream_backend.firebase import get_firebase_app


@dataclass(frozen=True)
class FirebasePrincipal:
    uid: str
    email: str
    name: str
    claims: dict[str, Any]

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False


class FirebaseAuthentication(authentication.BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header:
            return None

        parts = auth_header.split()
        if not parts:
            return None

        if parts[0].lower() != self.keyword.lower():
            return None

        if len(parts) != 2:
            raise exceptions.AuthenticationFailed(_('Invalid authorization header.'))

        token = parts[1]
        try:
            get_firebase_app()
            decoded_token = firebase_auth.verify_id_token(token)
        except Exception as exc:  # noqa: BLE001
            raise exceptions.AuthenticationFailed(_('Invalid Firebase token.')) from exc

        principal = FirebasePrincipal(
            uid=str(decoded_token.get('uid') or decoded_token.get('user_id') or ''),
            email=str(decoded_token.get('email') or ''),
            name=str(
                decoded_token.get('name')
                or decoded_token.get('display_name')
                or decoded_token.get('email')
                or 'Firebase user'
            ).split('@')[0],
            claims=decoded_token,
        )
        return principal, decoded_token