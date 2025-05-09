from flask import Flask, render_template, url_for, redirect, request, jsonify, send_from_directory, flash, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, LoginManager, login_required, logout_user, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import InputRequired, Length, ValidationError, Email, EqualTo
from flask_bcrypt import Bcrypt
import os
import secrets
from datetime import datetime, timedelta
from flask_mail import Mail, Message  # Import Flask-Mail
from sqlalchemy.exc import IntegrityError, SQLAlchemyError  # Import IntegrityError and SQLAlchemyError
from email_validator import validate_email, EmailNotValidError  # Import email validator
import logging  # Import the logging module

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///project_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'thisisasecretkey'  # Change to a long, random, hard-to-guess string in production
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Or your provider
app.config['MAIL_PORT'] = 587  # Or the correct port
app.config['MAIL_USE_TLS'] = True  # Or SSL, if required
app.config['MAIL_USERNAME'] = 'jeaddeah.francia@gmail.com'  # YOUR email
app.config['MAIL_PASSWORD'] = 'dwkpjtqqjecbqobs'  # YOUR password or App Password!
app.config['MAIL_DEFAULT_SENDER'] = 'jeaddeah.francia@gmail.com'  # same as username
mail = Mail(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Please log in to access this page."  # Set a custom message

# Configure logging
logging.basicConfig(level=logging.INFO)  # Set the logging level


@login_manager.user_loader
def load_user(user_id):
    """
    This is the user loader function that Flask-Login uses.
    It should take the Unicode ID of a user, and return the corresponding user object.
    It should return None if the ID is not valid.
    """
    try:
        user_id_int = int(user_id)  # Convert user_id to integer
        return User.query.get(user_id_int)
    except ValueError:
        logging.error(f"Invalid user ID: {user_id}")
        return None


class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(200), nullable=True)


# Mock data for games (Consider moving this to a separate file or database seed)
games = [
    {
        "id": "1",
        "title": "CHECKERS",
        "image_filename": "checkers.png",
        "description": "Leap, capture, and crown your way to victory!",
        "category": "Strategy",
        "how_to_play": [
            "Click 'Play Now' to begin.",
            "Players take turns moving one of their pieces diagonally.",
            "The PRIMARY GOAL is to 'eat' (capture) the opponent's pieces by jumping over them diagonally into an empty square immediately beyond.",
            {
                "main_point": "Movement Rules:",
                "sub_points": [
                    "Regular Pieces: Can only move forward diagonally one square to an adjacent empty square (either to the right-front or left-front).",
			        "Kings: When one of your pieces reaches the opponent's king row (the back row on their side of the board), it is crowned and becomes a 'King'. Kings can move one square diagonally in any of the four directions: forward-right, forward-left, backward-right, or backward-left.",
                ]
            },
            "If a capture is possible, you MUST take it. Capturing is always the priority over a regular move.",
            "The first player to capture all of their opponent's pieces wins the game."
        ],
    },
    {
        "id": "2",
        "title": "CHESS",
        "image_filename": "chess.png",
        "description": "Outthink, outplay, and checkmate your way to glory.",
        "category": "Strategy",
        "how_to_play": [
            "Click 'Play Now' to begin.",
            "Each player starts with 16 pieces: a King, a Queen, two Rooks, two Knights, two Bishops, and eight Pawns. These are arranged in a specific starting position on an 8x8 checkered board.",
            {
                "main_point": "Players take turns moving one of their pieces. Each type of piece has its own unique way of moving:",
                "sub_points": [
                        "King: Moves one square in any direction (horizontally, vertically, or diagonally).",
                        "Queen: Moves any number of squares horizontally, vertically, or diagonally.",
                        "Rook: Moves any number of squares horizontally or vertically.",
                        "Bishop: Moves any number of squares diagonally.",
                        "Knight: Moves in an 'L' shape: two squares in one direction (horizontally or vertically) and then one square perpendicularly.",
                        "Pawn: Moves one square forward, but can move two squares forward on its first move. Pawns capture opponent's pieces diagonally one square forward."
                ]
            },
            "Capturing opponent's pieces is done by moving your piece to the square occupied by the opponent's piece. The captured piece is removed from the board.",
            "A key concept is 'check': when your King is under attack by an opponent's piece. The player whose King is in check must make a move to remove the threat.",
            "The ultimate goal is to 'checkmate' the opponent's King. Checkmate occurs when the King is in check and there is no legal move that can remove it from attack.",
            "The player who delivers checkmate wins the game."
        ],
    },
    {
        "id": "3",
        "title": "MEMORY",
        "image_filename": "memory.png",
        "description": "Flip, match, and train your brain with every turn.",
        "category": "Puzzle",
        "how_to_play": [
            "Click 'Play Now' to begin.",
            "On each turn, click on two cards to flip them over and reveal what's underneath.",
            "Your goal is to find matching pairs of cards. If the two cards you flipped are a match, they will remain face-up.",
            "If the cards are not a match, they will be flipped back face-down. Pay close attention and remember what was on each card and where it was located!",
            "Continue taking turns flipping two cards until all pairs have been successfully matched and the entire board is cleared.",
            "Try to remember the location of the cards and find all the pairs using the fewest number of moves."
        ],
    },
    {
        "id": "4",
        "title": "SCRABBLE",
        "image_filename": "scrabble.png",
        "description": "Craft clever words and dominate the board with brainpower.",
        "category": "Word",
        "how_to_play": [
            "Click 'Play Now' to begin.",
            "Each player (you and the AI) starts with a rack of 7 letter tiles drawn randomly from a bag of 86 tiles.",
            "As the first player, you should form a word of at least two letters on the center star space of the board.",
            "Subsequent players take turns. While standard play involves adding letters to existing words to form new, valid English words that connect to at least one previously played letter, be aware that the AI opponent frequently chooses to pass its turn instead of playing.",
            "All words formed in a turn by the human player (horizontally and vertically) must be valid English words. Due to the AI's tendency to pass, opportunities to build upon existing words may be limited.",
            "Players (you and AI) draw new tiles from the bag to replenish their racks to 7 after each of their turns. However, if both players pass twice consecutively (a total of four passes), the game will end, potentially with very few words played.",
            "Scoring is based on the letter values of the tiles used and the premium squares (Double Letter Score, Triple Letter Score, Double Word Score, Triple Word Score) that the word covers.",
            "The game ends when all tiles have been drawn from the bag and one player has used all their tiles, or when all possible plays have been made.",
            "The player with the highest total score at the end of the game wins."
        ],
    },
    {
        "id": "5",
        "title": "SNAKES AND LADDERS",
        "image_filename": "snakes_and_ladders.png",
        "description": "Slide down snakes or shoot up ladders—your luck decides!",
        "category": "Board Game",
        "how_to_play": [
            "Click 'Play Now' to begin.",
            "Before starting, you can choose to play with 2, 3, or 4 players.",
            "Players take turns rolling a standard six-sided die.",
            "The number rolled on the die indicates how many squares your token moves along the numbered path on the game board.",
            "If a player rolls a 6, they move their token accordingly AND get an extra turn to roll the die again.",
            "If your token lands exactly on the bottom of a ladder, you immediately climb up to the square at the top of the ladder, allowing for faster progress.",
            "However, if your token lands exactly on the head of a snake, you must slide down to the square at the snake's tail, potentially losing progress.",
            "The first player to reach the final square [100] wins the game. You must land exactly on the final square; if your roll takes you beyond it, you typically need to roll the exact number to land on it in a subsequent turn."
        ],
    },
    {
        "id": "6",
        "title": "SPACE INVADERS",
        "image_filename": "space_invaders.png",
        "description": "Blast waves of aliens in this retro space showdown!",
        "category": "Arcade",
        "how_to_play": [
            "Click 'Play Now' to begin.",
            "Move your spaceship left and right using the arrow keys.",
            "Press the Spacebar to fire your laser cannon.",
            "Your primary objective is to eliminate the waves of descending alien invaders in each wave before they reach the bottom of the screen. If enemies reach the bottom (disappear from the canvas), the game will end. Note: The regular alien invaders do not fire back.",
            "Be aware! Periodically, a BIG MONSTER will appear after you capture 30 aliens! This creature is tougher to defeat and may have unique attack patterns.",
            "Focus your fire on both the regular aliens and the BIG MONSTER when it appears.",
            "Avoid any attacks from the BIG MONSTER.",
            "You have a limited number of lives. Losing all your lives ends the game."
        ],
    },
    {
        "id": "7",
        "title": "TETRIS",
        "image_filename": "tetris.png",
        "description": "Drop, rotate, and stack your way to a perfect line!",
        "category": "Puzzle",
        "how_to_play": [
            "Click 'Play Now' to begin.",
            "As blocks fall from the top of the screen, use the left and right arrow keys to move them horizontally.",
            "Use the up arrow key to rotate the falling tetrominoes.",
            "Your goal is to maneuver and rotate the falling blocks so they fit together to form complete horizontal lines across the playing field.",
            "When a horizontal line is completely filled with blocks, it disappears, and you earn points. The blocks above the cleared line will shift down.",
            "Strategically clear multiple lines at once to earn significantly more points.",
            "The game continues as more and more blocks fall at an increasing speed.",
            "The game ends when the falling blocks stack up and reach the top of the playing field, preventing new blocks from entering."
        ],
    },
    {
        "id": "8",
        "title": "TIC TAC TOE",
        "image_filename": "tic_tac_toe.png",
        "description": "Simple, quick, and always a battle of wits and Xs!",
        "category": "Puzzle",
        "how_to_play": [
            "Click 'Play Now' to begin.",
            "Players take turns choosing an empty square on the 3x3 grid to place their mark (one player uses 'X', the other uses 'O').",
            "The first player to get three of their marks in a row (horizontally, vertically, or diagonally) wins the game.",
            "If all nine squares on the grid are filled and neither player has three in a row, the game is a draw."
        ],
    }
]

# Ensure static directories exist
os.makedirs(os.path.join(app.root_path, 'static', 'css'), exist_ok=True)
os.makedirs(os.path.join(app.root_path, 'static', 'js'), exist_ok=True)
os.makedirs(os.path.join(app.root_path, 'static', 'images'), exist_ok=True)  # For game images


# Routes
@app.route('/', methods=['GET', 'POST'])
def home():
    """
    Renders the home page, displaying a list of games and categories.
    """
    try:
        # Get unique categories
        categories = set(game['category'] for game in games)
        category_counts = {}
        for category in categories:
            category_counts[category] = len([game for game in games if game['category'] == category])
        return render_template('index.html', games=games, categories=category_counts)
    except Exception as e:
        logging.error(f"Error in home route: {e}")
        flash("Sorry, there was an error loading the homepage.", "error")
        return render_template('index.html', games=[], categories={})  # Return empty data to prevent crash


@app.route('/static/<path:filename>')
def static_files(filename):
    """
    Serves static files (CSS, JS, images).  Flask handles this automatically,
    but this explicit route can be helpful for debugging or custom handling.
    """
    try:
        return send_from_directory('static', filename)
    except Exception as e:
        logging.error(f"Error serving static file {filename}: {e}")
        abort(404)  # Return a 404 Not Found error


@app.route('/game/<game_id>')
def game_page(game_id):
    """
    Renders the page for a specific game.

    Args:
        game_id: The ID of the game to display.
    """
    try:
        # Find the game with the matching ID
        game = next((game for game in games if game['id'] == game_id), None)

        if game:
            return render_template('game.html', game=game)
        else:
            flash(f"Game with ID {game_id} not found.", "error")
            return redirect(url_for('home'))  # Redirect to home with error
    except Exception as e:
        logging.error(f"Error in game_page route for game_id {game_id}: {e}")
        flash("Sorry, there was an error loading the game page.", "error")
        return redirect(url_for('home'))


@app.route('/search')
def search():
    """
    Handles game searches (case-insensitive, title-only).
    """
    query = request.args.get('query', '').strip().lower()
    try:
        if not query:
            return redirect(url_for('home'))

        # Case-insensitive match based only on the game title
        filtered_games = [game for game in games if query in game['title'].lower()]

        return render_template('search.html', games=filtered_games, query=request.args.get('query', ''))
    except Exception as e:
        logging.error(f"Error in search route with query {query}: {e}")
        flash("Sorry, there was an error performing the search.", "error")
        return render_template('search.html', games=[], query=request.args.get('query', ''))


class RegisterForm(FlaskForm):
    """
    Form for user registration.
    """
    username = StringField('Username', validators=[
        InputRequired(), Length(min=4, max=20)], render_kw={"placeholder": "Username"})
    email = StringField('Email', validators=[InputRequired(), Email(), Length(max=120)],
                        render_kw={"placeholder": "Email"})
    password = PasswordField('Password', validators=[
        InputRequired(), Length(min=8, max=20), EqualTo('confirm_password', message='Passwords must match')],
                             render_kw={"placeholder": "Password"})
    confirm_password = PasswordField('Confirm Password', validators=[InputRequired()],
                                     render_kw={"placeholder": "Confirm Password"})  # Added confirm password field
    submit = SubmitField('Register')

    def validate_username(self, username):
        """
        Validates that the username is unique.
        """
        existing_user = User.query.filter_by(username=username.data).first()
        if existing_user:
            raise ValidationError('That username is already taken. Please choose a different one.')

    def validate_email(self, email):
        """
        Validates that the email is unique.
        """
        existing_user = User.query.filter_by(email=email.data).first()
        if existing_user:
            raise ValidationError('That email address is already in use.')
        try:
            validate_email(email.data)  # Use email_validator
        except EmailNotValidError as e:
            raise ValidationError(str(e))


class LoginForm(FlaskForm):
    """
    Form for user login.
    """
    username = StringField('Username', validators=[
        InputRequired(), Length(min=4, max=20)], render_kw={"placeholder": "Username"})
    password = PasswordField('Password', validators=[
        InputRequired(), Length(min=8, max=20)], render_kw={"placeholder": "Password"})
    submit = SubmitField('Login')


class ForgotPasswordForm(FlaskForm):
    """
    Form for requesting a password reset.
    """
    email = StringField('Email', validators=[InputRequired(), Email()], render_kw={"placeholder": "Enter your email"})
    submit = SubmitField('Reset Password')


class ResetPasswordForm(FlaskForm):
    """
    Form for setting a new password after a reset request.
    """
    password = PasswordField('New Password', validators=[
        InputRequired(), Length(min=8, max=20), EqualTo('confirm_password', message='Passwords must match')],
                             render_kw={"placeholder": "New Password"})
    confirm_password = PasswordField('Confirm New Password', validators=[InputRequired()],
                                     render_kw={"placeholder": "Confirm New Password"})
    submit = SubmitField('Update Password')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    Handles user login.
    """
    form = LoginForm()
    try:
        if form.validate_on_submit():
            user = User.query.filter_by(username=form.username.data).first()
            if user and bcrypt.check_password_hash(user.password, form.password.data):
                login_user(user)
                flash('Login successful!', 'success')
                logging.info(f"User {user.username} logged in successfully.")
                return redirect(url_for('login'))  # Redirect back to login page
            else:
                flash('Invalid username or password.', 'error')
                logging.warning(f"Failed login attempt for username: {form.username.data}")
        return render_template('login.html', form=form)
    except Exception as e:
        logging.error(f"Error during login: {e}")
        flash('An error occurred during login. Please try again.', 'error')
        return render_template('login.html', form=form)



@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    """
    Handles user logout.
    """
    try:
        logout_user()
        flash('Logged out successfully!', 'success')
        return redirect(url_for('login'))
    except Exception as e:
        logging.error(f"Error during logout: {e}")
        flash('An error occurred during logout.', 'error')
        return redirect(url_for('home'))  # redirect


@app.route('/register', methods=['GET', 'POST'])
def register():
    """
    Handles user registration.
    """
    form = RegisterForm()
    try:
        if form.validate_on_submit():
            hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
            new_user = User(username=form.username.data, password=hashed_password, email=form.email.data)
            db.session.add(new_user)
            db.session.commit()
            flash('Registration successful! Please log in.', 'success')
            logging.info(f"User {new_user.username} registered successfully.")
            return redirect(url_for('login'))
        return render_template('register.html', form=form)
    except IntegrityError:
        db.session.rollback()
        flash('Username or email already exists. Please choose a different one.', 'error')
        logging.warning(f"Registration failed due to duplicate username/email.")
        return render_template('register.html', form=form)
    except SQLAlchemyError as e:  # Catch other SQLAlchemy errors
        db.session.rollback()
        flash('Database error occurred. Please try again later.', 'error')
        logging.error(f"Database error during registration: {e}")
        return render_template('register.html', form=form)
    except Exception as e:
        db.session.rollback()
        flash('An unexpected error occurred. Please try again.', 'error')
        logging.error(f"Error during registration: {e}")
        return render_template('register.html', form=form)


@app.route("/user_status")
def user_status():
    """
    Returns the login status of the user as a JSON response.
    """
    try:
        if current_user.is_authenticated:
            return jsonify({"logged_in": True, "username": current_user.username})
        return jsonify({"logged_in": False})
    except Exception as e:
        logging.error(f"Error in user_status route: {e}")
        return jsonify({"logged_in": False, "error": "Failed to retrieve user status"})


@app.route('/play_game/<game_id>')
def play_game(game_id):
    try:
        # Find the game with the matching ID
        game = next((game for game in games if game['id'] == game_id), None)

        if not game:
            flash(f"Game with ID {game_id} not found.", "error")
            return redirect(url_for('home'))

        # Track that user played a game - can be used for task completion
        if current_user.is_authenticated:
            check_and_complete_tasks(current_user.id, 'play_game', game_id)

        # redirect to the appropriate template
        template_name = f"{game['title'].lower().replace(' ', '_')}.html"
        return render_template(template_name, game=game)

    except Exception as e:
        logging.error(f"Error in play_game route for game_id {game_id}: {e}")
        flash("Sorry, there was an error starting the game.", "error")
        return redirect(url_for('game_page', game_id=game_id))


def send_reset_email(user):
    token = generate_reset_token(user.email)
    reset_link = url_for('reset_password', token=token, _external=True)
    reset_link = reset_link.replace('127.0.0.1', '<192.168.129.3>')  # Replace with your local IP
    subject = "Password Reset Request"
    body = f"""
    Hello {user.username},

    To reset your password, click the link below:
    {reset_link}

    This link will expire in 1 hour.

    If you didn't request this, please ignore this message.
    """

    msg = Message(subject=subject, body=body, recipients=[user.email])

    try:
        mail.send(msg)
        app.logger.info(f"Sent password reset email to {user.email}")
        return True
    except Exception as e:
        app.logger.error(f"Error sending password reset email: {e}")
        flash('Failed to send reset email. Please try again.', 'error')
        return False


@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    form = ForgotPasswordForm()
    print("forgot_password route called")  # add
    if form.validate_on_submit():
        print("form validated")  # add
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            print("user found")  # add
            if send_reset_email(user):
                print("email sent")  # add
                flash('An email has been sent with instructions to reset your password.', 'success')
                return redirect(url_for('login'))
            else:
                print("email send failed")  # add
                flash('Failed to send reset email. Please try again.', 'error')
                return render_template('forgot_password.html', form=form)
        else:
            print("user not found")  # add
            flash('Email not found. Please check the email address.', 'error')
            return render_template('forgot_password.html', form=form)
    print("form not validated")  # add
    return render_template('forgot_password.html', form=form)


@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    email = verify_reset_token(token)
    if not email:
        flash('Invalid or expired token.', 'error')
        return redirect(url_for('forgot_password'))

    user = User.query.filter_by(email=email).first()
    if not user:
        flash('User not found.', 'error')
        return redirect(url_for('forgot_password'))

    form = ResetPasswordForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user.password = hashed_password
        db.session.commit()
        flash('Your password has been reset. Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('reset_password.html', form=form)


@app.route("/terms")
def terms():
    return render_template("terms_of_use.html")


@app.route("/privacy")
def privacy_policy():
    return render_template("privacy_policy.html")  # Changed filename here


@app.route("/game_developers")  # New route for the Game Developers page
def game_developers():
    return render_template("game_developers.html")


from itsdangerous import URLSafeTimedSerializer


def generate_reset_token(email):
    serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='password-reset-salt')


def verify_reset_token(token, max_age=3600):  # expires in 1 hour
    serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=max_age)
    except Exception:
        return None
    return email


@app.route('/tasks', methods=['GET', 'POST'])
@login_required
def tasks():

    try:
        # Get tasks relevant to the current user
        # First, get tasks that are assigned to all users (global tasks)
        global_tasks = Task.query.filter(
            (Task.game_id.is_(None)) |
            (Task.task_type.in_(
                [Task.PLAY_GAME]))
        ).all()

        # Get the user's task progress
        user_tasks = {}
        if current_user.is_authenticated:
            user_task_records = UserTask.query.filter_by(user_id=current_user.id).all()
            for user_task in user_task_records:
                user_tasks[user_task.task_id] = user_task

        # Prepare tasks for display
        tasks = []
        for task in global_tasks:
            task_info = {
                'id': task.id,
                'description': task.description,
                'reward_points': task.reward_points,
                'created_at': task.created_at,
                'due_date': task.due_date,
                'completed': False
            }

            if task.id in user_tasks:
                task_info['completed'] = user_tasks[task.id].completed

            tasks.append(task_info)

        return render_template('tasks.html', tasks=tasks, current_user=current_user)

    except Exception as e:
        logging.error(f"Error in tasks route: {e}")
        flash("Sorry, there was an error loading the tasks page.", "error")
        return redirect(url_for('home'))


@app.route('/rewards', methods=['GET', 'POST'])
@login_required
def rewards():
    """
    Handles the rewards page, displaying available rewards and allowing users to claim them.
    """
    try:
        if request.method == 'POST':
            if 'claim_reward' in request.form:
                # Claim a reward
                reward_id = request.form.get('reward_id')
                reward = Reward.query.get(reward_id)

                if reward:
                    # Check if the user has already claimed this reward
                    existing_claim = UserReward.query.filter_by(user_id=current_user.id, reward_id=reward_id).first()

                    if existing_claim:
                        flash('You have already claimed this reward.', 'info')
                    elif current_user.points < reward.points_cost:
                        flash(f'Not enough points. You need {reward.points_cost} points to claim this reward.', 'error')
                    else:
                        # Deduct points and create user_reward record
                        current_user.points -= reward.points_cost

                        # Generate a unique voucher code if one doesn't exist
                        voucher_code = reward.voucher_code
                        if not voucher_code:
                            voucher_code = f"{reward.title.replace(' ', '-')}-{secrets.token_hex(4)}".upper()

                        user_reward = UserReward(user_id=current_user.id, reward_id=reward_id,
                                                 voucher_code=voucher_code)
                        db.session.add(user_reward)
                        db.session.commit()
                        flash(f'Reward claimed successfully! {reward.points_cost} points have been deducted.',
                              'success')
                else:
                    flash('Reward not found.', 'error')

        # Get IDs of rewards already claimed by the user
        claimed_reward_ids = db.session.query(UserReward.reward_id).filter_by(user_id=current_user.id).subquery()

        # Get all available rewards not expired and not already claimed
        available_rewards = Reward.query.filter(
            ((Reward.expiry_date.is_(None)) | (Reward.expiry_date > datetime.utcnow())) &
            ~Reward.id.in_(claimed_reward_ids)
        ).all()

        # Get the user's claimed rewards
        claimed_rewards = []
        if current_user.is_authenticated:
            user_reward_records = UserReward.query.filter_by(user_id=current_user.id).all()
            for user_reward in user_reward_records:
                reward = Reward.query.get(user_reward.reward_id)
                if reward:
                    reward_info = {
                        'id': reward.id,
                        'title': reward.title,
                        'description': reward.description,
                        'points_cost': reward.points_cost,
                        'voucher_code': user_reward.voucher_code,
                        'claimed_at': user_reward.claimed_at
                    }
                    claimed_rewards.append(reward_info)

        return render_template('rewards.html', available_rewards=available_rewards, claimed_rewards=claimed_rewards,
                               current_user=current_user)

    except Exception as e:
        logging.error(f"Error in rewards route: {e}")
        flash("Sorry, there was an error loading the rewards page.", "error")
        return redirect(url_for('home'))


class Task(db.Model):
    """
    Represents a task that users can complete to earn points.
    """
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    reward_points = db.Column(db.Integer, nullable=False, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=True)
    task_type = db.Column(db.String(50), nullable=True)  # Type of task
    required_count = db.Column(db.Integer, default=1)  # How many times the action needs to be performed
    game_id = db.Column(db.String(20), nullable=True)  # Specific game ID if task is game-specific

    # Predefined task types
    PLAY_GAME = 'play_game'  # Play a game

    def __repr__(self):
        return f'<Task {self.description}>'  # helpful for debugging


class UserTask(db.Model):
    """
    Association table for users and tasks to track completion status.
    """
    __tablename__ = 'user_tasks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    progress_count = db.Column(db.Integer, default=0)  # Track progress for tasks requiring multiple actions
    task_data = db.Column(db.JSON, nullable=True)  # Store additional data like played games, timestamps, etc.

    def __repr__(self):
        return f'<UserTask {self.user_id}:{self.task_id}>'  # helpful for debugging


class Reward(db.Model):
    """
    Represents a reward that users can claim using their points.
    """
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    points_cost = db.Column(db.Integer, nullable=False)
    voucher_code = db.Column(db.String(50), nullable=True)  # Optional voucher code
    expiry_date = db.Column(db.DateTime, nullable=True)  # Optional expiry date
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Reward {self.title}>'  # helpful for debugging


class UserReward(db.Model):
    """
    Association table for users and rewards to track claimed rewards.
    """
    __tablename__ = 'user_rewards'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('reward.id'), nullable=False)
    claimed_at = db.Column(db.DateTime, default=datetime.utcnow)
    voucher_code = db.Column(db.String(50), nullable=True)  # The specific voucher code for this user

    def __repr__(self):
        return f'<UserReward {self.user_id}:{self.reward_id}>'


class User(db.Model, UserMixin):
    """
    Represents a user in the database.
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)  # Store hashed passwords
    email = db.Column(db.String(120), nullable=False, unique=True)
    points = db.Column(db.Integer, default=0)  # Points earned from completing tasks

    # Relationships
    tasks = db.relationship('Task', secondary='user_tasks', backref='users')
    rewards = db.relationship('Reward', secondary='user_rewards', backref='users')

    def __repr__(self):
        return f'<User {self.username}>'  # helpful for debugging


def check_and_complete_tasks(user_id, action_type, game_id=None, action_value=None):
    """
    Check if any tasks should be completed based on user actions and update accordingly.

    Parameters:
    - user_id: The ID of the current user
    - action_type: Type of action (e.g., 'play_game', 'win_game')
    - game_id: ID of the game involved in the action (if applicable)
    - action_value: Additional value related to the action (e.g., score)
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return

        # Get relevant tasks based on action type
        tasks = Task.query.filter(
            ((Task.task_type == action_type) | (Task.task_type.is_(None))) &
            ((Task.game_id == game_id) | (Task.game_id.is_(None)))
        ).all()

        # Special handling for play_different_games task type
        if action_type == 'play_game':
            different_games_tasks = Task.query.filter_by(task_type='play_different_games').all()
            for task in different_games_tasks:
                user_task = UserTask.query.filter_by(user_id=user_id, task_id=task.id).first()
                if not user_task:
                    user_task = UserTask(user_id=user_id, task_id=task.id, progress_count=0)
                    db.session.add(user_task)

                # Check if this game has been played before
                played_games = user_task.task_data.get('played_games', []) if user_task.task_data else []
                if game_id not in played_games:
                    played_games.append(game_id)
                    if not user_task.task_data:
                        user_task.task_data = {}
                    user_task.task_data['played_games'] = played_games
                    user_task.progress_count = len(played_games)

                    # Check if task is now complete
                    if user_task.progress_count >= task.required_count and not user_task.completed:
                        user_task.completed = True
                        user_task.completed_at = datetime.utcnow()
                        user.points += task.reward_points
                        flash(f'Task completed: {task.description}! You earned {task.reward_points} points.', 'success')


        # Process standard tasks
        for task in tasks:
            # Check if user already has a record for this task
            user_task = UserTask.query.filter_by(user_id=user_id, task_id=task.id).first()

            if not user_task:
                # Create new user_task record
                user_task = UserTask(user_id=user_id, task_id=task.id, progress_count=1)
                db.session.add(user_task)

                # Check if task is complete upon initialization
                if user_task.progress_count >= task.required_count:
                    user_task.completed = True
                    user_task.completed_at = datetime.utcnow()
                    user.points += task.reward_points
                    flash(f'Task completed: {task.description}! You earned {task.reward_points} points.', 'success')

            elif not user_task.completed:
                # Update progress
                user_task.progress_count += 1

                # Check if task is now complete
                if user_task.progress_count >= task.required_count:
                    user_task.completed = True
                    user_task.completed_at = datetime.utcnow()
                    user.points += task.reward_points
                    flash(f'Task completed: {task.description}! You earned {task.reward_points} points.', 'success')

        db.session.commit()
    except Exception as e:
        logging.error(f"Error in check_and_complete_tasks: {e}")
        db.session.rollback()


def create_default_tasks_and_rewards():
    try:
        # Only create default tasks if none exist
        if Task.query.count() == 0:
            default_tasks = [
                {'description': 'Play Checkers game', 'reward_points': 50, 'task_type': Task.PLAY_GAME, 'game_id': '1',
                 'required_count': 1},
                {'description': 'Play Chess game', 'reward_points': 55, 'task_type': Task.PLAY_GAME, 'game_id': '2',
                 'required_count': 1},
                {'description': 'Play Memory game', 'reward_points': 45, 'task_type': Task.PLAY_GAME, 'game_id': '3',
                 'required_count': 1},
                {'description': 'Play Scrabble game', 'reward_points': 65, 'task_type': Task.PLAY_GAME, 'game_id': '4',
                 'required_count': 1},
                {'description': 'Play Snakes and Ladders game', 'reward_points': 40, 'task_type': Task.PLAY_GAME, 'game_id': '5',
                 'required_count': 1},
                {'description': 'Play Space Invaders game', 'reward_points': 35, 'task_type': Task.PLAY_GAME, 'game_id': '6',
                 'required_count': 1},
                {'description': 'Play Tetris game', 'reward_points': 30, 'task_type': Task.PLAY_GAME, 'game_id': '7',
                 'required_count': 1},
                {'description': 'Play Tic Tac Toe game', 'reward_points': 25, 'task_type': Task.PLAY_GAME, 'game_id': '8',
                 'required_count': 1},
                {'description': 'Complete a word game', 'reward_points': 60, 'task_type': Task.PLAY_GAME,
                 'game_id': '4',
                 'required_count': 1},
                {'description': 'Complete a board game', 'reward_points': 70, 'task_type': Task.PLAY_GAME,
                 'game_id': '5',
                 'required_count': 1},
                {'description': 'Complete a arcade game', 'reward_points': 75, 'task_type': Task.PLAY_GAME,
                 'game_id': '6',
                 'required_count': 1},
            ]

            for task_data in default_tasks:
                task = Task(**task_data)
                db.session.add(task)

            db.session.commit()
            logging.info("Created default tasks")

        # Only create default rewards if none exist
        if Reward.query.count() == 0:
            default_rewards = [
                {'title': 'IPhone 16 Pro Max Raffle Ticket',
                 'description': 'Enter the raffle for a chance to win an iPhone 16 Pro Max!', 'points_cost': 550},
                {'title': 'GCASH Voucher (PHP 20.00)', 'description': 'Redeem a GCASH voucher worth PHP 20.00.',
                 'points_cost': 100},
                {'title': 'Puregold Gift Card (PHP 100.00)',
                 'description': 'Redeem a Puregold Gift Card worth PHP 100.00.', 'points_cost': 200},
                {'title': 'Krispy Kreme Voucher (PHP 100.00 Off)',
                 'description': 'Get a voucher for PHP 100.00 off your purchase at Krispy Kreme.', 'points_cost': 250},
                {'title': 'Vikings Luxury Buffet Voucher (PHP 200.00 Off)',
                 'description': 'Claim a voucher for PHP 200.00 off at Vikings Luxury Buffet.', 'points_cost': 450},
                {'title': 'SM Gift Pass (PHP 200.00)', 'description': 'Redeem an SM Gift Pass worth PHP 200.00.',
                 'points_cost': 350},
                {'title': 'SHEIN Gift Card (PHP 200.00)', 'description': 'Redeem a SHEIN Gift Card worth PHP 200.00.',
                 'points_cost': 350},
                {'title': 'ZALORA Gift Card (PHP 200.00)', 'description': 'Redeem a ZALORA Gift Card worth PHP 200.00.',
                 'points_cost': 350},
                {'title': 'Robinsons eGift (PHP 100.00)', 'description': 'Redeem a Robinsons eGift worth PHP 200.00.',
                 'points_cost': 200},
                {'title': 'Roblox Digital Card (300 Robux)', 'description': 'Redeem to earn 300 Robux!.',
                 'points_cost': 300}
            ]

            for reward_data in default_rewards:
                reward = Reward(**reward_data)
                db.session.add(reward)

            db.session.commit()
            logging.info("Created default rewards")

    except Exception as e:
        db.session.rollback()
        logging.error(f"An unexpected error occurred during default task/reward creation: {e}")

@app.route('/api/tasks/status')
def get_task_status():
    if not current_user.is_authenticated:
        return jsonify([]), 401

    user_tasks = UserTask.query.filter_by(user_id=current_user.id).all()
    task_statuses = []
    for user_task in user_tasks:
        task = Task.query.get(user_task.task_id)
        if task:
            task_statuses.append({
                'task_id': task.id,
                'completed': user_task.completed,
                'progress_count': user_task.progress_count,
                'required_count': task.required_count,
                'user_points': current_user.points  # Include this for real-time update
            })

    return jsonify(task_statuses)


# Ensure templates directory exists
os.makedirs(os.path.join(app.root_path, 'templates'), exist_ok=True)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_default_tasks_and_rewards()
    app.run(debug=True, host='192.168.129.3')
