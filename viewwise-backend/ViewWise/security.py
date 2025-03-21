from decouple import config

# 📌 CORS (Cross-Origin Resource Sharing)
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    cast=lambda v: [url.strip() for url in v.split(',') if url.startswith(('http://', 'https://'))]
)
CORS_ALLOW_CREDENTIALS = True  # ✅ Allow secure cookies in API requests

# 📌 CSRF Security
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    cast=lambda v: [url.strip() for url in v.split(',') if url.startswith(('http://', 'https://'))]
)

# 📌 HTTPS Security (Production)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000  # ✅ Enables HTTP Strict Transport Security (HSTS)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)