from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent
DEBUG = config('DEBUG', default=False, cast=bool)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {name} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose' if DEBUG else 'simple',
            'level': 'DEBUG' if DEBUG else 'INFO',
        },
        'file_error': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs/error.log',
            'formatter': 'verbose',
            'level': 'ERROR',
        },
        'file_info': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs/info.log',
            'formatter': 'verbose',
            'level': 'INFO',
        },
        'sentry': {
            'class': 'logging.StreamHandler',
            'level': 'ERROR',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file_info'],
            'level': 'INFO',
            'propagate': False,
        },
        'my_app': {
            'handlers': ['console', 'file_info', 'sentry'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'error_logger': {
            'handlers': ['console', 'file_error', 'sentry'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file_info'],
        'level': 'DEBUG' if DEBUG else 'INFO',
    },
}