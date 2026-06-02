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

    if settings.FIREBASE_USE_ADC:
        _app = firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
    else:
        cred = credentials.ApplicationDefault()
        _app = firebase_admin.initialize_app(cred)

    return _app
