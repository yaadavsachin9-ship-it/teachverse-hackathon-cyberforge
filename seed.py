"""
IDVault Database Seeding & Initialization Utility
"""
from app import app, seed_database
from models import User, DigitalIdentity, VerificationLog

if __name__ == '__main__':
    with app.app_context():
        seed_database(app)
        users = User.query.all()
        identities = DigitalIdentity.query.all()
        logs = VerificationLog.query.all()
        print("="*60)
        print("IDVault Database Initialized Successfully!")
        print(f"Users seeded: {len(users)}")
        print(f"Identities created: {len(identities)}")
        print(f"Audit logs created: {len(logs)}")
        print("="*60)
        print("Admin:    admin@idvault.local    / Admin@123")
        print("Verifier: verifier@idvault.local / Verifier@123")
        print("Student:  rahul@idvault.local    / User@123 (Active)")
        print("Student:  priya@idvault.local    / Priya@123 (Revoked)")
        print("="*60)
