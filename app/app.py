from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from dynaconf import FlaskDynaconf  # Importação do Dynaconf
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
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
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_admin = db.Column(db.Boolean, default=False)  # Novo campo
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
    end_date = db.Column(db.DateTime)  # New field for event end time
    location = db.Column(db.String(200))
    event_type = db.Column(db.String(50), nullable=False, default='other')  # New field for event type
    category = db.Column(db.String(50))  # New field for event category
    
    # Theme and Style
    theme = db.Column(db.String(50))  # Event theme
    dress_code = db.Column(db.String(50))  # Dress code
    
    # Location Details
    venue_type = db.Column(db.String(50))  # Type of venue
    accessibility = db.Column(db.String(20))  # Accessibility info
    parking = db.Column(db.String(20))  # Parking info
    public_transport = db.Column(db.String(100))  # Public transport info
    
    # Participant Settings
    capacity = db.Column(db.Integer)  # New field for maximum participants
    min_age = db.Column(db.Integer)  # Minimum age
    is_public = db.Column(db.Boolean, default=True)  # New field for privacy
    requires_approval = db.Column(db.Boolean, default=False)  # New field for approval requirement
    allow_guests = db.Column(db.Boolean, default=False)  # Allow guests
    photography_allowed = db.Column(db.Boolean, default=True)  # Photography allowed
    
    # Pricing and Payment
    price = db.Column(db.Float, default=0.0)  # New field for event price
    payment_methods = db.Column(db.String(100))  # Payment methods
    
    # Event Details
    food_service = db.Column(db.String(50))  # Food service type
    activities = db.Column(db.String(200))  # Planned activities
    materials_needed = db.Column(db.String(200))  # Materials participants need
    weather_plan = db.Column(db.String(100))  # Alternative plan for bad weather
    
    # Contact Information
    contact_email = db.Column(db.String(100))  # New field for contact info
    contact_phone = db.Column(db.String(20))  # New field for contact phone
    contact_name = db.Column(db.String(100))  # Contact person name
    emergency_contact = db.Column(db.String(20))  # Emergency contact
    social_media = db.Column(db.String(200))  # Social media links
    website = db.Column(db.String(200))  # Event website
    
    # Requirements and Notes
    special_requirements = db.Column(db.Text)  # New field for special requirements
    
    # System Fields
    invite_code = db.Column(db.String(10), unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    participations = db.relationship('Participation', backref='event', lazy=True, cascade="all, delete-orphan")

class Participation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class GuestMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    guest_name = db.Column(db.String(100), nullable=False)
    guest_email = db.Column(db.String(100), nullable=True)
    message_type = db.Column(db.String(20), default='message')  # message, gift_photo, wish
    message = db.Column(db.Text, nullable=True)
    photo_url = db.Column(db.String(200), nullable=True)
    is_approved = db.Column(db.Boolean, default=True)  # Para moderação se necessário
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    event = db.relationship('Event', backref='guest_messages', lazy=True)

# Create database tables
with app.app_context():
    db.create_all()

# Create an admin user if it doesn't exist
with app.app_context():
    admin_email = app.config.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = app.config.get("ADMIN_PASSWORD", "senha123")
    admin_user = User.query.filter_by(email=admin_email).first()
    if not admin_user:
        admin_user = User(
            first_name="Admin",
            last_name="User",
            email=admin_email,
            is_admin=True  # Define como admin
        )
        admin_user.set_password(admin_password)
        db.session.add(admin_user)
        db.session.commit()
        print(f"Admin user created: {admin_email} / {admin_password}")
    else:
        if not admin_user.is_admin:
            admin_user.is_admin = True
        # Always update the password to match the config file
        admin_user.set_password(admin_password)
        db.session.commit()
        print(f"Admin user updated: {admin_email} / {admin_password}")

    # Create a regular test user if it doesn't exist
    test_user_email = "user@example.com"
    test_user_password = "user123"
    if not User.query.filter_by(email=test_user_email).first():
        test_user = User(
            first_name="Test",
            last_name="User",
            email=test_user_email
        )
        test_user.set_password(test_user_password)
        db.session.add(test_user)
        db.session.commit()
        print(f"Test user created: {test_user_email} / {test_user_password}")
    else:
        print(f"Test user already exists: {test_user_email}")

# Create a test event if it doesn't exist
with app.app_context():
    test_event_title = "Evento de Teste"
    test_event_code = "TESTE123"
    try:
        if not Event.query.filter_by(invite_code=test_event_code).first():
            test_event = Event(
                title=test_event_title,
                description="Este é um evento de teste para verificar a interface.",
                date=datetime.now(timezone.utc),
                location="Local de Teste",
                invite_code=test_event_code,
                user_id=1  # Assuming the admin user has ID 1
            )
            db.session.add(test_event)
            db.session.commit()
            print(f"Evento de teste criado: {test_event_title} com código {test_event_code}")
        else:
            print(f"Evento de teste já existe com código {test_event_code}")
    except Exception as e:
        print(f"Error checking/creating test event: {e}")
        # If there's a database schema issue, try to recreate tables
        db.create_all()
        print("Database tables recreated")

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
    flash('Você foi desconectado com sucesso.', 'info')
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
        site_name=app.config.get("SITE_NAME", "Flask App")
    )

@app.route('/admin_dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash('Acesso restrito ao administrador.', 'error')
        return redirect(url_for('dashboard'))
    # Exemplo de conteúdo do admin dashboard
    users = User.query.all()
    events = Event.query.all()
    return render_template(
        'admin_dashboard.html',
        user=current_user,
        users=users,
        events=events,
        site_name=app.config.get("SITE_NAME", "Flask App")
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
        flash('Perfil atualizado com sucesso!', 'success')
        return redirect(url_for('profile'))
    
    return render_template('profile.html', user=user, site_name=app.config.get("SITE_NAME", "Flask App"))

@app.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        user = current_user
        
        if not user.check_password(current_password):
            flash('Senha atual incorreta.', 'error')
            return redirect(url_for('change_password'))
        
        if new_password != confirm_password:
            flash('As novas senhas não coincidem.', 'error')
            return redirect(url_for('change_password'))
        
        user.set_password(new_password)
        db.session.commit()
        
        flash('Senha alterada com sucesso!', 'success')
        return redirect(url_for('profile'))
    
    return render_template('change_password.html', user=current_user)

@app.route('/create_event', methods=['GET', 'POST'])
@login_required
def create_event():
    if request.method == 'POST':
        # Basic Information
        title = request.form.get('title')
        description = request.form.get('description')
        date_str = request.form.get('date')
        end_date_str = request.form.get('end_date')
        location = request.form.get('location') or app.config.get("DEFAULT_EVENT_LOCATION", "Default Location")
        event_type = request.form.get('event_type') or 'other'
        category = request.form.get('category')
        
        # Theme and Style
        theme = request.form.get('theme')
        dress_code = request.form.get('dress_code')
        
        # Location Details
        venue_type = request.form.get('venue_type')
        accessibility = request.form.get('accessibility')
        parking = request.form.get('parking')
        public_transport = request.form.get('public_transport')
        
        # Participant Settings
        capacity = request.form.get('capacity')
        min_age = request.form.get('min_age')
        is_public = request.form.get('is_public') == 'on'
        requires_approval = request.form.get('requires_approval') == 'on'
        allow_guests = request.form.get('allow_guests') == 'on'
        photography_allowed = request.form.get('photography_allowed') == 'on'
        
        # Pricing and Payment
        price = request.form.get('price') or 0.0
        payment_methods = request.form.get('payment_methods')
        
        # Event Details
        food_service = request.form.get('food_service')
        activities = request.form.get('activities')
        materials_needed = request.form.get('materials_needed')
        weather_plan = request.form.get('weather_plan')
        
        # Contact Information
        contact_email = request.form.get('contact_email') or current_user.email
        contact_phone = request.form.get('contact_phone')
        contact_name = request.form.get('contact_name')
        emergency_contact = request.form.get('emergency_contact')
        social_media = request.form.get('social_media')
        website = request.form.get('website')
        
        # Requirements and Notes
        special_requirements = request.form.get('special_requirements')
        invite_code = request.form.get('invite_code')

        # Convert date strings to datetime objects
        date = datetime.strptime(date_str, '%Y-%m-%dT%H:%M')
        end_date = None
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%dT%H:%M')

        # Check if invite code already exists
        existing_event = Event.query.filter_by(invite_code=invite_code).first()
        if existing_event:
            flash('Este código de convite já está em uso.', 'error')
            return render_template('create_event.html', user=current_user)

        # Create new event
        new_event = Event(
            title=title,
            description=description,
            date=date,
            end_date=end_date,
            location=location,
            event_type=event_type,
            category=category,
            theme=theme,
            dress_code=dress_code,
            venue_type=venue_type,
            accessibility=accessibility,
            parking=parking,
            public_transport=public_transport,
            capacity=int(capacity) if capacity else None,
            min_age=int(min_age) if min_age else None,
            is_public=is_public,
            requires_approval=requires_approval,
            allow_guests=allow_guests,
            photography_allowed=photography_allowed,
            price=float(price) if price else 0.0,
            payment_methods=payment_methods,
            food_service=food_service,
            activities=activities,
            materials_needed=materials_needed,
            weather_plan=weather_plan,
            contact_email=contact_email,
            contact_phone=contact_phone,
            contact_name=contact_name,
            emergency_contact=emergency_contact,
            social_media=social_media,
            website=website,
            special_requirements=special_requirements,
            invite_code=invite_code,
            user_id=current_user.id
        )

        db.session.add(new_event)
        db.session.commit()

        flash('Evento criado com sucesso!', 'success')
        return redirect(url_for('dashboard'))

    return render_template('create_event.html', user=current_user)

@app.route('/edit_event/<int:event_id>', methods=['GET', 'POST'])
@login_required
def edit_event(event_id):
    event = Event.query.get_or_404(event_id)

    # Check if the user is the creator of the event
    if event.user_id != current_user.id:
        flash('Você não tem permissão para editar este evento.', 'error')
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        event.title = request.form.get('title')
        event.description = request.form.get('description')
        date_str = request.form.get('date')
        end_date_str = request.form.get('end_date')
        event.location = request.form.get('location')
        event.event_type = request.form.get('event_type') or event.event_type or 'other'
        event.category = request.form.get('category')
        capacity = request.form.get('capacity')
        event.capacity = int(capacity) if capacity else None
        event.is_public = request.form.get('is_public') == 'on'
        event.requires_approval = request.form.get('requires_approval') == 'on'
        price = request.form.get('price')
        event.price = float(price) if price else 0.0
        event.contact_email = request.form.get('contact_email')
        event.contact_phone = request.form.get('contact_phone')
        event.special_requirements = request.form.get('special_requirements')

        # Convert date strings to datetime objects
        event.date = datetime.strptime(date_str, '%Y-%m-%dT%H:%M')
        if end_date_str:
            event.end_date = datetime.strptime(end_date_str, '%Y-%m-%dT%H:%M')
        else:
            event.end_date = None

        db.session.commit()

        flash('Evento atualizado com sucesso!', 'success')
        return redirect(url_for('dashboard'))

    return render_template('edit_event.html', event=event, user=current_user)

@app.route('/delete_event/<int:event_id>', methods=['POST'])
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Check if the user is the creator of the event
    if event.user_id != current_user.id:  # Use current_user.id instead of session['user_id']
        flash('Você não tem permissão para excluir este evento.', 'error')
        return redirect(url_for('dashboard'))
    
    db.session.delete(event)
    db.session.commit()
    
    flash('Evento excluído com sucesso!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/services')
def services():
    return render_template(
        'services.html',
        user=current_user if current_user.is_authenticated else None,
        site_name=app.config.get("SITE_NAME", "Flask App")
    )

@app.route('/about')
def about():
    return render_template(
        'about.html',
        user=current_user if current_user.is_authenticated else None,
        site_name=app.config.get("SITE_NAME", "Flask App")
    )

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        event_type = request.form.get('event_type')
        message = request.form.get('message')

        # Simulate sending an email using the configured mail server
        mail_server = app.config.get("MAIL_SERVER")
        mail_port = app.config.get("MAIL_PORT")
        mail_username = app.config.get("MAIL_USERNAME")
        mail_password = app.config.get("MAIL_PASSWORD")
        mail_use_tls = app.config.get("MAIL_USE_TLS")
        mail_use_ssl = app.config.get("MAIL_USE_SSL")

        # Log contact details (for demonstration purposes)
        print(f"Nova mensagem de contato:")
        print(f"Nome: {name}")
        print(f"Email: {email}")
        print(f"Telefone: {phone}")
        print(f"Tipo de evento: {event_type}")
        print(f"Mensagem: {message}")
        print(f"Sending email via {mail_server}:{mail_port}")
        print(f"TLS: {mail_use_tls}, SSL: {mail_use_ssl}")

        flash(app.config.get("CONTACT_SUCCESS_MESSAGE", "Mensagem enviada com sucesso! Entraremos em contato em breve."), 'success')
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

@app.route('/guest/<string:invite_code>')
def guest_area(invite_code):
    """Área pública para convidados enviarem mensagens"""
    event = Event.query.filter_by(invite_code=invite_code).first_or_404()
    messages = GuestMessage.query.filter_by(event_id=event.id, is_approved=True).order_by(GuestMessage.created_at.desc()).all()
    
    return render_template(
        'guest_area.html', 
        event=event, 
        messages=messages,
        site_name=app.config.get("SITE_NAME", "Flask App")
    )

@app.route('/guest/<string:invite_code>/send', methods=['POST'])
def send_guest_message(invite_code):
    """Enviar mensagem como convidado"""
    event = Event.query.filter_by(invite_code=invite_code).first_or_404()
    
    guest_name = request.form.get('guest_name')
    guest_email = request.form.get('guest_email')
    message_type = request.form.get('message_type', 'message')
    message = request.form.get('message')
    
    if not guest_name:
        flash('Nome é obrigatório.', 'error')
        return redirect(url_for('guest_area', invite_code=invite_code))
    
    new_message = GuestMessage(
        event_id=event.id,
        guest_name=guest_name,
        guest_email=guest_email,
        message_type=message_type,
        message=message
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    flash('Sua mensagem foi enviada com sucesso!', 'success')
    return redirect(url_for('guest_area', invite_code=invite_code))

@app.route('/event/<int:event_id>/guest_messages')
@login_required
def view_guest_messages(event_id):
    """Ver mensagens de convidados (apenas criador do evento)"""
    event = Event.query.get_or_404(event_id)
    
    if event.user_id != current_user.id:
        flash('Acesso negado.', 'error')
        return redirect(url_for('dashboard'))
    
    messages = GuestMessage.query.filter_by(event_id=event.id).order_by(GuestMessage.created_at.desc()).all()
    
    # Adicionar variável today para filtrar mensagens do dia
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    return render_template(
        'event_guest_messages.html',
        event=event,
        messages=messages,
        today=today,
        site_name=app.config.get("SITE_NAME", "Flask App")
    )

@app.route('/toggle_dark_mode', methods=['POST'])
def toggle_dark_mode():
    session['dark_mode'] = not session.get('dark_mode', False)  # Alterna o estado do dark mode
    return '', 204  # Retorna sem recarregar a página

if __name__ == '__main__':
    app.run(debug=app.config.get("DEBUG", True))