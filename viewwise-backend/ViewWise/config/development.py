from .base import *
from ..database import DATABASES
from ..email import *
from ..security import *
from ..logging import LOGGING

# 📌 Debug Mode
DEBUG = True

# 📌 Allowed Hosts (for local development)
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# 📌 CORS & CSRF Settings (Allow everything in development)
CORS_ALLOW_ALL_ORIGINS = True
CSRF_TRUSTED_ORIGINS = ['http://localhost:3000']  # Frontend URL (update as needed)

# 📌 Database Configuration (from database.py)
DATABASES = DATABASES

# 📌 Email Backend for Development (Use console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# 📌 Logging Configuration (from logging.py)
LOGGING = LOGGING

# 📌 JWT Authentication
SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] = timedelta(minutes=120)  # Longer tokens in dev
SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = timedelta(days=14)  # Refresh lasts longer in dev
