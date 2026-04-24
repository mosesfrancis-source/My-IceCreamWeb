from django.core.management.base import BaseCommand
from firebase_admin import auth as firebase_auth

from icecream_backend.firebase import get_firebase_app


class Command(BaseCommand):
    help = 'Set or clear the Firebase custom admin claim for a user UID.'

    def add_arguments(self, parser):
        parser.add_argument('uid', type=str)
        parser.add_argument('--admin', action='store_true', help='Set admin=true instead of removing it.')

    def handle(self, *_args, **options):
        uid = options['uid']
        set_admin = bool(options['admin'])

        get_firebase_app()
        if set_admin:
            firebase_auth.set_custom_user_claims(uid, {'admin': True})
            self.stdout.write(f'Admin claim enabled for {uid}')
            return

        firebase_auth.set_custom_user_claims(uid, {})
        self.stdout.write(f'Admin claim removed for {uid}')