#!/usr/bin/env python3
# zombie_web/server.py - Lightweight REST API & Web Server for Zombie Slayer Web
import http.server
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import socketserver
import json
import os
import sys
import threading
import urllib.parse

# Import database module (first try local zombie_web, then fallback)
try:
    import database
except ImportError:
    PARENT_DIR = os.path.dirname(os.path.abspath(__file__))
    if PARENT_DIR not in sys.path:
        sys.path.insert(0, PARENT_DIR)
    import database

WEB_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORTS = [8000, 8080]
ACTIVE_SERVERS = []

def get_local_ip():
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class ZombieApiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def _read_json(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0:
                return {}
            body = self.rfile.read(content_length).decode('utf-8')
            return json.loads(body)
        except Exception:
            return {}

    def _send_json(self, data, status=200):
        self._set_headers(status, "application/json")
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return

        if path.startswith("/api/"):
            if path == "/api/server/info":
                local_ip = get_local_ip()
                current_port = self.server.server_address[1]
                active_ports = [s.server_address[1] for s in ACTIVE_SERVERS] if ACTIVE_SERVERS else [current_port]
                self._send_json({
                    "success": True,
                    "local_ip": local_ip,
                    "port": current_port,
                    "active_ports": active_ports,
                    "lan_url": f"http://{local_ip}:{current_port}",
                    "local_url": f"http://localhost:{current_port}"
                })
                return

            elif path == "/api/leaderboard":
                limit = int(query.get('limit', ['10'])[0])
                rows = database.get_leaderboard(limit=limit)
                self._send_json({"success": True, "leaderboard": rows})
                return

            elif path == "/api/user/info":
                username = query.get('username', [''])[0]
                user_data = database.get_user_info(username)
                if user_data:
                    user_data.pop('password_hash', None)
                    self._send_json({"success": True, "user": user_data})
                else:
                    self._send_json({"success": False, "message": "Kullanıcı bulunamadı"}, 404)
                return

            elif path == "/api/users":
                users = database.get_all_users()
                self._send_json({"success": True, "users": users})
                return

            else:
                self._send_json({"success": False, "message": "Geçersiz API Endpoint"}, 404)
                return

        # Serve static web files
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_json()

        if not path.startswith("/api/"):
            self._send_json({"success": False, "message": "Not Found"}, 404)
            return

        if path == "/api/auth/register":
            username = body.get("username", "")
            password = body.get("password", "")
            success, msg = database.register_user(username, password)
            self._send_json({"success": success, "message": msg}, 200 if success else 400)
            return

        elif path == "/api/auth/login":
            username = body.get("username", "")
            password = body.get("password", "")
            success, msg, user_data = database.login_user(username, password)
            if success and user_data:
                user_data.pop('password_hash', None)
                self._send_json({"success": True, "message": msg, "user": user_data})
            else:
                self._send_json({"success": False, "message": msg}, 401)
            return

        elif path == "/api/shop/buy_upgrade":
            user_id = body.get("user_id")
            upgrade_key = body.get("upgrade_key")
            cost = body.get("cost", 0)
            success, msg = database.buy_shop_upgrade(user_id, upgrade_key, cost)
            updated_user = database.refresh_user_data(user_id) if success else None
            if updated_user:
                updated_user.pop('password_hash', None)
            self._send_json({"success": success, "message": msg, "user": updated_user}, 200 if success else 400)
            return

        elif path == "/api/shop/buy_weapon":
            user_id = body.get("user_id")
            weapon_type = body.get("weapon_type")
            cost = body.get("cost", 0)
            success, msg = database.buy_weapon(user_id, weapon_type, cost)
            updated_user = database.refresh_user_data(user_id) if success else None
            if updated_user:
                updated_user.pop('password_hash', None)
            self._send_json({"success": success, "message": msg, "user": updated_user}, 200 if success else 400)
            return

        elif path == "/api/shop/buy_ammo":
            user_id = body.get("user_id")
            weapon_type = body.get("weapon_type")
            amount = body.get("amount", 0)
            cost = body.get("cost", 0)
            success, msg = database.buy_ammo(user_id, weapon_type, amount, cost)
            updated_user = database.refresh_user_data(user_id) if success else None
            if updated_user:
                updated_user.pop('password_hash', None)
            self._send_json({"success": success, "message": msg, "user": updated_user}, 200 if success else 400)
            return

        elif path == "/api/game/save_result":
            user_id = body.get("user_id")
            username = body.get("username")
            score = body.get("score", 0)
            wave = body.get("wave", 1)
            kills = body.get("kills", 0)
            coins_earned = body.get("coins_earned")
            ammo_state = body.get("ammo_state")

            database.save_game_result(user_id, username, score, wave, kills, coins_earned, ammo_state)
            updated_user = database.refresh_user_data(user_id)
            if updated_user:
                updated_user.pop('password_hash', None)
            self._send_json({"success": True, "message": "Skor ve cephane kaydedildi!", "user": updated_user})
            return

        elif path == "/api/admin/set_level":
            username = body.get("username", "")
            level = body.get("level", 1)
            success, msg = database.admin_set_user_level(username, level)
            self._send_json({"success": success, "message": msg}, 200 if success else 400)
            return

        elif path == "/api/admin/set_score":
            username = body.get("username", "")
            score = body.get("score", 0)
            success, msg = database.admin_set_user_score(username, score)
            self._send_json({"success": success, "message": msg}, 200 if success else 400)
            return

        elif path == "/api/admin/add_coins":
            username = body.get("username", "")
            amount = body.get("amount", 0)
            success, msg = database.add_coins_to_user(username, amount)
            self._send_json({"success": success, "message": msg}, 200 if success else 400)
            return

        else:
            self._send_json({"success": False, "message": "Bilinmeyen API Endpoint"}, 404)

def run():
    global ACTIVE_SERVERS
    target_ports = [8000, 8080]
    if len(sys.argv) > 1:
        try:
            custom_p = int(sys.argv[1])
            if custom_p not in target_ports:
                target_ports.insert(0, custom_p)
        except ValueError:
            pass

    ACTIVE_SERVERS = []
    threads = []

    for p in target_ports:
        try:
            server = ThreadingHTTPServer(("0.0.0.0", p), ZombieApiHandler)
            server.allow_reuse_address = True
            ACTIVE_SERVERS.append(server)
        except OSError as e:
            print(f"Uyarı: Port {p} bağlanamadı ({e})")

    if not ACTIVE_SERVERS:
        for p in [8085, 8090, 8888]:
            try:
                server = ThreadingHTTPServer(("0.0.0.0", p), ZombieApiHandler)
                server.allow_reuse_address = True
                ACTIVE_SERVERS.append(server)
                break
            except OSError:
                continue

    if not ACTIVE_SERVERS:
        print("HATA: Hiçbir uygun boş port bulunamadı!")
        sys.exit(1)

    local_ip = get_local_ip()
    print("=" * 66)
    print(" 🧟 ZOMBIE SLAYER: BIÇAK USTASI - ÇOK KULLANICILI WEB SUNUCUSU")
    print("=" * 66)
    print(" 💻 Bu cihazda oynamak için:")
    for s in ACTIVE_SERVERS:
        port_num = s.server_address[1]
        print(f"    👉 http://localhost:{port_num}")
    print()
    print(" 📱 Evdeki TELEFON, TABLET vb. DİĞER CİHAZLARDA oynamak için:")
    for s in ACTIVE_SERVERS:
        port_num = s.server_address[1]
        print(f"    👉 http://{local_ip}:{port_num}")
    print()
    print(" ⚠️  ÖNEMLİ BAĞLANTI İPUÇLARI:")
    print("    1. Telefonunuzun evdeki Wi-Fi ağına bağlı olduğundan emin olun.")
    print(f"    2. Tarayıcıya yazarken başına mutlaka 'http://' ekleyin (https değil!).")
    print(f"       Örnek: http://{local_ip}:{ACTIVE_SERVERS[0].server_address[1]}")
    print("=" * 66)
    print(" Sunucuyu durdurmak için: CTRL + C\n")

    for s in ACTIVE_SERVERS:
        t = threading.Thread(target=s.serve_forever, daemon=True)
        t.start()
        threads.append(t)

    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nSunucular kapatılıyor...")
        for s in ACTIVE_SERVERS:
            s.shutdown()
            s.server_close()

if __name__ == "__main__":
    run()
