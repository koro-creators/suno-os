"""Firebase Admin SDK initialization."""

import firebase_admin
from firebase_admin import credentials

from config import settings

_app = None


def get_firebase_app() -> firebase_admin.App:
    """Get or initialize the Firebase Admin app."""
    global _app
    if _app is not None:
        return _app

    # projectId é obrigatório para verify_id_token (checa o audience do token).
    options = {"projectId": settings.FIREBASE_PROJECT_ID}

    if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        _app = firebase_admin.initialize_app(cred, options)
    elif settings.FIREBASE_USE_ADC:
        # Cloud Run: usa metadata server.
        _app = firebase_admin.initialize_app(options=options)
    else:
        # ADC local / GOOGLE_APPLICATION_CREDENTIALS.
        cred = credentials.ApplicationDefault()
        _app = firebase_admin.initialize_app(cred, options)

    return _app
