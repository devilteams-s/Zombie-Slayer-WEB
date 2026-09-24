# zombie_web/database.py - Self-contained SQLite Database Module for Zombie Slayer Web
import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "zombie_game.db")

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()

    # Users table
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 100,
        level INTEGER DEFAULT 1,
        high_score INTEGER DEFAULT 0,
        
        bonus_hp INTEGER DEFAULT 0,
        bonus_armor INTEGER DEFAULT 0,
        bonus_dmg INTEGER DEFAULT 0,
        start_knives INTEGER DEFAULT 0,
        perm_cleaver INTEGER DEFAULT 0,
        attack_speed INTEGER DEFAULT 0,
        move_speed INTEGER DEFAULT 0,
        magnet_range INTEGER DEFAULT 0,
        crit_chance INTEGER DEFAULT 0,
        armor_regen INTEGER DEFAULT 0,

        has_pistol INTEGER DEFAULT 1,
        pistol_ammo INTEGER DEFAULT 60,
        has_shotgun INTEGER DEFAULT 0,
        shotgun_ammo INTEGER DEFAULT 0,
        has_machinegun INTEGER DEFAULT 0,
        machinegun_ammo INTEGER DEFAULT 0,

        admin_god_blade INTEGER DEFAULT 0,
        admin_orbital_knives INTEGER DEFAULT 0,
        admin_hyper_boots INTEGER DEFAULT 0,
        admin_cosmic_magnet INTEGER DEFAULT 0,
        admin_nuke_cleaver INTEGER DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Scores / Game Logs
    c.execute('''
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        score INTEGER,
        wave INTEGER,
        kills INTEGER,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    ''')

    conn.commit()
    conn.close()

# Auto-initialize DB on import
init_db()

def dict_from_row(row):
    return dict(row) if row else None

def register_user(username, password):
    username = username.strip()
    if not username or not password:
        return False, "Kullanıcı adı ve şifre boş olamaz."
    if len(username) < 3:
        return False, "Kullanıcı adı en az 3 karakter olmalıdır."

    conn = get_connection()
    c = conn.cursor()
    try:
        pw_hash = hash_password(password)
        # Check if first user to make them admin
        c.execute('SELECT COUNT(*) as count FROM users')
        count = c.fetchone()['count']
        is_admin = 1 if count == 0 else 0

        c.execute('''
            INSERT INTO users (username, password_hash, is_admin)
            VALUES (?, ?, ?)
        ''', (username, pw_hash, is_admin))
        conn.commit()
        return True, "Kayıt başarılı! Giriş yapabilirsiniz."
    except sqlite3.IntegrityError:
        return False, "Bu kullanıcı adı zaten alınmış."
    except Exception as e:
        return False, f"Hata: {str(e)}"
    finally:
        conn.close()

def login_user(username, password):
    username = username.strip()
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()

    if not row:
        return False, "Kullanıcı bulunamadı.", None

    user = dict_from_row(row)
    if user['password_hash'] == hash_password(password):
        return True, "Giriş başarılı.", user
    else:
        return False, "Hatalı şifre.", None

def get_user_info(username):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    return dict_from_row(row)

def refresh_user_data(user_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    row = c.fetchone()
    conn.close()
    return dict_from_row(row)

def get_all_users():
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT id, username, level, high_score, coins, is_admin, created_at FROM users ORDER BY high_score DESC')
    rows = c.fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]

def get_leaderboard(limit=10):
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        SELECT username, high_score, level 
        FROM users 
        WHERE high_score > 0 
        ORDER BY high_score DESC 
        LIMIT ?
    ''', (limit,))
    rows = c.fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]

def buy_shop_upgrade(user_id, upgrade_key, cost):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT coins, ' + upgrade_key + ' FROM users WHERE id = ?', (user_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return False, "Kullanıcı bulunamadı."

    current_coins = row['coins']
    if current_coins < cost:
        conn.close()
        return False, "Yetersiz bakiye!"

    new_level = row[upgrade_key] + 1
    new_coins = current_coins - cost

    c.execute(f'UPDATE users SET coins = ?, {upgrade_key} = ? WHERE id = ?', (new_coins, new_level, user_id))
    conn.commit()
    conn.close()
    return True, "Yükseltme satın alındı!"

def buy_weapon(user_id, weapon_type, cost):
    col_map = {
        'shotgun': ('has_shotgun', 'shotgun_ammo', 30),
        'machinegun': ('has_machinegun', 'machinegun_ammo', 100),
        'pistol': ('has_pistol', 'pistol_ammo', 60)
    }
    if weapon_type not in col_map:
        return False, "Geçersiz silah türü."

    has_col, ammo_col, starter_ammo = col_map[weapon_type]
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT coins, ' + has_col + ' FROM users WHERE id = ?', (user_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return False, "Kullanıcı bulunamadı."

    if row[has_col] == 1:
        conn.close()
        return False, "Bu silaha zaten sahipsiniz!"

    if row['coins'] < cost:
        conn.close()
        return False, "Yetersiz para!"

    new_coins = row['coins'] - cost
    c.execute(f'UPDATE users SET coins = ?, {has_col} = 1, {ammo_col} = {ammo_col} + ? WHERE id = ?', 
              (new_coins, starter_ammo, user_id))
    conn.commit()
    conn.close()
    return True, f"{weapon_type.upper()} başarıyla satın alındı!"

def buy_ammo(user_id, weapon_type, amount, cost):
    col_map = {
        'pistol': 'pistol_ammo',
        'shotgun': 'shotgun_ammo',
        'machinegun': 'machinegun_ammo'
    }
    if weapon_type not in col_map:
        return False, "Geçersiz silah türü."

    ammo_col = col_map[weapon_type]
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT coins FROM users WHERE id = ?', (user_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return False, "Kullanıcı bulunamadı."

    if row['coins'] < cost:
        conn.close()
        return False, "Yetersiz bakiye!"

    new_coins = row['coins'] - cost
    c.execute(f'UPDATE users SET coins = ?, {ammo_col} = {ammo_col} + ? WHERE id = ?', (new_coins, amount, user_id))
    conn.commit()
    conn.close()
    return True, f"+{amount} Mermi alındı!"

def save_game_result(user_id, username, score, wave, kills, coins_earned, ammo_state=None):
    conn = get_connection()
    c = conn.cursor()

    # Log score
    c.execute('''
        INSERT INTO scores (user_id, username, score, wave, kills)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, username, score, wave, kills))

    if user_id:
        c.execute('SELECT coins, high_score FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        if row:
            new_coins = (row['coins'] or 0) + (coins_earned or 0)
            new_high = max(row['high_score'] or 0, score)

            update_sql = 'UPDATE users SET coins = ?, high_score = ?'
            params = [new_coins, new_high]

            if ammo_state and isinstance(ammo_state, dict):
                if 'pistol_ammo' in ammo_state:
                    update_sql += ', pistol_ammo = ?'
                    params.append(ammo_state['pistol_ammo'])
                if 'shotgun_ammo' in ammo_state:
                    update_sql += ', shotgun_ammo = ?'
                    params.append(ammo_state['shotgun_ammo'])
                if 'machinegun_ammo' in ammo_state:
                    update_sql += ', machinegun_ammo = ?'
                    params.append(ammo_state['machinegun_ammo'])

            update_sql += ' WHERE id = ?'
            params.append(user_id)
            c.execute(update_sql, tuple(params))

    conn.commit()
    conn.close()

def admin_set_user_level(username, level):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE users SET level = ? WHERE username = ?', (level, username))
    conn.commit()
    conn.close()
    return True, f"{username} kullanıcısının seviyesi {level} yapıldı."

def admin_set_user_score(username, score):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE users SET high_score = ? WHERE username = ?', (score, username))
    conn.commit()
    conn.close()
    return True, f"{username} kullanıcısının skoru {score} yapıldı."

def add_coins_to_user(username, amount):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE users SET coins = coins + ? WHERE username = ?', (amount, username))
    conn.commit()
    conn.close()
    return True, f"{username} hesabına {amount} para eklendi."
