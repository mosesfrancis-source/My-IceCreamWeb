from functools import lru_cache
import os

import firebase_admin
from firebase_admin import credentials


@lru_cache(maxsize=1)
def get_firebase_app():
    try:
        return firebase_admin.get_app()
    except ValueError:
        pass

    credentials_path = os.getenv('FIREBASE_CREDENTIALS_PATH') or os.getenv('FIREBASE_CREDENTIALS')
    options = {'projectId': os.getenv('FIREBASE_PROJECT_ID', 'icecream-web-3c99c')}

    if credentials_path:
        return firebase_admin.initialize_app(credentials.Certificate(credentials_path), options)

    return firebase_admin.initialize_app(options=options)