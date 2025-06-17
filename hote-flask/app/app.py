from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from dynaconf import FlaskDynaconf  # Importação do Dynaconf
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import secrets

app = Flask(__name__)

# Configuração do Dynaconf
FlaskDynaconf(app, settings_files=['settings.toml', '.secrets.toml'])

db = SQLAlchemy(app)

# Initialize Flask-Login
login_manager = LoginManager(app)
login_manager.login_view = app.config.get("LOGIN_VIEW", "login")  # Configurável via Dynaconf
login_manager.login_message_category = app.config.get("LOGIN_MESSAGE_CATEGORY", "error")

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    bio = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    events = db.relationship('Event', backref='creator', lazy=True)
    participations = db.relationship('Participation', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200))
    invite_code = db.Column(db.String(10), unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    participations = db.relationship('Participation', backref='event', lazy=True, cascade="all, delete-orphan")

class Participation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

# Create database tables
with app.app_context():
    db.create_all()

# Create an admin user if it doesn't exist
with app.app_context():
    admin_email = app.config.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = app.config.get("ADMIN_PASSWORD", "admin123")
    if not User.query.filter_by(email=admin_email).first():
        admin_user = User(
            first_name="Admin",
            last_name="User",
            email=admin_email
        )
        admin_user.set_password(admin_password)
        db.session.add(admin_user)
        db.session.commit()
        print(f"Admin user created: {admin_email} / {admin_password}")
    else:
        print(f"Admin user already exists: {admin_email}")

# Create a test event if it doesn't exist
with app.app_context():
    test_event_title = "Evento de Teste"
    test_event_code = "TESTE123"
    if not Event.query.filter_by(invite_code=test_event_code).first():
        test_event = Event(
            title=test_event_title,
            description="Este é um evento de teste para verificar a interface.",
            date=datetime.utcnow(),
            location="Local de Teste",
            invite_code=test_event_code,
            user_id=1  # Assuming the admin user has ID 1
        )
        db.session.add(test_event)
        db.session.commit()
        print(f"Evento de teste criado: {test_event_title} com código {test_event_code}")
    else:
        print(f"Evento de teste já existe com código {test_event_code}")

# Routes
@app.route('/')
def index():
    site_name = app.config.get("SITE_NAME", "Flask App")
    return render_template('index.html', user=current_user if current_user.is_authenticated else None, site_name=site_name)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            flash(app.config.get("LOGIN_SUCCESS_MESSAGE", "Login successful!"), 'success')
            return redirect(url_for('dashboard'))
        flash(app.config.get("LOGIN_ERROR_MESSAGE", "Invalid email or password."), 'error')
    return render_template('login.html', site_name=app.config.get("SITE_NAME", "Flask App"))  # Passando site_name

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash(app.config.get("REGISTER_EMAIL_EXISTS_MESSAGE", "Email already registered."), 'error')
            return render_template('register.html', site_name=app.config.get("SITE_NAME", "Flask App"))
        
        if password != confirm_password:
            flash(app.config.get("REGISTER_PASSWORD_MISMATCH_MESSAGE", "Passwords do not match."), 'error')
            return render_template('register.html', site_name=app.config.get("SITE_NAME", "Flask App"))
        
        new_user = User(first_name=first_name, last_name=last_name, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        flash(app.config.get("REGISTER_SUCCESS_MESSAGE", "Registration successful! Please log in."), 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', site_name=app.config.get("SITE_NAME", "Flask App"))

@app.route('/logout')
@login_required
def logout():
    logout_user()  # Log out the user
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    user = current_user
    created_events = Event.query.filter_by(user_id=user.id).all()
    participating_events = [p.event for p in user.participations]
    return render_template(
        'dashboard.html',
        user=user,
        created_events=created_events,
        participating_events=participating_events,
        site_name=app.config.get("SITE_NAME", "Flask App")  # Passando site_name
    )

@app.route('/join', methods=['POST'])
@login_required
def join_event():
    code = request.form.get('code')
    event = Event.query.filter_by(invite_code=code).first()
    
    if not event:
        flash('Código de convite inválido.', 'error')
        return redirect(url_for('dashboard'))
    
    # Verificar se o usuário já está participando
    existing_participation = Participation.query.filter_by(
        user_id=current_user.id, 
        event_id=event.id
    ).first()
    
    if existing_participation:
        flash('Você já está participando deste evento.', 'info')
        return redirect(url_for('dashboard'))
    
    # Adicionar participação
    new_participation = Participation(
        user_id=current_user.id,
        event_id=event.id
    )
    
    db.session.add(new_participation)
    db.session.commit()
    
    flash('Você entrou no evento com sucesso!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    user = current_user
    
    if request.method == 'POST':
        user.first_name = request.form.get('first_name')
        user.last_name = request.form.get('last_name')
        user.phone = request.form.get('phone')
        user.bio = request.form.get('bio')
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('profile'))
    
    return render_template('profile.html', user=user)

@app.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        user = current_user
        
        if not user.check_password(current_password):
            flash('Current password is incorrect.', 'error')
            return redirect(url_for('change_password'))
        
        if new_password != confirm_password:
            flash('New passwords do not match.', 'error')
            return redirect(url_for('change_password'))
        
        user.set_password(new_password)
        db.session.commit()
        
        flash('Password changed successfully!', 'success')
        return redirect(url_for('profile'))
    
    return render_template('change_password.html', user=current_user)

@app.route('/create_event', methods=['GET', 'POST'])
@login_required
def create_event():
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        date_str = request.form.get('date')
        location = request.form.get('location') or app.config.get("DEFAULT_EVENT_LOCATION", "Default Location")
        invite_code = request.form.get('invite_code')

        # Convert date string to datetime object
        date = datetime.strptime(date_str, '%Y-%m-%dT%H:%M')

        # Check if invite code already exists
        existing_event = Event.query.filter_by(invite_code=invite_code).first()
        if existing_event:
            flash(app.config.get("REGISTER_EMAIL_EXISTS_MESSAGE", "This invitation code is already in use."), 'error')
            return render_template('create_event.html', user=current_user)

        # Create new event
        new_event = Event(
            title=title,
            description=description,
            date=date,
            location=location,
            invite_code=invite_code,
            user_id=current_user.id
        )

        db.session.add(new_event)
        db.session.commit()

        flash(app.config.get("EVENT_CREATION_SUCCESS_MESSAGE", "Event created successfully!"), 'success')
        return redirect(url_for('dashboard'))

    return render_template('create_event.html', user=current_user)

@app.route('/edit_event/<int:event_id>', methods=['GET', 'POST'])
@login_required
def edit_event(event_id):
    event = Event.query.get_or_404(event_id)

    # Check if the user is the creator of the event
    if event.user_id != current_user.id:
        flash('You do not have permission to edit this event.', 'error')
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        event.title = request.form.get('title')
        event.description = request.form.get('description')
        date_str = request.form.get('date')
        event.location = request.form.get('location')

        # Convert date string to datetime object
        event.date = datetime.strptime(date_str, '%Y-%m-%dT%H:%M')

        db.session.commit()

        flash('Event updated successfully!', 'success')
        return redirect(url_for('dashboard'))

    return render_template('edit_event.html', event=event, user=current_user)

@app.route('/delete_event/<int:event_id>', methods=['POST'])
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Check if the user is the creator of the event
    if event.user_id != current_user.id:  # Use current_user.id instead of session['user_id']
        flash('You do not have permission to delete this event.', 'error')
        return redirect(url_for('dashboard'))
    
    db.session.delete(event)
    db.session.commit()
    
    flash('Event deleted successfully!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/services')
def services():
    return render_template('services.html', user=current_user if current_user.is_authenticated else None)

@app.route('/about')
def about():
    return render_template('about.html', user=current_user if current_user.is_authenticated else None)

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')

        # Simulate sending an email using the configured mail server
        mail_server = app.config.get("MAIL_SERVER")
        mail_port = app.config.get("MAIL_PORT")
        mail_username = app.config.get("MAIL_USERNAME")
        mail_password = app.config.get("MAIL_PASSWORD")
        mail_use_tls = app.config.get("MAIL_USE_TLS")
        mail_use_ssl = app.config.get("MAIL_USE_SSL")

        # Log email details (for demonstration purposes)
        print(f"Sending email via {mail_server}:{mail_port}")
        print(f"TLS: {mail_use_tls}, SSL: {mail_use_ssl}")
        print(f"From: {mail_username}, To: {email}")
        print(f"Message: {message}")

        flash(app.config.get("CONTACT_SUCCESS_MESSAGE", "Message sent successfully! We will contact you soon."), 'success')
        return redirect(url_for('contact'))

    return render_template('contact.html', user=current_user if current_user.is_authenticated else None, site_name=app.config.get("SITE_NAME", "Flask App"))

@app.route('/generate_invite_code')
@login_required
def generate_invite_code():
    # Generate a random 8-character code
    code = secrets.token_hex(4).upper()
    
    # Check if code already exists
    while Event.query.filter_by(invite_code=code).first():
        code = secrets.token_hex(4).upper()
    
    return {'code': code}

@app.route('/toggle_dark_mode', methods=['POST'])
@login_required
def toggle_dark_mode():
    session['dark_mode'] = not session.get('dark_mode', False)  # Alterna o estado do dark mode
    return '', 204  # Retorna sem recarregar a página

if __name__ == '__main__':
    app.run(debug=app.config.get("DEBUG", True))