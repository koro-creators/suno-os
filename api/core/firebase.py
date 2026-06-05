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

    if settings.FIREBASE_USE_ADC:
        # Credencial do ambiente (Cloud Run: metadata server).
        _app = firebase_admin.initialize_app(options=options)
    else:
        # Credencial explícita (ADC local / GOOGLE_APPLICATION_CREDENTIALS) +
        # projectId — sem o projectId, verify_id_token falha com "project ID required".
        cred = credentials.ApplicationDefault()
        _app = firebase_admin.initialize_app(cred, options)

    return _app
