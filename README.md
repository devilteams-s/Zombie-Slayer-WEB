# 🧟‍♂️ Zombie Slayer: Knife Master (Web Edition)

[![JavaScript](https://img.shields.io/badge/Language-Vanilla%20JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 Canvas](https://img.shields.io/badge/Graphics-HTML5%20Canvas%202D-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-blue)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/devilteams-s/Zombie-Slayer-WEB?style=social)](https://github.com/devilteams-s/Zombie-Slayer-WEB)

`#html5-game` `#zombie-game` `#canvas-game` `#javascript` `#roguelite` `#survival-game` `#2d-game` `#arcade`

[🇹🇷 Türkçe](#-türkçe) | [🇬🇧 English](#-english)

---

# 🇬🇧 English

> **Survive the relentless zombie onslaught, upgrade your skills, manage your arsenal, and conquer menacing bosses!**  
> A high-performance, fluid 2D top-down survival & arcade action game built from scratch using modern HTML5 Canvas, Web Audio API, and Vanilla JavaScript.

---

## 🎮 About The Game

**Zombie Slayer: Knife Master** is an action-packed 2D browser game where players must survive increasingly brutal zombie hordes through rapid reflexes, tactical weapon choices, and strategic roguelite upgrades.

The game runs without any heavy third-party gaming frameworks (no Phaser, Pixi, etc.). Physics, projectile kinematics, enemy AI pathfinding, dynamic lighting, and particle systems are **purely written with Vanilla JS and HTML5 Canvas 2D API** for maximum 60 FPS performance.

---

## ✨ Key Features

### 🗡️ Weapon & Arsenal System
- **Throwing Knives (Infinite):** Your signature primary weapon. Upgrades allow throwing multiple knives simultaneously or launching devastating **Cleavers**.
- **Handgun (Pistol):** High precision and swift burst damage for single targets.
- **Shotgun:** Wide pellet spread to demolish dense crowds of approaching zombies.
- **Machine Gun:** Rapid-fire rate to mow down massive hordes in seconds.
- **Ammo Management:** Firearm ammunition is limited; purchase ammo in the shop or scavenge drops during battle.

### 🛡️ Rogue-lite Progression & Upgrades
- **Dynamic XP & Level Ups:** Collect blue XP gems dropped from slain zombies to level up.
- **In-Game Skill Cards:** Choose from 3 randomized skill cards on every level-up:
  - Extra Knife Count
  - Butcher's Cleaver (High piercing damage)
  - Attack Speed Boost (+25%)
  - Sharp Steel (+30% Global Damage)
  - XP Magnet (Doubles pickup radius)
  - Max HP & Armor Reinforcements
  - Critical Strike Chance

### 🧟 Diverse Enemies & Boss Fights
- **Walkers:** Swarming baseline undead.
- **Runners:** Agile, fast-paced zombies that attempt to flank you.
- **Tanks:** High armor, resilient monsters with devastating melee attacks.
- **Boss Waves:** Periodic massive boss encounters with specialized attack behaviors and enormous health pools.

### 🎨 Visual & Audio Atmosphere
- **Dynamic Particle Engine:** Blood decals, spent brass casings, muzzle flashes, and explosions.
- **Dynamic Lighting (Vignette & Flash):** Atmospheric darkness with instantaneous muzzle flash illuminations.
- **Web Audio API:** Real-time synthesized and scheduled sound effects for firing, slashing, hits, and level-ups.

---

## 🕹️ Controls

| Key / Input | Action |
| :--- | :--- |
| **W, A, S, D** or **Arrow Keys** | Player Movement |
| **Mouse Aim** | Look / Aim Direction |
| **Left Click** | Shoot / Attack |
| **1, 2, 3, 4** | Switch Weapons (1: Knife, 2: Pistol, 3: Shotgun, 4: Machine Gun) |
| **Space** | Tactical Dash / Roll |
| **P** or **ESC** | Pause / Resume Game |
| **M** | Toggle Mute Sound Effects |

---

## 🚀 How to Run

No heavy dependencies or package managers (`npm install`, etc.) required.

### Method 1: Direct Browser Launch (Quickest)
1. Clone or download this repository:
   ```bash
   git clone https://github.com/devilteams-s/Zombie-Slayer-WEB.git
   ```
2. Double-click **`index.html`** to play instantly in any modern web browser (Chrome, Firefox, Brave, Safari, Edge).

### Method 2: Internal Python Web Server & SQLite DB (Recommended)
To enable multi-user accounts, registration, global leaderboard, and shop inventory persistence:

- **🪟 On Windows (One-Click Launch):**  
  Simply double-click **`start_windows.bat`**. It will automatically boot the server and open the game in your default web browser!

- **🐧 On Linux / macOS:**  
  ```bash
  # Quick launcher script:
  ./start_web.sh

  # Or directly with Python:
  python3 server.py
  ```
- **Play locally on PC:** `http://localhost:8000`
- **Play on mobile/tablet on same Wi-Fi:** Local IP address printed in terminal (e.g. `http://192.168.1.X:8000`)

---

### 🍓 Method 3: Raspberry Pi / Linux Background Daemon (`install_service.sh`)
To run the game server 24/7 as an automatic system service on **Raspberry Pi** or Linux:

```bash
# Install and enable systemd user service:
./install_service.sh
```

**Service Control Commands:**
```bash
# Check service status:
systemctl --user status zombie-slayer

# Stop server:
systemctl --user stop zombie-slayer

# Restart server:
systemctl --user restart zombie-slayer
```

---

## 📁 Repository Structure

```plaintext
Zombie-Slayer-WEB/
│
├── index.html          # Main HTML structure, Canvas, and UI HUD elements
├── style.css           # Cyberpunk/dark arcade responsive styling
├── game.js             # Core game engine, physics, enemy AI, and state loop
├── sprites.js          # Procedural sprite generator and pixel renderer
├── audio.js            # Dynamic Web Audio API synthesizer
├── ui.js               # Modal handlers, in-game shop, auth & touch controls
├── server.py           # Lightweight REST API and static HTTP server
├── database.py         # Self-contained SQLite database engine (Users/Scores)
├── start_web.sh        # Smart server launcher with port conflict detection
├── start_windows.bat   # Windows 1-Click launcher script
├── install_service.sh  # Systemd daemon setup script for Linux / RPi 5
├── LICENSE             # MIT License
└── README.md           # Bilingual project documentation
```

---

## 🛠️ Tech Stack

- **HTML5 Canvas:** Hardware-accelerated 60 FPS 2D rendering.
- **Modern JavaScript (ES6+):** Modular OOP design without third-party frameworks.
- **Web Audio API:** Procedural, low-latency audio generation.
- **SQLite3 & REST API:** Lightweight account, score, and shop transaction handling.
- **CSS3 Flexbox/Grid:** Responsive arcade HUD and touch controls for mobile.

---

## 🤝 Contributing

1. Fork the Project (`Fork` button on top right).
2. Create your Feature Branch:
   ```bash
   git checkout -b feature/NewAwesomeFeature
   ```
3. Commit your Changes:
   ```bash
   git commit -m 'feat: Add new enemy type'
   ```
4. Push to the Branch:
   ```bash
   git push origin feature/NewAwesomeFeature
   ```
5. Open a **Pull Request (PR)**.

---

## 📜 License

Distributed under the **[MIT License](LICENSE)**.  
Copyright (c) 2026 **devilteams-s**.

See the [LICENSE](LICENSE) file for more details. Happy gaming! 🧟‍♂️💥

---
---

# 🇹🇷 Türkçe

> **Zombi istilasına karşı hayatta kal, yeteneklerini geliştir, cephaneni yönet ve efsanevi bossları alt et!**  
> Modern HTML5 Canvas, Web Audio API ve Vanilla JavaScript mimarisi ile sıfırdan geliştirilmiş, yüksek performanslı ve akıcı bir hayatta kalma (Survival) & arcade oyunu.

---

## 🎮 Proje Hakkında

**Zombie Slayer: Bıçak Ustası**, oyuncuların gitgide zorlaşan zombi dalgalarına karşı taktiksel seçimler yaparak hayatta kalmaya çalıştığı, hızlı refleksler ve stratejik ekipman yükseltmeleri gerektiren aksiyon dolu bir 2D tarayıcı oyunudur.

Oyunda hiçbir harici ağır oyun motoru (Phaser, Pixi vb.) kullanılmamış; fizik motoru, mermi/bıçak mekaniği, yapay zeka (zombi takibi), dinamik ışıklandırma ve parçacık sistemleri **saf Vanilla JS ve Canvas 2D API** ile optimize bir şekilde yazılmıştır.

---

## ✨ Öne Çıkan Özellikler

### 🗡️ Cephane ve Silah Sistemi
- **Fırlatma Bıçakları (Sınırsız):** Karakterin temel silahı. Yükseltmelerle aynı anda 3-5 bıçak atabilir veya ölümcül **Kasap Satırları** fırlatabilirsiniz.
- **Tabanca (Pistol):** Yüksek hassasiyet ve tekli hedeflere ani hasar.
- **Pompalı Tüfek (Shotgun):** Yakın mesafeden saçılan mermilerle kalabalık zombi gruplarını dağıtır.
- **Makineli Tüfek (Machine Gun):** Seri atış hızıyla önünüze çıkan tüm zombi sürülerini biçer.
- **Cephane Yönetimi:** Mermiler sınırlıdır; marketten cephane satın alabilir veya düşen ganimetleri toplayabilirsiniz.

### 🛡️ Rogue-lite Geliştirme & Yükseltmeler
- **Dinamik XP ve Seviye Atlama:** Öldürülen zombilerden düşen mavi XP elmaslarını toplayarak seviye atlayın.
- **Oyun İçi Yetenek Seçimi:** Her seviye atlandığında rastgele sunulan 3 kart arasından seçim yapın:
  - Ekstra Bıçak Fırlatma
  - Kasap Satırı
  - Seri Atış (Attack Speed)
  - Keskin Çelik (Hasar Artışı)
  - XP Mıknatısı (Magnet)
  - Zırh ve Maksimum Can Takviyeleri
  - Kritik Hasar Şansı

### 🧟 Düşman Çeşitleri ve Boss Savaşları
- **Standart Zombiler:** Sürüler halinde gelen temel düşmanlar.
- **Hızlı Zombiler (Koşucular):** Hızlı hareket eden ve aniden çevreleyen tehlikeli zombiler.
- **Tank Zombiler:** Yüksek zırh ve cana sahip, yavaş ama ölümcül yaratıklar.
- **Dev Boss Dalgaları:** Belirli dalgalarda ortaya çıkan, özel saldırılara ve devasa can havuzuna sahip Boss zombiler.

### 🎨 Görsel & İşitsel Atmosfer
- **Dinamik Parçacık Sistemi:** Kan sıçramaları, mermi kovanları, namlu alevi (muzzle flash) ve patlamalar.
- **Dinamik Işıklandırma (Vignette & Flash):** Karanlık atmosfer ve ateş edildiğinde anlık aydınlanma efektleri.
- **Web Audio API Entegrasyonu:** Düşman öldürme, vuruş, seviye atlama ve silah ses efektleri.

---

## 🕹️ Kontroller

| Tuş / Girdi | Eylem |
| :--- | :--- |
| **W, A, S, D** veya **Yön Tuşları** | Karakter Hareketi |
| **Fare Hareketi** | Nişan Alma / Yönelme |
| **Sol Tık (Mouse Left Click)** | Ateş Etme / Saldırı |
| **1, 2, 3, 4** | Silah Değiştirme (1: Bıçak, 2: Tabanca, 3: Pompalı, 4: SMG) |
| **Space** | Takla / Atılma (Dash Roll) |
| **P** veya **ESC** | Oyunu Duraklat (Pause) |
| **M** | Sesi Aç / Kapat (Mute) |

---

## 🚀 Kurulum ve Çalıştırma

Projeyi çalıştırmak için hiçbir harici kütüphane veya paket yöneticisi kurulumu (`npm install` vb.) gerekmez.

### Yöntem 1: Doğrudan Tarayıcıda Açma (En Hızlısı)
1. Repoyu bilgisayarınıza indirin veya klonlayın:
   ```bash
   git clone https://github.com/devilteams-s/Zombie-Slayer-WEB.git
   ```
2. Proje dizininde yer alan **`index.html`** dosyasına çift tıklayarak modern bir web tarayıcısında (Google Chrome, Firefox, Brave, Safari, Edge) açın.

### Yöntem 2: Dahili Sunucu & Veritabanı ile Çalıştırma (Önerilen)
Oyunun çok kullanıcılı giriş, kayıt, skor tablosu ve market alışverişi özelliklerinden tam yararlanmak için dahili sunucuyu başlatın:

- **🪟 Windows Kullanıcıları İçin (En Kolayı - Tek Tıkla):**  
  Klasördeki **`start_windows.bat`** dosyasına çift tıklayın! Sunucu ve SQLite veritabanı arka planda otomatik başlayacak ve varsayılan tarayıcınızda oyun hemen açılacaktır.

- **🐧 Linux / macOS Kullanıcıları İçin:**  
  ```bash
  # Tek komutla başlatma:
  ./start_web.sh

  # Veya doğrudan Python ile:
  python3 server.py
  ```
- **Bilgisayarda oynamak için:** `http://localhost:8000`
- **Ev ağındaki diğer cihazlarda (Telefon, Tablet) oynamak için:** Terminalde yazan yerel IP adresi (örn. `http://192.168.1.X:8000`)

---

### 🍓 Yöntem 3: Raspberry Pi / Linux Otomatik Başlatma Servisi (`install_service.sh`)
Projeyi bir **Raspberry Pi**, ev sunucusu veya Linux bilgisayarda 7/24 arka planda çalıştırmak ve cihaz her açıldığında otomatik başlamasını sağlamak için hazır `systemd` servisi bulunmaktadır:

```bash
# Kurulum ve başlatma betiğini çalıştırın:
./install_service.sh
```

**Servis Yönetim Komutları:**
```bash
# Servis durumunu kontrol etme:
systemctl --user status zombie-slayer

# Servisi durdurma:
systemctl --user stop zombie-slayer

# Servisi yeniden başlatma:
systemctl --user restart zombie-slayer
```

---

## 📁 Proje Dizin Yapısı

```plaintext
Zombie-Slayer-WEB/
│
├── index.html          # Ana oyun arayüzü, canvas ve HUD bileşenleri
├── style.css           # Cyberpunk/karanlık temalı modern arayüz stilleri
├── game.js             # Temel oyun motoru, fizik, düşman yapay zekası ve döngü
├── sprites.js          # Piksel/prosedürel çizim ve sprite render motoru
├── audio.js            # Web Audio API ile dinamik ses ve efekt sentezleyici
├── ui.js               # Menüler, yükseltme pencereleri ve market etkileşimi
├── server.py           # REST API ve yerel HTTP web sunucusu
├── database.py         # Kullanıcı, skor ve envanter SQLite veritabanı motoru
├── start_web.sh        # Otomatik port denetimli sunucu başlatma betiği
├── start_windows.bat   # Windows tek tıkla başlatma betiği
├── install_service.sh  # Linux / RPi 5 arka plan systemd servis kurulum betiği
├── LICENSE             # MIT Lisansı
└── README.md           # Çift dilli proje dokümantasyonu
```

---

## 🛠️ Teknolojiler

- **HTML5 Canvas:** 60 FPS performans odaklı 2D render motoru.
- **Modern JavaScript (ES6+):** Nesne yönelimli oyun mimarisi, modular yapı.
- **Web Audio API:** Harici MP3 dosyalarına bağımlı kalmadan gerçek zamanlı ses üretimi ve kontrolü.
- **LocalStorage API & SQLite:** Skorların, cephane durumunun ve kullanıcı profillerinin yerel ve sunucu belleğinde saklanması.
- **CSS3 Flexbox/Grid:** Duyarlı HUD, silah barı ve vitrin tasarımı.

---

## 🤝 Katkıda Bulunma

1. Bu depoyu Fork'layın (`Fork` butonuna tıklayın).
2. Yeni bir özellik dalı açın:
   ```bash
   git checkout -b feature/YeniOzellik
   ```
3. Değişikliklerinizi commit edin:
   ```bash
   git commit -m 'feat: Yeni boss türü eklendi'
   ```
4. Dalınıza push yapın:
   ```bash
   git push origin feature/YeniOzellik
   ```
5. Bir **Pull Request (PR)** açın.

---

## 📜 Lisans

Bu proje **[MIT Lisansı](LICENSE)** kapsamında lisanslanmıştır.  
Telif Hakkı (c) 2026 **devilteams-s**.

Detaylar için [LICENSE](LICENSE) dosyasını inceleyebilirsiniz. Eğlenceli oyunlar! 🧟‍♂️💥
