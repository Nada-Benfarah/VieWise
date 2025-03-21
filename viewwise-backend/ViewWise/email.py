from decouple import config

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = True
EMAIL_TIMEOUT = 30
DEFAULT_FROM_EMAIL = "noreply@viewwise.com"
SERVER_EMAIL = "noreply@viewwise.com"
ACCOUNT_DEFAULT_HTTP_PROTOCOL = "https"

# 📌 Custom Email Subjects & Templates
ACCOUNT_EMAIL_SUBJECT_PREFIX = "ViewWise "
ACCOUNT_EMAIL_CONFIRMATION_TEMPLATE = "account/email/email_confirmation_message.html"
ACCOUNT_EMAIL_CONFIRMATION_SUBJECT = "account/email/email_confirmation_subject.txt"
ACCOUNT_PASSWORD_RESET_TEMPLATE = "account/email/password_reset_message.html"
ACCOUNT_PASSWORD_RESET_SUBJECT = "account/email/password_reset_subject.txt"
ACCOUNT_EMAIL_CONFIRMATION_EXPIRE_DAYS = 2