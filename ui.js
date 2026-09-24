// zombie_web/ui.js - Modal Handlers, Shop API & User Authentication

const UI = {
    activeShopTab: 'weapons', // Default to weapons tab as requested!

    getUser() {
        if (typeof window !== 'undefined' && window.Game) {
            if (window.Game.currentUser) return window.Game.currentUser;
            if (window.Game.defaultUser) return window.Game.defaultUser;
        }
        return {
            id: null,
            username: "Misafir",
            is_admin: 0,
            coins: 100,
            level: 1,
            high_score: 0,
            pistol_ammo: 60,
            shotgun_ammo: 0,
            machinegun_ammo: 0,
            has_pistol: 1
        };
    },

    init() {
        const steps = [
            ['setupModalToggles', () => this.setupModalToggles()],
            ['setupAuth', () => this.setupAuth()],
            ['setupShop', () => this.setupShop()],
            ['setupLeaderboard', () => this.setupLeaderboard()],
            ['setupAdminPanel', () => this.setupAdminPanel()],
            ['setupMenuClicks', () => this.setupMenuClicks()],
            ['setupLanModal', () => this.setupLanModal()],
            ['setupTouchControls', () => this.setupTouchControls()],
            ['setupUtilityControls', () => this.setupUtilityControls()],
            ['setupSoundFeedback', () => this.setupSoundFeedback()]
        ];

        steps.forEach(([name, fn]) => {
            try {
                fn();
            } catch (err) {
                console.error(`UI.init error in ${name}:`, err);
            }
        });
    },

    openModal(id) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    },

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    },

    setupModalToggles() {
        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Click outside modal window to close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeAllModals();
            });
        });

        // Escape key to close modals
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });

        // Top bar navigation buttons
        document.getElementById('btn-login-modal')?.addEventListener('click', () => this.openModal('auth-modal'));
        document.getElementById('btn-lan')?.addEventListener('click', () => this.openModal('lan-modal'));
        document.getElementById('btn-shop')?.addEventListener('click', () => {
            try { this.renderShopCards(); } catch (e) { console.error(e); }
            this.openModal('shop-modal');
        });
        document.getElementById('btn-leaderboard')?.addEventListener('click', () => {
            try { this.loadLeaderboard(); } catch (e) { console.error(e); }
            this.openModal('leaderboard-modal');
        });
        document.getElementById('btn-admin')?.addEventListener('click', () => this.openModal('admin-modal'));

        // Audio toggle button in top bar
        document.getElementById('btn-audio')?.addEventListener('click', () => {
            if (typeof Sound !== 'undefined' && Sound.toggleMute) {
                const enabled = Sound.toggleMute();
                const btn = document.getElementById('btn-audio');
                if (btn) btn.textContent = enabled ? '🔊 SES' : '🔇 SESSİZ';
            }
        });

        // Game Over buttons
        document.getElementById('btn-go-restart')?.addEventListener('click', () => {
            this.closeAllModals();
            if (window.Game) window.Game.resetGame();
        });
        document.getElementById('btn-go-menu')?.addEventListener('click', () => {
            this.closeAllModals();
            if (window.Game) window.Game.state = 'MENU';
        });
    },

    // ================= LAN DISTRIBUTION MODAL =================
    async setupLanModal() {
        let lanUrl = `http://${window.location.hostname || '192.168.0.131'}:8000`;
        try {
            const res = await fetch('/api/server/info');
            const data = await res.json();
            if (data.success && data.lan_url) {
                lanUrl = data.lan_url;
            }
        } catch (e) {
            // fallback to current location
        }

        const display = document.getElementById('lan-url-display');
        const qrImg = document.getElementById('lan-qr-img');
        const copyBtn = document.getElementById('btn-copy-lan');
        const statusEl = document.getElementById('copy-lan-status');

        if (display) display.textContent = lanUrl;
        if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(lanUrl)}`;

        copyBtn?.addEventListener('click', () => {
            navigator.clipboard.writeText(lanUrl).then(() => {
                if (statusEl) {
                    statusEl.textContent = "✅ Bağlantı panoya kopyalandı!";
                    setTimeout(() => { statusEl.textContent = ""; }, 2500);
                }
            }).catch(() => {
                if (statusEl) statusEl.textContent = "Adresi el ile kopyalayın.";
            });
        });
    },

    // ================= MOBILE & DESKTOP TOUCH/JOYSTICK CONTROLS =================
    setupTouchControls() {
        const zone = document.getElementById('touch-stick-zone');
        const knob = document.getElementById('touch-stick-knob');
        const btnDash = document.getElementById('btn-touch-dash');
        if (!zone || !knob) return;

        let activePointerId = null;
        let isTouching = false;
        const maxRadius = 40;

        const updateStickPosition = (clientX, clientY) => {
            const rect = zone.getBoundingClientRect();
            const left = (rect.left !== undefined) ? rect.left : (rect.x || 0);
            const top = (rect.top !== undefined) ? rect.top : (rect.y || 0);
            const centerX = left + rect.width / 2;
            const centerY = top + rect.height / 2;

            let dx = clientX - centerX;
            let dy = clientY - centerY;
            const dist = Math.hypot(dx, dy);

            if (dist > maxRadius) {
                dx = (dx / dist) * maxRadius;
                dy = (dy / dist) * maxRadius;
            }

            knob.style.transform = `translate(${dx}px, ${dy}px)`;

            if (window.Game) {
                // Auto-start game if player moves the joystick while in menu!
                if (window.Game.state === 'MENU' && dist > 5) {
                    window.Game.startSurvivalGame();
                }

                window.Game.touchMove = {
                    vx: dx / maxRadius,
                    vy: dy / maxRadius
                };
            }
        };

        const resetStick = () => {
            activePointerId = null;
            isTouching = false;
            knob.style.transform = 'translate(0px, 0px)';
            if (window.Game) {
                window.Game.touchMove = { vx: 0, vy: 0 };
            }
        };

        // Pointer Events (Mouse, Touch, Stylus)
        zone.addEventListener('pointerdown', (e) => {
            if (activePointerId !== null) return;
            e.preventDefault();
            e.stopPropagation();
            activePointerId = e.pointerId;
            isTouching = true;

            if (window.Game && window.Game.state === 'MENU') {
                window.Game.startSurvivalGame();
            }

            try {
                zone.setPointerCapture(e.pointerId);
            } catch (err) {}
            updateStickPosition(e.clientX, e.clientY);
        });

        window.addEventListener('pointermove', (e) => {
            if (isTouching && e.pointerId === activePointerId) {
                e.preventDefault();
                updateStickPosition(e.clientX, e.clientY);
            }
        }, { passive: false });

        const onPointerUp = (e) => {
            if (e.pointerId === activePointerId) {
                try {
                    zone.releasePointerCapture(e.pointerId);
                } catch (err) {}
                resetStick();
            }
        };
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        // Native Touch Listeners (for devices that don't support pointer capture on touch)
        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isTouching && e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                activePointerId = t.identifier;
                isTouching = true;

                if (window.Game && window.Game.state === 'MENU') {
                    window.Game.startSurvivalGame();
                }

                updateStickPosition(t.clientX, t.clientY);
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!isTouching) return;
            for (let i = 0; i < e.touches.length; i++) {
                const t = e.touches[i];
                if (t.identifier === activePointerId) {
                    updateStickPosition(t.clientX, t.clientY);
                    break;
                }
            }
        }, { passive: false });

        const onTouchEnd = (e) => {
            if (!isTouching) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activePointerId) {
                    resetStick();
                    break;
                }
            }
        };
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);

        // Mobile Dash / Takla Button
        let lastDashTime = 0;
        const triggerDash = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const now = performance.now();
            if (now - lastDashTime < 200) return;
            lastDashTime = now;

            if (window.Game) {
                if (window.Game.state === 'PLAYING') {
                    window.Game.performDash();
                } else if (window.Game.state === 'MENU') {
                    window.Game.startSurvivalGame();
                }
            }
        };

        btnDash?.addEventListener('pointerdown', triggerDash);
        btnDash?.addEventListener('touchstart', triggerDash, { passive: false });
        btnDash?.addEventListener('click', triggerDash);
    },

    // ================= UTILITY CONTROLS (BGM, CRT, LIGHTING, JOYSTICK, FULLSCREEN) =================
    setupUtilityControls() {
        // BGM Sequencer Toggle
        const btnBgm = document.getElementById('btn-toggle-bgm');
        const bgmLabel = document.getElementById('bgm-label');
        btnBgm?.addEventListener('click', () => {
            const isPlaying = Sound.toggleBGM();
            document.body.classList.toggle('bgm-active', isPlaying);
            if (bgmLabel) {
                bgmLabel.textContent = isPlaying ? '🎵 MÜZİK: ÇALIYOR' : '🎵 MÜZİK: ÇAL';
            }
        });

        // CRT Scanline Filter Toggle
        const btnCrt = document.getElementById('btn-toggle-crt');
        btnCrt?.addEventListener('click', () => {
            document.body.classList.toggle('no-crt');
            const isOff = document.body.classList.contains('no-crt');
            btnCrt.textContent = isOff ? '📺 CRT: KAPALI' : '📺 CRT: AÇIK';
        });

        // Ambient Dungeon Lighting Toggle
        const btnLight = document.getElementById('btn-toggle-light');
        btnLight?.addEventListener('click', () => {
            if (window.Game) {
                window.Game.enableLighting = !window.Game.enableLighting;
                btnLight.textContent = window.Game.enableLighting ? '💡 IŞIK: AÇIK' : '💡 IŞIK: KAPALI';
            }
        });

        // Virtual Joystick & Dash Button Visibility Toggle
        const btnStick = document.getElementById('btn-toggle-stick');
        const savedStickPref = localStorage.getItem('zombie_joystick_mode');
        // Default to ON (visible and playable on both desktop and mobile)
        let stickEnabled = savedStickPref !== 'off';

        const updateStickUI = () => {
            if (stickEnabled) {
                document.body.classList.add('show-joystick');
                document.body.classList.remove('hide-joystick');
                if (btnStick) btnStick.textContent = '🕹️ JOYSTICK: AÇIK';
            } else {
                document.body.classList.remove('show-joystick');
                document.body.classList.add('hide-joystick');
                if (btnStick) btnStick.textContent = '🕹️ JOYSTICK: KAPALI';
            }
        };

        updateStickUI();

        btnStick?.addEventListener('click', () => {
            stickEnabled = !stickEnabled;
            localStorage.setItem('zombie_joystick_mode', stickEnabled ? 'on' : 'off');
            updateStickUI();
        });

        // Fullscreen Toggle
        const btnFs = document.getElementById('btn-fullscreen');
        btnFs?.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    btnFs.textContent = '⛶ KÜÇÜLT';
                }).catch(() => {});
            } else {
                document.exitFullscreen().then(() => {
                    btnFs.textContent = '⛶ TAM EKRAN';
                }).catch(() => {});
            }
        });
    },

    // ================= BUTTON SOUND FEEDBACK =================
    setupSoundFeedback() {
        document.querySelectorAll('.retro-btn, .tab-btn, .weapon-slot').forEach(el => {
            el.addEventListener('mouseenter', () => {
                Sound.play('ui_hover');
            });
            el.addEventListener('click', () => {
                Sound.play('ui_click');
            });
        });
    },

    setupMenuClicks() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        const handleStart = (clientX, clientY) => {
            if (!window.Game || window.Game.state !== 'MENU') return;
            const rect = canvas.getBoundingClientRect();
            const left = (rect.left !== undefined) ? rect.left : (rect.x || 0);
            const top = (rect.top !== undefined) ? rect.top : (rect.y || 0);
            const scaleX = 960 / rect.width;
            const scaleY = 600 / rect.height;
            const mx = (clientX - left) * scaleX;
            const my = (clientY - top) * scaleY;

            // Boss mode button: x: 490..650, y: 370..415
            if (mx >= 490 && mx <= 650 && my >= 370 && my <= 415) {
                window.Game.startBossMode();
            } else {
                // Clicking/tapping survival button or anywhere on menu starts survival game!
                window.Game.startSurvivalGame();
            }
        };

        canvas.addEventListener('click', (e) => handleStart(e.clientX, e.clientY));
        canvas.addEventListener('touchend', (e) => {
            if (window.Game && window.Game.state === 'MENU' && e.changedTouches.length > 0) {
                e.preventDefault();
                handleStart(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        }, { passive: false });
    },

    // ================= AUTH (LOGIN / REGISTER) =================
    setupAuth() {
        // Tab toggle
        const tabLogin = document.getElementById('tab-btn-login');
        const tabRegister = document.getElementById('tab-btn-register');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');

        tabLogin?.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister?.classList.remove('active');
            formLogin.style.display = 'block';
            formRegister.style.display = 'none';
        });

        tabRegister?.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin?.classList.remove('active');
            formRegister.style.display = 'block';
            formLogin.style.display = 'none';
        });

        // Submit Login
        formLogin?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const msgEl = document.getElementById('auth-message');

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (data.success && data.user) {
                    window.Game.currentUser = data.user;
                    window.Game.syncWeaponAmmoFromUser();
                    window.Game.saveUserLocally();
                    msgEl.textContent = "Giriş Başarılı!";
                    msgEl.style.color = "#2ecc71";
                    setTimeout(() => this.closeAllModals(), 800);
                } else {
                    msgEl.textContent = data.message || "Giriş başarısız!";
                    msgEl.style.color = "#e74c3c";
                }
            } catch (err) {
                msgEl.textContent = "Sunucu hatası!";
                msgEl.style.color = "#e74c3c";
            }
        });

        // Submit Register
        formRegister?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const msgEl = document.getElementById('auth-message');

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (data.success) {
                    msgEl.textContent = "Kayıt başarılı! Şimdi giriş yapın.";
                    msgEl.style.color = "#2ecc71";
                    tabLogin.click();
                } else {
                    msgEl.textContent = data.message || "Kayıt başarısız!";
                    msgEl.style.color = "#e74c3c";
                }
            } catch (err) {
                msgEl.textContent = "Sunucu hatası!";
                msgEl.style.color = "#e74c3c";
            }
        });
    },

    // ================= SHOP & AMMO =================
    setupShop() {
        document.querySelectorAll('.shop-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeShopTab = btn.dataset.tab;
                this.renderShopCards();
            });
        });
    },

    getShopItems() {
        const u = this.getUser();
        const tab = this.activeShopTab;

        if (tab === 'weapons') {
            return [
                {
                    key: 'pistol_ammo',
                    name: 'TABANCA MERMİSİ',
                    desc: 'Tabanca için +30 Adet Standart Çelik Mermi',
                    type: 'ammo',
                    weapon_type: 'pistol',
                    amount: 30,
                    cost: 30,
                    stat_str: `${u.pistol_ammo || 0} Mermi Var`
                },
                {
                    key: 'shotgun',
                    name: 'AV TÜFEĞİ (POMPALI)',
                    desc: "5'li Saçma Atan Ağır Pompalı Tüfek (+24 Fişek Hediye!)",
                    type: 'weapon',
                    weapon_type: 'shotgun',
                    cost: 250,
                    owned: Boolean(u.has_shotgun),
                    stat_str: u.has_shotgun ? "SAHİPSİN" : "250 PARA"
                },
                {
                    key: 'shotgun_ammo',
                    name: 'TÜFEK FİŞEĞİ',
                    desc: 'Av Tüfeği için +15 Adet Saçmalı Fişek',
                    type: 'ammo',
                    weapon_type: 'shotgun',
                    amount: 15,
                    cost: 50,
                    stat_str: `${u.shotgun_ammo || 0} Fişek Var`
                },
                {
                    key: 'machinegun',
                    name: 'TARAMALI TÜFEK',
                    desc: 'Tam Otomatik Yüksek Seri Mermi Püskürtücü (+120 Mermi Hediye!)',
                    type: 'weapon',
                    weapon_type: 'machinegun',
                    cost: 500,
                    owned: Boolean(u.has_machinegun),
                    stat_str: u.has_machinegun ? "SAHİPSİN" : "500 PARA"
                },
                {
                    key: 'machinegun_ammo',
                    name: 'TARAMALI MERMİ KUTUSU',
                    desc: 'Taramalı Tüfek için +90 Adet Seri Mermi',
                    type: 'ammo',
                    weapon_type: 'machinegun',
                    amount: 90,
                    cost: 80,
                    stat_str: `${u.machinegun_ammo || 0} Mermi Var`
                }
            ];
        } else if (tab === 'combat') {
            return [
                {
                    key: 'start_knives',
                    name: 'ÇİFT BIÇAK',
                    desc: 'Oyuna fazladan fırlatma bıçağıyla başla',
                    level: u.start_knives || 0,
                    max_lvl: 2,
                    cost: ((u.start_knives || 0) + 1) * 500,
                    stat_str: `+${u.start_knives || 0} Ekstra Bıçak`
                },
                {
                    key: 'perm_cleaver',
                    name: 'KASAP SATIRI',
                    desc: 'Oyuna devasa delen Kasap Satırıyla başla',
                    level: u.perm_cleaver || 0,
                    max_lvl: 1,
                    cost: 1200,
                    stat_str: u.perm_cleaver ? "AÇIK" : "KAPALI"
                },
                {
                    key: 'bonus_dmg',
                    name: 'KESKİN BIÇAK',
                    desc: 'Kalıcı Bıçak Hasarı Artışı',
                    level: u.bonus_dmg || 0,
                    max_lvl: 10,
                    cost: ((u.bonus_dmg || 0) + 1) * 350,
                    stat_str: `+%${(u.bonus_dmg || 0) * 15} Hasar`
                },
                {
                    key: 'attack_speed',
                    name: 'SERİ FIRLATMA',
                    desc: 'Bıçak atış hızını kalıcı olarak artırır',
                    level: u.attack_speed || 0,
                    max_lvl: 6,
                    cost: ((u.attack_speed || 0) + 1) * 300,
                    stat_str: `+%${(u.attack_speed || 0) * 12} Hız`
                },
                {
                    key: 'crit_chance',
                    name: 'KRİTİK VURUŞ',
                    desc: 'x2 Hasar vurma şansı',
                    level: u.crit_chance || 0,
                    max_lvl: 5,
                    cost: ((u.crit_chance || 0) + 1) * 450,
                    stat_str: `+%${(u.crit_chance || 0) * 8} Şans`
                }
            ];
        } else if (tab === 'survival') {
            return [
                {
                    key: 'bonus_hp',
                    name: 'EKSTRA CAN',
                    desc: 'Kalıcı Maksimum Can',
                    level: u.bonus_hp || 0,
                    max_lvl: 10,
                    cost: ((u.bonus_hp || 0) + 1) * 200,
                    stat_str: `+${(u.bonus_hp || 0) * 25} HP`
                },
                {
                    key: 'bonus_armor',
                    name: 'ÇELİK ZIRH',
                    desc: 'Kalıcı Koruyucu Zırh',
                    level: u.bonus_armor || 0,
                    max_lvl: 10,
                    cost: ((u.bonus_armor || 0) + 1) * 200,
                    stat_str: `+${(u.bonus_armor || 0) * 20} Zırh`
                },
                {
                    key: 'move_speed',
                    name: 'ÇEVİKLİK',
                    desc: 'Koşma hızı ve hızlı takla',
                    level: u.move_speed || 0,
                    max_lvl: 5,
                    cost: ((u.move_speed || 0) + 1) * 250,
                    stat_str: `+%${(u.move_speed || 0) * 8} Hız`
                },
                {
                    key: 'magnet_range',
                    name: 'XP MIKNATISI',
                    desc: 'Zombi özlerini çekim menzili',
                    level: u.magnet_range || 0,
                    max_lvl: 6,
                    cost: ((u.magnet_range || 0) + 1) * 250,
                    stat_str: `+${(u.magnet_range || 0) * 60} Menzil`
                }
            ];
        } else if (tab === 'admin' && u.is_admin) {
            return [
                {
                    key: 'admin_god_blade',
                    name: 'TANRI BIÇAĞI',
                    desc: 'Bıçaklar x5 Dev Hasar & %100 Süper Kritik!',
                    cost: 0,
                    level: u.admin_god_blade || 0,
                    max_lvl: 1,
                    stat_str: u.admin_god_blade ? "AKTİF (x5 Hasar)" : "KAPALI"
                },
                {
                    key: 'admin_orbital_knives',
                    name: 'KORUYUCU BIÇAKLAR',
                    desc: 'Etrafında Fırıl Fırıl Dönen 6 Bıçak Kalkanı!',
                    cost: 0,
                    level: u.admin_orbital_knives || 0,
                    max_lvl: 1,
                    stat_str: u.admin_orbital_knives ? "DÖNEN 6 BIÇAK" : "KAPALI"
                },
                {
                    key: 'admin_hyper_boots',
                    name: 'HİPER HIZ ÇİZMESİ',
                    desc: 'Işık Hızında Koşu & Sınırsız Hızlı Takla!',
                    cost: 0,
                    level: u.admin_hyper_boots || 0,
                    max_lvl: 1,
                    stat_str: u.admin_hyper_boots ? "AKTİF" : "KAPALI"
                },
                {
                    key: 'admin_cosmic_magnet',
                    name: 'KOZMİK KARADELİK',
                    desc: 'Haritadaki Tüm XP Taşlarını Anında Çeker!',
                    cost: 0,
                    level: u.admin_cosmic_magnet || 0,
                    max_lvl: 1,
                    stat_str: u.admin_cosmic_magnet ? "TAM ÇEKİM" : "KAPALI"
                },
                {
                    key: 'admin_nuke_cleaver',
                    name: 'NÜKLEER SATIR',
                    desc: 'Aralıksız Seri Dev Satır Yağmuru Başlatır!',
                    cost: 0,
                    level: u.admin_nuke_cleaver || 0,
                    max_lvl: 1,
                    stat_str: u.admin_nuke_cleaver ? "SERİ YAĞMUR" : "KAPALI"
                }
            ];
        }
        return [];
    },

    renderShopCards() {
        const container = document.getElementById('shop-items-container');
        if (!container) return;

        const items = this.getShopItems();
        const u = this.getUser();

        // Show/hide admin tab button
        const adminTabBtn = document.getElementById('shop-tab-admin');
        if (adminTabBtn) {
            adminTabBtn.style.display = (u && u.is_admin) ? 'inline-block' : 'none';
        }

        container.innerHTML = '';

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-card';

            const isMax = item.max_lvl && item.level >= item.max_lvl;
            const isOwnedWeapon = item.type === 'weapon' && item.owned;
            const canAfford = (u.coins || 0) >= item.cost;

            let btnText = "SATIN AL";
            let btnClass = "retro-btn btn-gold";
            let disabled = false;

            if (isMax || isOwnedWeapon) {
                btnText = "MAKS / SAHİPSİN";
                btnClass = "retro-btn";
                disabled = true;
            } else if (!canAfford) {
                btnClass = "retro-btn";
                btnText = "YETERSİZ 💰";
                disabled = true;
            }

            card.innerHTML = `
                <div>
                    <div class="shop-card-header">
                        <span class="shop-card-title">${item.name}</span>
                        <span class="shop-card-level">${item.level !== undefined ? `LVL ${item.level}/${item.max_lvl}` : ''}</span>
                    </div>
                    <div class="shop-card-desc">${item.desc}</div>
                    <div class="shop-card-stat">📊 ${item.stat_str}</div>
                </div>
                <div class="shop-card-footer">
                    <span class="shop-card-cost">💰 ${item.cost === 0 ? 'ÜCRETSİZ' : item.cost + ' Para'}</span>
                    <button class="${btnClass}" ${disabled ? 'disabled' : ''}>${btnText}</button>
                </div>
            `;

            if (!disabled) {
                const btn = card.querySelector('button');
                btn.onclick = () => this.buyShopItem(item);
            }

            container.appendChild(card);
        });
    },

    async buyShopItem(item) {
        const u = this.getUser();
        const msgEl = document.getElementById('shop-message');

        try {
            let endpoint = '/api/shop/buy_upgrade';
            let payload = { user_id: u.id, upgrade_key: item.key, cost: item.cost };

            if (item.type === 'weapon') {
                endpoint = '/api/shop/buy_weapon';
                payload = { user_id: u.id, weapon_type: item.weapon_type, cost: item.cost };
            } else if (item.type === 'ammo') {
                endpoint = '/api/shop/buy_ammo';
                payload = { user_id: u.id, weapon_type: item.weapon_type, amount: item.amount, cost: item.cost };
            }

            // Local fallback if no server session
            if (!u.id) {
                if ((u.coins || 0) < item.cost) {
                    msgEl.textContent = "Yetersiz Para!";
                    return;
                }
                u.coins -= item.cost;
                if (item.type === 'weapon') {
                    u[`has_${item.weapon_type}`] = 1;
                    const defaultAmmo = item.weapon_type === 'shotgun' ? 24 : 120;
                    u[`${item.weapon_type}_ammo`] = (u[`${item.weapon_type}_ammo`] || 0) + defaultAmmo;
                } else if (item.type === 'ammo') {
                    u[`${item.weapon_type}_ammo`] = (u[`${item.weapon_type}_ammo`] || 0) + item.amount;
                } else {
                    u[item.key] = (u[item.key] || 0) + 1;
                }
                window.Game.currentUser = u;
                window.Game.syncWeaponAmmoFromUser();
                window.Game.saveUserLocally();
                msgEl.textContent = "Satın alma başarılı!";
                this.renderShopCards();
                return;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success && data.user) {
                window.Game.currentUser = data.user;
                window.Game.syncWeaponAmmoFromUser();
                window.Game.saveUserLocally();
                msgEl.textContent = data.message || "Satın alma başarılı!";
                msgEl.style.color = "#2ecc71";
                this.renderShopCards();
            } else {
                msgEl.textContent = data.message || "Satın alma başarısız!";
                msgEl.style.color = "#e74c3c";
            }
        } catch (e) {
            msgEl.textContent = "Sunucu hatası!";
            msgEl.style.color = "#e74c3c";
        }
    },

    // ================= LEADERBOARD =================
    setupLeaderboard() {
        // Reserved for leaderboard refresh or tab events
    },

    async loadLeaderboard() {
        const tbody = document.getElementById('lb-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';

        try {
            const res = await fetch('/api/leaderboard?limit=10');
            const data = await res.json();
            if (data.success && data.leaderboard) {
                tbody.innerHTML = '';
                data.leaderboard.forEach((r, idx) => {
                    const row = document.createElement('tr');
                    const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : ''));
                    row.innerHTML = `
                        <td class="${rankClass}">#${idx + 1}</td>
                        <td class="${rankClass}">${r.username}</td>
                        <td>${r.score.toLocaleString()}</td>
                        <td>${r.wave}</td>
                        <td>${r.kills}</td>
                    `;
                    tbody.appendChild(row);
                });
            }
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#e74c3c;">Liderlik tablosu yüklenemedi.</td></tr>';
        }
    },

    // ================= ADMIN PANEL =================
    setupAdminPanel() {
        document.getElementById('form-admin-coins')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-target-user').value.trim();
            const amount = parseInt(document.getElementById('admin-coins-amount').value, 10);
            const msg = document.getElementById('admin-msg');

            try {
                const res = await fetch('/api/admin/add_coins', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, amount })
                });
                const data = await res.json();
                msg.textContent = data.message;
                msg.style.color = data.success ? '#2ecc71' : '#e74c3c';
                if (window.Game.currentUser && window.Game.currentUser.username === username) {
                    window.Game.fetchUserInfo(username);
                }
            } catch (err) {
                msg.textContent = "Hata oluştu!";
            }
        });
    }
};

window.UI = UI;

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => UI.init());
} else {
    UI.init();
}
