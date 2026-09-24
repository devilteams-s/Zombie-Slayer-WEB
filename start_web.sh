#!/usr/bin/env bash
# zombie_web/start_web.sh - Zombie Slayer Web Sunucusunu Başlatma Betiği
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
LOCAL_IP="${LOCAL_IP:-192.168.0.131}"

# Açık olan önceki sunucu varsa kapatıp portları serbest bırak
EXISTING_PIDS=$(pgrep -f "python3.*server\.py" 2>/dev/null | grep -v "$$" || true)
if [ -n "$EXISTING_PIDS" ]; then
    echo "🔄 Açık olan önceki web sunucusu kapatılıyor (Port 8000 & 8080 serbest bırakılıyor)..."
    kill -9 $EXISTING_PIDS 2>/dev/null || true
    sleep 0.8
fi

echo "================================================================"
echo " 🧟 ZOMBIE SLAYER: BIÇAK USTASI - WEB SUNUCUSU (RPi 5)"
echo "================================================================"
echo " 💻 Bu Cihazda:           http://localhost:8000 veya :8080"
echo " 📱 Evdeki Diğer Cihazlar: http://$LOCAL_IP:8000"
echo "================================================================"
echo " Başlatılıyor..."

python3 server.py "$@"
