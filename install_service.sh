#!/usr/bin/env bash
# zombie_web/install_service.sh - RPi 5 Otomatik Başlatma (Systemd Servisi)
# Bu betik, oyun sunucusunun Raspberry Pi 5 açıldığında arka planda otomatik çalışmasını sağlar.

SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="$SERVICE_DIR/zombie-slayer.service"
WORK_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PYTHON_BIN="$(which python3)"

echo "================================================================"
echo " 🧟 ZOMBIE SLAYER - RPi 5 OTOMATİK SERVİS KURULUMU"
echo "================================================================"

mkdir -p "$SERVICE_DIR"

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Zombie Slayer Web Edition (RPi 5 Home Game Server)
After=network.target

[Service]
Type=simple
WorkingDirectory=$WORK_DIR
ExecStart=$PYTHON_BIN $WORK_DIR/server.py 8000
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

echo " Servis dosyası oluşturuldu: $SERVICE_FILE"

# Servisi yeniden yükle ve aktifleştir
systemctl --user daemon-reload
systemctl --user enable zombie-slayer.service
systemctl --user restart zombie-slayer.service

# Kullanıcı oturumu kapansa bile arka planda çalışmayı sürdürmesi için (loginctl linger)
loginctl enable-linger "$USER" 2>/dev/null || true

echo "----------------------------------------------------------------"
echo " ✅ Servis başarıyla kuruldu ve başlatıldı!"
echo " Durumu kontrol etmek için: systemctl --user status zombie-slayer"
echo " Durdurmak için:          systemctl --user stop zombie-slayer"
echo " Yeniden başlatmak için:   systemctl --user restart zombie-slayer"
echo "================================================================"
