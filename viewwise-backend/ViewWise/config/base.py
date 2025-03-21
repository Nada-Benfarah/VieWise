from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

# 📌 Chargement des configurations centralisées
from .database import DATABASES
from .email import *
from .security import *
from .logging import LOGGING
from .auth import *
from .rest_framework import REST_FRAMEWORK

# 📌 Sécurité & secret keys
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*', cast=lambda v: v.split(','))

# 📌 Applications communes
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # 📌 Applications tierces
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'corsheaders',

    # 📌 Application spécifique
    'accounts',
]

# 📌 Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

# 📌 Configuration Django-Allauth & Social Auth (importée depuis `auth.py`)
AUTHENTICATION_BACKENDS = AUTHENTICATION_BACKENDS
SOCIALACCOUNT_PROVIDERS = SOCIALACCOUNT_PROVIDERS

# 📌 Configuration Django REST Framework (importée depuis `rest_framework.py`)
REST_FRAMEWORK = REST_FRAMEWORK

# 📌 Configuration des fichiers statiques et médias
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# 📌 Configuration des templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# 📌 Configuration du fichier WSGI
WSGI_APPLICATION = 'ViewWise.wsgi.application'

# 📌 Clé primaire par défaut
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'