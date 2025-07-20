from pathlib import Path
from decouple import config
from datetime import timedelta

# 📌 Define base paths
BASE_DIR = Path(__file__).resolve().parent.parent

# 📌 Security & secret keys
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*', cast=lambda v: v.split(','))

# 📌 Django applications
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # 📌 Third-party applications (Authentication & API)
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    'allauth.socialaccount.providers.apple',
    'allauth.socialaccount.providers.microsoft',

    # 📌 CORS management for cross-origin requests
    'corsheaders',

    # 📌 Custom user application
    'accounts',
    'agents',
    'workflows',
    'companies',
    'subscriptions',
    'monitoring',
    'marketplace',
    'invitations'




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

# 📌 Custom authentication model
AUTH_USER_MODEL = 'accounts.CustomUser'

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# 📌 Django-Allauth configuration
SITE_ID = 1
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_CONFIRM_EMAIL_ON_GET = True

ACCOUNT_ADAPTER = "accounts.adapters.CustomAccountAdapter"
SOCIALACCOUNT_ADAPTER = "accounts.adapters.CustomSocialAccountAdapter"

# 📌 Social Login Providers Configuration
SOCIALACCOUNT_PROVIDERS = {
   'google': {
         'SCOPE': ['profile', 'email'],
         'AUTH_PARAMS': {'access_type': 'online'},
         'OAUTH_PKCE_ENABLED': True,
         'APP': {
             'client_id': config('SOCIAL_AUTH_GOOGLE_CLIENT_ID'),
             'secret': config('SOCIAL_AUTH_GOOGLE_SECRET'),
             'key': ''
         }
     },
    'facebook': {
        'METHOD': 'oauth2',
        'SCOPE': ['email', 'public_profile'],
        'FIELDS': ['id', 'email', 'first_name', 'last_name'],
    },
    'apple': {
        'APP': 'your.app.bundle.id',
        'EMAIL_REQUIRED': True,
        'NAME_REQUIRED': True,
    },
    'microsoft': {
        'APP': 'common',
        'SCOPES': ['User.Read'],
    }
}

# 📌 Django REST Framework (DRF) configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication'

    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
#           'rest_framework.permissions.AllowAny',  # juste pour les tests
    ),
}

# 📌 Simple JWT (Token-based authentication)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=180),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'SIGNING_KEY': config('SECRET_KEY'),
}

# 📌 Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DATABASE_NAME'),
        'USER': config('DATABASE_USER'),
        'PASSWORD': config('DATABASE_PASSWORD'),
        'HOST': config('DATABASE_HOST'),
        'PORT': config('DATABASE_PORT', default=5432, cast=int),
    }
}

# 📌 Internationalization & timezone
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/Paris'
USE_I18N = True
USE_TZ = True

# 📌 HTTPS security settings for production
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000  # ✅ Enables HTTP Strict Transport Security (HSTS)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = False  # ✅ Redirects everything to HTTPS if in production

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    cast=lambda v: [url.strip() for url in v.split(',') if url.startswith('http')]
)

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    cast=lambda v: [url.strip() for url in v.split(',') if url.startswith('http')]
)

CORS_ALLOW_CREDENTIALS = True

# 📌 Static & media files
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# 📌 Email configuration (SMTP for production)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = True
EMAIL_TIMEOUT = 30
DEFAULT_FROM_EMAIL = "sofiene.bouguerra.1996@gmail.com"
SERVER_EMAIL = "sofiene.bouguerra.1996@gmail.com"
ACCOUNT_DEFAULT_HTTP_PROTOCOL = "http"

# 📌 Development email settings (use console backend if in debug mode)
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# 📌 Debug settings for logging errors
if DEBUG:
    DEBUG_PROPAGATE_EXCEPTIONS = True

# 📌 Template configuration
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

# 📌 WSGI file configuration
WSGI_APPLICATION = 'ViewWise.wsgi.application'

# 📌 Logging configuration
from .logging import LOGGING

# 📌 Default primary key field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 📌 Root URL configuration
ROOT_URLCONF = 'ViewWise.urls'

# 📌 Use Custom Email Templates
ACCOUNT_EMAIL_SUBJECT_PREFIX = "ViewWise "
ACCOUNT_EMAIL_CONFIRMATION_TEMPLATE = "account/email/email_confirmation_message.html"
ACCOUNT_EMAIL_CONFIRMATION_SUBJECT = "account/email/email_confirmation_subject.txt"
ACCOUNT_PASSWORD_RESET_TEMPLATE = "account/email/password_reset_message.html"
ACCOUNT_PASSWORD_RESET_SUBJECT = "account/email/password_reset_subject.txt"
ACCOUNT_EMAIL_CONFIRMATION_EXPIRE_DAYS = 2
ACCOUNT_EMAIL_CONFIRMATION_AUTHENTICATED_REDIRECT_URL = "http://localhost:4200/login?activated=true"
ACCOUNT_CONFIRM_EMAIL_ON_GET = False
ACCOUNT_EMAIL_CONFIRMATION_ANONYMOUS_REDIRECT_URL = "http://localhost:4200/login"
