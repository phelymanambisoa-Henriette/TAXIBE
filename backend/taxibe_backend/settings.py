"""
Django settings for taxibe_backend project.
"""

from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# ------------------------------------------------
# 🔒 Sécurité & environnement
# ------------------------------------------------
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "cle-secrete-temporaire")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

# ------------------------------------------------
# 📦 Applications
# ------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # 🔧 API
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',

    # 🧩 Applications internes
    'localisation',
    'transport',
    'interaction',
    'utilisateur',
]

# ------------------------------------------------
# ⚙️ Middleware
# ------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # 🔥 Important : avant CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'taxibe_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # tu pourras ajouter des templates HTML ici
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

WSGI_APPLICATION = 'taxibe_backend.wsgi.application'

# ------------------------------------------------
# 🗄️ Base de données
# ------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'taxibe_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# ------------------------------------------------
# 🔑 Authentification & Permissions
# ------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Lecture publique, écriture sécurisée
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Si tu as un backend d’auth perso, garde ceci :
AUTHENTICATION_BACKENDS = [
    'authentification.backends.AuthentificationTaxibeBackend',
    'django.contrib.auth.backends.ModelBackend',  # fallback
]

# ------------------------------------------------
# 🌍 Internationalisation
# ------------------------------------------------
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Indian/Antananarivo'
USE_I18N = True
USE_TZ = True

# ------------------------------------------------
# 🖼️ Fichiers statiques et médias
# ------------------------------------------------
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']  # fichiers frontend partagés
STATIC_ROOT = BASE_DIR / 'staticfiles'    # pour la collecte en prod

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'           # stockage des images uploads

# ------------------------------------------------
# 🌐 CORS
# ------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ------------------------------------------------
# 🆔 Clé primaire auto
# ------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
