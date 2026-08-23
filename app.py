import os
import re
import secrets
from datetime import datetime, date
from functools import wraps
from pathlib import Path

from flask import (
    Flask, render_template, redirect, url_for, flash,
    request, abort, send_from_directory, jsonify
)
from flask_login import (
    LoginManager, login_user, logout_user,
    login_required, current_user
)
from werkzeug.security import generate_password_hash
import qrcode
from PIL import Image

from config import Config, BASE_DIR
from models import db, User, DigitalIdentity, VerificationLog, Certificate


def create_app(config_class=Config):
    """Application factory for IDVault"""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'login'
    login_manager.login_message = "Please sign in to access this page."
    login_manager.login_message_category = "warning"

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Ensure static & QR code directories exist
    os.makedirs(app.config['QR_FOLDER'], exist_ok=True)
    os.makedirs(app.config['INSTANCE_DIR'], exist_ok=True)

    # -------------------------------------------------------------
    # Helper Functions & Decorators
    # -------------------------------------------------------------
    def get_client_ip():
        """Reliably extract client IP address"""
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        return request.remote_addr or '127.0.0.1'

    def admin_required(f):
        """Decorator ensuring user is authenticated and possesses admin role"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash("Authentication required.", "warning")
                return redirect(url_for('login', next=request.url))
            if not current_user.is_admin():
                flash("Access denied: Administrator privileges required.", "danger")
                abort(403)
            return f(*args, **kwargs)
        return decorated_function

    def verifier_required(f):
        """Decorator ensuring user is authenticated as verifier or admin"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash("Authentication required.", "warning")
                return redirect(url_for('login', next=request.url))
            if not current_user.is_verifier():
                flash("Access denied: Verifier privileges required.", "danger")
                abort(403)
            return f(*args, **kwargs)
        return decorated_function

    def generate_qr_image(token: str, base_url: str = None) -> str:
        """
        Generates and saves a high-quality QR code image pointing to /verify/<token>.
        QR code does NOT contain static personal identity data.
        It contains only the dynamic verification URL.
        """
        if base_url is None:
            base_url = app.config.get('APP_BASE_URL', 'http://127.0.0.1:5000')

        verify_url = f"{base_url.rstrip('/')}/verify/{token}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(verify_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF")
        filename = f"qr_{token}.png"
        filepath = os.path.join(app.config['QR_FOLDER'], filename)
        img.save(filepath)
        return filename

    # -------------------------------------------------------------
    # Context Processors & Template Filters
    # -------------------------------------------------------------
    @app.context_processor
    def inject_global_vars():
        return {
            'now': datetime.utcnow(),
            'app_name': 'IDVault',
            'tagline': 'One Identity. Instant Verification. Zero Forgery.'
        }

    # -------------------------------------------------------------
    # Public & Landing Routes
    # -------------------------------------------------------------
    @app.route('/')
    def index():
        """Public Landing Page"""
        total_identities = DigitalIdentity.query.count()
        total_verifications = VerificationLog.query.count()
        return render_template(
            'index.html',
            total_identities=total_identities,
            total_verifications=total_verifications
        )

    # -------------------------------------------------------------
    # Authentication Routes
    # -------------------------------------------------------------
    @app.route('/register', methods=['GET', 'POST'])
    def register():
        """User self-registration"""
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))

        if request.method == 'POST':
            username = request.form.get('username', '').strip()
            email = request.form.get('email', '').strip().lower()
            password = request.form.get('password', '')
            confirm_password = request.form.get('confirm_password', '')

            # Validation
            if not username or not email or not password:
                flash("All fields are required.", "danger")
                return render_template('register.html')

            if len(username) < 3 or len(username) > 30:
                flash("Username must be between 3 and 30 characters.", "danger")
                return render_template('register.html')

            if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                flash("Please enter a valid email address.", "danger")
                return render_template('register.html')

            if len(password) < 6:
                flash("Password must be at least 6 characters.", "danger")
                return render_template('register.html')

            if password != confirm_password:
                flash("Passwords do not match.", "danger")
                return render_template('register.html')

            if User.query.filter_by(username=username).first():
                flash("Username is already registered.", "danger")
                return render_template('register.html')

            if User.query.filter_by(email=email).first():
                flash("Email is already registered. Please login.", "danger")
                return render_template('register.html')

            # Create User (Default role is 'user')
            new_user = User(
                username=username,
                email=email,
                role='user'
            )
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()

            flash("Registration successful! You can now log in.", "success")
            return redirect(url_for('login'))

        return render_template('register.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        """User Login"""
        if current_user.is_authenticated:
            if current_user.is_admin():
                return redirect(url_for('admin_dashboard'))
            elif current_user.is_verifier():
                return redirect(url_for('verifier_dashboard'))
            return redirect(url_for('dashboard'))

        if request.method == 'POST':
            login_id = request.form.get('login_id', '').strip()
            password = request.form.get('password', '')
            remember = True if request.form.get('remember') else False

            if not login_id or not password:
                flash("Please provide both email/username and password.", "danger")
                return render_template('login.html')

            # Check user by username or email
            user = User.query.filter(
                (User.email == login_id.lower()) | (User.username == login_id)
            ).first()

            if not user or not user.check_password(password):
                flash("Invalid username/email or password.", "danger")
                return render_template('login.html')

            if not user.is_active_account:
                flash("This account has been disabled. Please contact the administrator.", "danger")
                return render_template('login.html')

            login_user(user, remember=remember)
            flash(f"Welcome back, {user.username}!", "success")

            next_page = request.args.get('next')
            if next_page and next_page.startswith('/'):
                return redirect(next_page)

            if user.is_admin():
                return redirect(url_for('admin_dashboard'))
            elif user.is_verifier():
                return redirect(url_for('verifier_dashboard'))
            return redirect(url_for('dashboard'))

        return render_template('login.html')

    @app.route('/logout')
    @login_required
    def logout():
        """User Logout"""
        logout_user()
        flash("You have been successfully logged out.", "info")
        return redirect(url_for('index'))

    @app.route('/profile', methods=['GET', 'POST'])
    @login_required
    def profile():
        """User Profile Page (IDOR protected: strictly operates on current_user)"""
        if request.method == 'POST':
            email = request.form.get('email', '').strip().lower()
            current_password = request.form.get('current_password', '')
            new_password = request.form.get('new_password', '')

            if email and email != current_user.email:
                if User.query.filter(User.email == email, User.id != current_user.id).first():
                    flash("Email address is already in use by another account.", "danger")
                else:
                    current_user.email = email
                    db.session.commit()
                    flash("Email updated successfully.", "success")

            if new_password:
                if not current_password or not current_user.check_password(current_password):
                    flash("Current password incorrect. Password was not changed.", "danger")
                elif len(new_password) < 6:
                    flash("New password must be at least 6 characters.", "danger")
                else:
                    current_user.set_password(new_password)
                    db.session.commit()
                    flash("Password updated successfully.", "success")

            return redirect(url_for('profile'))

        return render_template('profile.html', user=current_user)

    # -------------------------------------------------------------
    # User / Student Portal Routes
    # -------------------------------------------------------------
    @app.route('/dashboard')
    @login_required
    def dashboard():
        """Student / Member personal dashboard"""
        identity = current_user.identity
        recent_logs = []
        if identity:
            recent_logs = VerificationLog.query.filter_by(identity_id=identity.id).order_by(VerificationLog.timestamp.desc()).limit(5).all()

        return render_template('dashboard.html', identity=identity, recent_logs=recent_logs)

    @app.route('/my-id')
    @login_required
    def my_id():
        """Interactive Digital ID Card view with print and flip support"""
        identity = current_user.identity
        if not identity:
            flash("You do not have an active Digital Identity assigned yet. Contact your administrator.", "info")
            return redirect(url_for('dashboard'))

        # Ensure QR code exists on disk
        if not identity.qr_code_filename or not os.path.exists(os.path.join(app.config['QR_FOLDER'], identity.qr_code_filename)):
            identity.qr_code_filename = generate_qr_image(identity.verification_token)
            db.session.commit()

        return render_template('digital_id.html', identity=identity)

    @app.route('/my-history')
    @login_required
    def my_history():
        """User personal verification audit log history"""
        identity = current_user.identity
        logs = []
        if identity:
            logs = VerificationLog.query.filter_by(identity_id=identity.id).order_by(VerificationLog.timestamp.desc()).all()
        return render_template('verification_history.html', logs=logs, identity=identity, is_personal=True)

    @app.route('/qr_codes/<path:filename>')
    def serve_qr_code(filename):
        """Serve generated QR code images"""
        return send_from_directory(app.config['QR_FOLDER'], filename)

    # -------------------------------------------------------------
    # Public & Real-Time Dynamic QR Verification Routes
    # -------------------------------------------------------------
    @app.route('/verify/<token>')
    def verify_token(token):
        """
        THE CORE VERIFICATION ENGINE:
        Queries backend database in real time.
        Evaluates status: ACTIVE -> VERIFIED, REVOKED -> REVOKED, SUSPENDED -> SUSPENDED.
        Creates an audit record in VerificationLog.
        """
        client_ip = get_client_ip()
        user_agent = request.headers.get('User-Agent', 'Unknown')[:250]
        method = 'QR' if request.args.get('src') != 'manual' else 'MANUAL'
        verifier_id = current_user.id if current_user.is_authenticated and current_user.is_verifier() else None

        # Look up identity
        identity = DigitalIdentity.query.filter_by(verification_token=token).first()

        if not identity:
            # Token does not exist
            log = VerificationLog(
                identity_id=None,
                verifier_id=verifier_id,
                verification_result='INVALID',
                verification_method=method,
                ip_address=client_ip,
                user_agent=user_agent,
                token_queried=token,
                reason='Unknown or invalid verification token'
            )
            db.session.add(log)
            db.session.commit()
            return render_template(
                'verification_result.html',
                status='INVALID',
                result_title='INVALID IDENTITY',
                identity=None,
                token=token,
                log_id=log.id,
                timestamp=log.timestamp,
                reason="This digital identity could not be verified against the IDVault institutional registry."
            ), 404

        # Real-time status evaluation
        if identity.status == 'ACTIVE':
            status = 'VERIFIED'
            result_title = 'IDENTITY VERIFIED'
            reason = 'Digital credential is valid, genuine, and active in the institution database.'
        elif identity.status == 'REVOKED':
            status = 'REVOKED'
            result_title = 'IDENTITY REVOKED'
            reason = 'This digital identity has been officially revoked by administration and is invalid.'
        elif identity.status == 'SUSPENDED':
            status = 'SUSPENDED'
            result_title = 'IDENTITY SUSPENDED'
            reason = 'This digital identity is temporarily suspended pending institutional review.'
        else:
            status = 'FAILED'
            result_title = 'VERIFICATION FAILED'
            reason = f'Unknown identity status: {identity.status}'

        # Log verification event
        log = VerificationLog(
            identity_id=identity.id,
            verifier_id=verifier_id,
            verification_result=status,
            verification_method=method,
            ip_address=client_ip,
            user_agent=user_agent,
            token_queried=token,
            reason=reason
        )
        db.session.add(log)
        db.session.commit()

        return render_template(
            'verification_result.html',
            status=status,
            result_title=result_title,
            identity=identity,
            token=token,
            log_id=log.id,
            timestamp=log.timestamp,
            reason=reason
        )

    @app.route('/verify', methods=['GET', 'POST'])
    def verify_manual():
        """Manual token/URL search and camera scanner landing page"""
        if request.method == 'POST':
            raw_input = request.form.get('token_input', '').strip()
            if not raw_input:
                flash("Please enter a verification token, ID number, or verification URL.", "warning")
                return render_template('verify.html')

            # Extract token if user pasted a full URL
            # e.g. http://127.0.0.1:5000/verify/<token>
            token = raw_input
            if '/verify/' in raw_input:
                token = raw_input.split('/verify/')[-1].split('?')[0].strip()
            elif raw_input.startswith('IDV-'):
                # Allow lookup by human-readable ID number for verifiers
                identity = DigitalIdentity.query.filter_by(identity_number=raw_input).first()
                if identity:
                    return redirect(url_for('verify_token', token=identity.verification_token, src='manual'))
                else:
                    flash(f"No identity found matching {raw_input}", "danger")
                    return render_template('verify.html')

            return redirect(url_for('verify_token', token=token, src='manual'))

        return render_template('verify.html')

    # -------------------------------------------------------------
    # Verifier Portal Routes
    # -------------------------------------------------------------
    @app.route('/verifier/dashboard')
    @verifier_required
    def verifier_dashboard():
        """Verifier quick scanner dashboard and recent logs"""
        my_logs = VerificationLog.query.filter_by(verifier_id=current_user.id).order_by(VerificationLog.timestamp.desc()).limit(15).all()
        total_verified = VerificationLog.query.filter_by(verifier_id=current_user.id, verification_result='VERIFIED').count()
        total_revoked = VerificationLog.query.filter_by(verifier_id=current_user.id, verification_result='REVOKED').count()
        return render_template(
            'verifier/dashboard.html',
            logs=my_logs,
            total_verified=total_verified,
            total_revoked=total_revoked
        )

    # -------------------------------------------------------------
    # Admin Management Routes
    # -------------------------------------------------------------
    @app.route('/admin/dashboard')
    @admin_required
    def admin_dashboard():
        """Admin Overview Dashboard with institutional metrics & activity"""
        total_users = User.query.count()
        total_identities = DigitalIdentity.query.count()
        active_identities = DigitalIdentity.query.filter_by(status='ACTIVE').count()
        revoked_identities = DigitalIdentity.query.filter_by(status='REVOKED').count()
        suspended_identities = DigitalIdentity.query.filter_by(status='SUSPENDED').count()
        
        # Today's verifications count
        today_start = datetime.combine(date.today(), datetime.min.time())
        today_verifications = VerificationLog.query.filter(VerificationLog.timestamp >= today_start).count()
        
        recent_identities = DigitalIdentity.query.order_by(DigitalIdentity.created_at.desc()).limit(5).all()
        recent_logs = VerificationLog.query.order_by(VerificationLog.timestamp.desc()).limit(8).all()

        return render_template(
            'admin/dashboard.html',
            total_users=total_users,
            total_identities=total_identities,
            active_identities=active_identities,
            revoked_identities=revoked_identities,
            suspended_identities=suspended_identities,
            today_verifications=today_verifications,
            recent_identities=recent_identities,
            recent_logs=recent_logs
        )

    @app.route('/admin/users')
    @admin_required
    def admin_users():
        """Admin User Management"""
        users = User.query.order_by(User.created_at.desc()).all()
        return render_template('admin/users.html', users=users)

    @app.route('/admin/users/<int:user_id>/role', methods=['POST'])
    @admin_required
    def admin_change_user_role(user_id):
        """Update role for a user (admin, verifier, user)"""
        user = db.session.get(User, user_id)
        if not user:
            flash("User not found.", "danger")
            return redirect(url_for('admin_users'))

        new_role = request.form.get('role', 'user')
        if new_role not in ['admin', 'verifier', 'user']:
            flash("Invalid role selected.", "danger")
            return redirect(url_for('admin_users'))

        if user.id == current_user.id and new_role != 'admin':
            flash("You cannot demote yourself from admin role.", "warning")
            return redirect(url_for('admin_users'))

        user.role = new_role
        db.session.commit()
        flash(f"Updated role for {user.username} to {new_role.upper()}.", "success")
        return redirect(url_for('admin_users'))

    @app.route('/admin/identities/create', methods=['GET', 'POST'])
    @admin_required
    def admin_create_identity():
        """Create and issue a new Digital Identity"""
        # Available users who do not already have an assigned identity
        unassigned_users = User.query.filter(User.identity == None).all()

        if request.method == 'POST':
            user_id = request.form.get('user_id')
            full_name = request.form.get('full_name', '').strip()
            college = request.form.get('college', 'Darbhanga College of Engineering').strip()
            department = request.form.get('department', '').strip()
            course = request.form.get('course', 'B.Tech').strip()
            year = request.form.get('year', '1st Year').strip()

            # Option to create a new user account on the fly if needed
            new_username = request.form.get('new_username', '').strip()
            new_email = request.form.get('new_email', '').strip().lower()
            new_password = request.form.get('new_password', '')

            if not full_name or not department:
                flash("Full Name and Department are required fields.", "danger")
                return render_template('admin/create_identity.html', unassigned_users=unassigned_users)

            target_user = None
            if user_id and user_id.isdigit():
                target_user = db.session.get(User, int(user_id))
            elif new_username and new_email and new_password:
                if User.query.filter_by(username=new_username).first() or User.query.filter_by(email=new_email).first():
                    flash("A user with this username or email already exists.", "danger")
                    return render_template('admin/create_identity.html', unassigned_users=unassigned_users)
                target_user = User(username=new_username, email=new_email, role='user')
                target_user.set_password(new_password)
                db.session.add(target_user)
                db.session.flush()

            if not target_user:
                flash("Please select an existing user or provide credentials for a new user account.", "danger")
                return render_template('admin/create_identity.html', unassigned_users=unassigned_users)

            if target_user.identity:
                flash("This user already has a Digital Identity.", "danger")
                return render_template('admin/create_identity.html', unassigned_users=unassigned_users)

            # Generate unique human-readable ID and cryptographically secure token
            count_identities = DigitalIdentity.query.count() + 1
            identity_number = DigitalIdentity.generate_identity_number(count_identities)
            
            # Ensure unique ID number in rare edge case
            while DigitalIdentity.query.filter_by(identity_number=identity_number).first():
                count_identities += 1
                identity_number = DigitalIdentity.generate_identity_number(count_identities)

            token = DigitalIdentity.generate_token()
            qr_filename = generate_qr_image(token)

            new_identity = DigitalIdentity(
                user_id=target_user.id,
                identity_number=identity_number,
                full_name=full_name,
                college=college,
                department=department,
                course=course,
                year=year,
                status='ACTIVE',
                verification_token=token,
                qr_code_filename=qr_filename
            )

            db.session.add(new_identity)
            db.session.commit()

            flash(f"Digital Identity {identity_number} created successfully for {full_name}!", "success")
            return redirect(url_for('admin_identity_details', identity_id=new_identity.id))

        return render_template('admin/create_identity.html', unassigned_users=unassigned_users)

    @app.route('/admin/identities/<int:identity_id>')
    @admin_required
    def admin_identity_details(identity_id):
        """Identity management view: QR preview, status toggling, audit history"""
        identity = db.session.get(DigitalIdentity, identity_id)
        if not identity:
            flash("Digital Identity not found.", "danger")
            return redirect(url_for('admin_dashboard'))

        # Ensure QR file is created
        if not identity.qr_code_filename or not os.path.exists(os.path.join(app.config['QR_FOLDER'], identity.qr_code_filename)):
            identity.qr_code_filename = generate_qr_image(identity.verification_token)
            db.session.commit()

        logs = VerificationLog.query.filter_by(identity_id=identity.id).order_by(VerificationLog.timestamp.desc()).all()
        return render_template('admin/identity_details.html', identity=identity, logs=logs)

    @app.route('/admin/identities/<int:identity_id>/revoke', methods=['POST'])
    @admin_required
    def admin_revoke_identity(identity_id):
        """INSTANT REVOCATION: Changes status to REVOKED in real-time"""
        identity = db.session.get(DigitalIdentity, identity_id)
        if not identity:
            flash("Identity not found.", "danger")
            return redirect(url_for('admin_dashboard'))

        identity.status = 'REVOKED'
        db.session.commit()
        flash(f"Identity {identity.identity_number} ({identity.full_name}) has been REVOKED. Scans will immediately show REVOKED.", "danger")
        return redirect(url_for('admin_identity_details', identity_id=identity.id))

    @app.route('/admin/identities/<int:identity_id>/suspend', methods=['POST'])
    @admin_required
    def admin_suspend_identity(identity_id):
        """Suspends an identity temporarily"""
        identity = db.session.get(DigitalIdentity, identity_id)
        if not identity:
            flash("Identity not found.", "danger")
            return redirect(url_for('admin_dashboard'))

        identity.status = 'SUSPENDED'
        db.session.commit()
        flash(f"Identity {identity.identity_number} ({identity.full_name}) has been SUSPENDED.", "warning")
        return redirect(url_for('admin_identity_details', identity_id=identity.id))

    @app.route('/admin/identities/<int:identity_id>/activate', methods=['POST'])
    @admin_required
    def admin_activate_identity(identity_id):
        """Re-activates a revoked/suspended identity"""
        identity = db.session.get(DigitalIdentity, identity_id)
        if not identity:
            flash("Identity not found.", "danger")
            return redirect(url_for('admin_dashboard'))

        identity.status = 'ACTIVE'
        db.session.commit()
        flash(f"Identity {identity.identity_number} ({identity.full_name}) is now ACTIVE.", "success")
        return redirect(url_for('admin_identity_details', identity_id=identity.id))

    @app.route('/admin/logs')
    @admin_required
    def admin_verification_logs():
        """Full institutional verification audit logs"""
        status_filter = request.args.get('status')
        query = VerificationLog.query

        if status_filter:
            query = query.filter_by(verification_result=status_filter)

        logs = query.order_by(VerificationLog.timestamp.desc()).limit(100).all()
        return render_template('admin/verification_logs.html', logs=logs, current_filter=status_filter)

    # -------------------------------------------------------------
    # Database Seed CLI Command & Helper
    # -------------------------------------------------------------
    @app.cli.command("seed-db")
    def seed_db_command():
        """CLI Command to initialize and populate demo data"""
        seed_database(app)
        print("Database initialized and demo data seeded successfully!")

    # 404 & 500 error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('verification_result.html', status='INVALID', result_title='PAGE NOT FOUND', reason='The requested URL does not exist.'), 404

    @app.errorhandler(403)
    def forbidden(e):
        return render_template('verification_result.html', status='REVOKED', result_title='ACCESS FORBIDDEN', reason='You do not have permission to view this resource.'), 403

    return app


def seed_database(app):
    """Utility function to create schema and populate initial demo accounts"""
    with app.app_context():
        db.create_all()

        # Check if admin already exists
        if not User.query.filter_by(username='admin').first():
            # 1. Admin Account
            admin = User(username='admin', email='admin@idvault.local', role='admin')
            admin.set_password('Admin@123')
            db.session.add(admin)

            # 2. Verifier Account (Security Guard / Event Proctor)
            verifier = User(username='verifier', email='verifier@idvault.local', role='verifier')
            verifier.set_password('Verifier@123')
            db.session.add(verifier)

            # 3. Student Account: Rahul Kumar (ACTIVE)
            rahul = User(username='rahul', email='rahul@idvault.local', role='user')
            rahul.set_password('User@123')
            db.session.add(rahul)
            db.session.flush()

            token1 = DigitalIdentity.generate_token()
            
            # Generate QR using create_app config
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(f"http://127.0.0.1:5000/verify/{token1}")
            qr.make(fit=True)
            img1 = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF")
            qr_file1 = f"qr_{token1}.png"
            img1.save(os.path.join(app.config['QR_FOLDER'], qr_file1))

            id_rahul = DigitalIdentity(
                user_id=rahul.id,
                identity_number='IDV-2026-00001',
                full_name='Rahul Kumar',
                college='Darbhanga College of Engineering',
                department='Computer Science & Engineering',
                course='B.Tech',
                year='1st Year',
                status='ACTIVE',
                verification_token=token1,
                qr_code_filename=qr_file1
            )
            db.session.add(id_rahul)

            # 4. Student Account: Priya Singh (REVOKED for demonstration)
            priya = User(username='priya', email='priya@idvault.local', role='user')
            priya.set_password('Priya@123')
            db.session.add(priya)
            db.session.flush()

            token2 = DigitalIdentity.generate_token()
            qr2 = qrcode.QRCode(version=1, box_size=10, border=4)
            qr2.add_data(f"http://127.0.0.1:5000/verify/{token2}")
            qr2.make(fit=True)
            img2 = qr2.make_image(fill_color="#0F172A", back_color="#FFFFFF")
            qr_file2 = f"qr_{token2}.png"
            img2.save(os.path.join(app.config['QR_FOLDER'], qr_file2))

            id_priya = DigitalIdentity(
                user_id=priya.id,
                identity_number='IDV-2026-00002',
                full_name='Priya Singh',
                college='Darbhanga College of Engineering',
                department='Information Technology',
                course='B.Tech',
                year='2nd Year',
                status='REVOKED',
                verification_token=token2,
                qr_code_filename=qr_file2
            )
            db.session.add(id_priya)

            # Initial Demo Logs
            log1 = VerificationLog(
                identity_id=1,
                verifier_id=2,
                verification_result='VERIFIED',
                verification_method='QR',
                ip_address='127.0.0.1',
                user_agent='IDVault QR Scanner v1.0',
                token_queried=token1,
                reason='Regular entrance security verification'
            )
            log2 = VerificationLog(
                identity_id=2,
                verifier_id=2,
                verification_result='REVOKED',
                verification_method='QR',
                ip_address='127.0.0.1',
                user_agent='IDVault QR Scanner v1.0',
                token_queried=token2,
                reason='Identity has been revoked by institutional authority'
            )
            db.session.add_all([log1, log2])
            db.session.commit()


# Create application instance for gunicorn/flask run
app = create_app()

if __name__ == '__main__':
    # Initialize DB and seed demo data on first run
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username='admin').first():
            seed_database(app)
    app.run(debug=True, host='127.0.0.1', port=5000)
