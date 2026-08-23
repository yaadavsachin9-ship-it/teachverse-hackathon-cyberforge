import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent

# Load .env file
load_dotenv(BASE_DIR / '.env')

class Config:
    """IDVault Core Application Configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'idvault_secure_default_key_2026')
    
    # Base URL for public verification links embedded into QR codes
    APP_BASE_URL = os.getenv('APP_BASE_URL', 'http://127.0.0.1:5000')

    # QR Codes storage directory
    QR_FOLDER = BASE_DIR / 'qr_codes'
    QR_FOLDER.mkdir(exist_ok=True)
    
    # Instance directory for local SQLite fallback and sqlite backups
    INSTANCE_DIR = BASE_DIR / 'instance'
    INSTANCE_DIR.mkdir(exist_ok=True)

    # Database Configuration: Auto-detect reachable MySQL, fallback to SQLite
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
    MYSQL_USER = os.getenv('MYSQL_USER', '')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'idvault')

    # Allow direct DATABASE_URL override
    DATABASE_URL = os.getenv('DATABASE_URL')

    if DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    elif MYSQL_USER and MYSQL_DATABASE:
        # Check if MySQL server port is actively accepting connections
        import socket
        mysql_reachable = False
        try:
            with socket.create_connection((MYSQL_HOST, MYSQL_PORT), timeout=0.8):
                mysql_reachable = True
        except (OSError, socket.error):
            mysql_reachable = False

        if mysql_reachable:
            # Connect via PyMySQL
            SQLALCHEMY_DATABASE_URI = (
                f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
            )
        else:
            # Seamless fallback to SQLite for local development & testing
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{INSTANCE_DIR / 'idvault.db'}"
    else:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{INSTANCE_DIR / 'idvault.db'}"


    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # Security Headers & Session Config
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    WTF_CSRF_ENABLED = True


class TestConfig(Config):
    """Test Configuration using isolated SQLite in-memory database"""
    TESTING = True
    WTF_CSRF_ENABLED = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    APP_BASE_URL = 'http://testserver'
