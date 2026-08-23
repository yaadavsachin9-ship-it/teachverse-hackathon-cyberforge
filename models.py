import secrets
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """User Model representing accounts across all three roles (admin, verifier, user)"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'admin', 'verifier', 'user'
    is_active_account = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    identity = db.relationship('DigitalIdentity', back_populates='user', uselist=False, cascade='all, delete-orphan')
    verifications_performed = db.relationship('VerificationLog', back_populates='verifier', foreign_keys='VerificationLog.verifier_id')
    certificates = db.relationship('Certificate', back_populates='user', cascade='all, delete-orphan')

    def set_password(self, password: str):
        """Hashes password using secure scrypt/pbkdf2 via werkzeug"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifies password against stored cryptographic hash"""
        return check_password_hash(self.password_hash, password)

    @property
    def is_active(self):
        """Flask-Login required property"""
        return self.is_active_account

    def is_admin(self) -> bool:
        return self.role == 'admin'

    def is_verifier(self) -> bool:
        return self.role in ['admin', 'verifier']

    def is_regular_user(self) -> bool:
        return self.role == 'user'

    def __repr__(self):
        return f"<User {self.username} [{self.role}]>"


class DigitalIdentity(db.Model):
    """Digital Identity Model representing official student/member institutional credentials"""
    __tablename__ = 'digital_identities'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    identity_number = db.Column(db.String(32), unique=True, nullable=False, index=True) # e.g. IDV-2026-00001
    full_name = db.Column(db.String(120), nullable=False)
    college = db.Column(db.String(150), nullable=False, default="Darbhanga College of Engineering")
    department = db.Column(db.String(100), nullable=False) # e.g. Computer Science & Engineering
    course = db.Column(db.String(50), nullable=False, default="B.Tech")
    year = db.Column(db.String(20), nullable=False, default="1st Year")
    
    # Status: ACTIVE, REVOKED, SUSPENDED
    status = db.Column(db.String(20), nullable=False, default='ACTIVE', index=True)
    
    # Cryptographic URL-safe verification token (never guessable)
    verification_token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    qr_code_filename = db.Column(db.String(255), nullable=True)
    photo_url = db.Column(db.String(255), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='identity')
    verification_logs = db.relationship('VerificationLog', back_populates='identity', cascade='all, delete-orphan', order_by='desc(VerificationLog.timestamp)')

    @staticmethod
    def generate_token() -> str:
        """Generates a high-entropy cryptographically secure random 32-byte token"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def generate_identity_number(sequence_num: int) -> str:
        """Generates a professional standardized human-readable ID number (e.g. IDV-2026-00042)"""
        year_str = datetime.utcnow().strftime("%Y")
        return f"IDV-{year_str}-{sequence_num:05d}"

    def is_verified_active(self) -> bool:
        return self.status == 'ACTIVE'

    def __repr__(self):
        return f"<DigitalIdentity {self.identity_number} - {self.full_name} [{self.status}]>"


class VerificationLog(db.Model):
    """Audit Trail & Verification History Log"""
    __tablename__ = 'verification_logs'

    id = db.Column(db.Integer, primary_key=True)
    identity_id = db.Column(db.Integer, db.ForeignKey('digital_identities.id'), nullable=True)
    verifier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Results: VERIFIED, REVOKED, SUSPENDED, INVALID, FAILED
    verification_result = db.Column(db.String(20), nullable=False, index=True)
    # Methods: QR, MANUAL, OTP
    verification_method = db.Column(db.String(20), nullable=False, default='QR')
    
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    token_queried = db.Column(db.String(64), nullable=True)
    reason = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    identity = db.relationship('DigitalIdentity', back_populates='verification_logs')
    verifier = db.relationship('User', back_populates='verifications_performed', foreign_keys=[verifier_id])

    def __repr__(self):
        return f"<VerificationLog {self.verification_result} by Verifier:{self.verifier_id} at {self.timestamp}>"


class Certificate(db.Model):
    """Optional Digital Certificate Model for events, hackathons, workshops"""
    __tablename__ = 'certificates'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    certificate_number = db.Column(db.String(32), unique=True, nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    issued_by = db.Column(db.String(150), nullable=False, default="TechVerse'26 HackArena")
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False, default='ACTIVE')
    verification_token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    qr_code_filename = db.Column(db.String(255), nullable=True)

    user = db.relationship('User', back_populates='certificates')

    @staticmethod
    def generate_certificate_number(seq: int) -> str:
        year_str = datetime.utcnow().strftime("%Y")
        return f"CERT-{year_str}-{seq:05d}"
