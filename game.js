// zombie_web/game.js - Complete Zombie Slayer: Bıçak Ustası Web Engine
// Features: 4 Weapons with Ammunition, Shop, Survival & Continuous Boss Rush modes

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;

// Game States
const STATE_MENU = 'MENU';
const STATE_PLAYING = 'PLAYING';
const STATE_UPGRADE = 'UPGRADE';
const STATE_PAUSED = 'PAUSED';
const STATE_GAMEOVER = 'GAMEOVER';

// Game Modes
const MODE_SURVIVAL = 'SURVIVAL';
const MODE_BOSS = 'BOSS';

class ZombieGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;

        // User profile & progress
        this.currentUser = null;
        this.defaultUser = {
            id: null,
            username: "Misafir",
            is_admin: 0,
            coins: 100,
            level: 1,
            high_score: 0,
            bonus_hp: 0,
            bonus_armor: 0,
            bonus_dmg: 0,
            start_knives: 0,
            perm_cleaver: 0,
            attack_speed: 0,
            move_speed: 0,
            magnet_range: 0,
            crit_chance: 0,
            armor_regen: 0,
            has_pistol: 1,
            pistol_ammo: 60,
            has_shotgun: 0,
            shotgun_ammo: 0,
            has_machinegun: 0,
            machinegun_ammo: 0,
            admin_god_blade: 0,
            admin_orbital_knives: 0,
            admin_hyper_boots: 0,
            admin_cosmic_magnet: 0,
            admin_nuke_cleaver: 0
        };

        this.state = STATE_MENU;
        this.gameMode = MODE_SURVIVAL;
        this.difficulty = 'NORMAL';

        // Gameplay entities
        this.player = null;
        this.knives = [];
        this.bullets = [];
        this.enemies = [];
        this.drops = [];
        this.particles = [];
        this.floatingTexts = [];
        this.orbitalKnives = [];
        this.bloodDecals = [];
        this.shellCasings = [];
        this.muzzleFlashes = [];
        this.enableLighting = true;

        // Weapon state
        this.activeWeapon = 'knife'; // 'knife', 'pistol', 'shotgun', 'machinegun'
        this.pistolAmmo = 60;
        this.shotgunAmmo = 0;
        this.machinegunAmmo = 0;

        // Timers & Cooldowns
        this.knifeTimer = 0;
        this.knifeInterval = 30;
        this.pistolTimer = 0;
        this.shotgunTimer = 0;
        this.machinegunTimer = 0;
        this.cleaverTimer = 0;
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.screenShake = 0;

        // Stats
        this.score = 0;
        this.kills = 0;
        this.wave = 1;
        this.gameLevel = 1;
        this.currentXP = 0;
        this.targetXP = 20;
        this.isBossWave = false;
        this.activeBoss = null;

        // Input
        this.keys = {};
        this.mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
        this.isMouseDown = false;
        this.touchMove = { vx: 0, vy: 0 };

        // Upgrades pool for Survival mode
        this.upgradePool = [
            { id: 'extra_knife', name: 'EKSTRA BIÇAK', desc: 'Aynı anda +1 Bıçak daha fırlat!', icon: '🗡️' },
            { id: 'cleaver', name: 'KASAP SATIRI', desc: 'Devasa delen satırlar fırlat!', icon: '🪓' },
            { id: 'attack_speed', name: 'SERİ FIRLATMA', desc: 'Bıçak atış hızını %25 artır!', icon: '⚡' },
            { id: 'damage', name: 'KESKİN ÇELİK', desc: 'Tüm silahlarda +%30 Hasar artışı!', icon: '🩸' },
            { id: 'move_speed', name: 'ÇEVİKLİK', desc: 'Koşma hızını %15 artır!', icon: '👟' },
            { id: 'max_hp', name: 'CAN ARTIŞI', desc: 'Maksimum Canı +30 artır ve iyileş!', icon: '❤️' },
            { id: 'armor', name: 'ZIRH TAKVİYESİ', desc: 'Zırh kapasitesini +25 artır!', icon: '🛡️' },
            { id: 'magnet', name: 'XP MIKNATISI', desc: 'XP toplama menzilini 2 katına çıkar!', icon: '🧲' },
            { id: 'crit', name: 'ÖLÜMCÜL VURUŞ', desc: '+%15 Kritik Hasar şansı!', icon: '🎯' }
        ];

        this.init();
    }

    init() {
        this.loadStoredUser();
        this.setupEventListeners();
        this.updateTopBarUI();
        this.updateWeaponDockUI();

        // Start 60fps Loop
        let lastTime = performance.now();
        const loop = (currentTime) => {
            const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;
            this.update(dt);
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // ================= USER & BACKEND SYNC =================
    loadStoredUser() {
        const stored = localStorage.getItem('zombie_user');
        if (stored) {
            try {
                this.currentUser = Object.assign({}, this.defaultUser, JSON.parse(stored));
                // Try to refresh from server
                this.fetchUserInfo(this.currentUser.username);
            } catch (e) {
                this.currentUser = Object.assign({}, this.defaultUser);
            }
        } else {
            this.currentUser = Object.assign({}, this.defaultUser);
        }
        this.syncWeaponAmmoFromUser();
    }

    saveUserLocally() {
        if (this.currentUser) {
            localStorage.setItem('zombie_user', JSON.stringify(this.currentUser));
        }
        this.updateTopBarUI();
        this.updateWeaponDockUI();
    }

    syncWeaponAmmoFromUser() {
        if (!this.currentUser) return;
        this.pistolAmmo = this.currentUser.pistol_ammo || 0;
        this.shotgunAmmo = this.currentUser.shotgun_ammo || 0;
        this.machinegunAmmo = this.currentUser.machinegun_ammo || 0;
    }

    async fetchUserInfo(username) {
        try {
            const res = await fetch(`/api/user/info?username=${encodeURIComponent(username)}`);
            const data = await res.json();
            if (data.success && data.user) {
                this.currentUser = Object.assign({}, this.defaultUser, data.user);
                this.saveUserLocally();
            }
        } catch (e) {
            console.log("Sunucuya bağlanılamadı, yerel veri kullanılıyor.");
        }
    }

    async saveGameResultToServer(score, wave, kills, coinsEarned) {
        this.currentUser.coins = (this.currentUser.coins || 0) + coinsEarned;
        this.currentUser.high_score = Math.max(this.currentUser.high_score || 0, score);
        this.currentUser.pistol_ammo = this.pistolAmmo;
        this.currentUser.shotgun_ammo = this.shotgunAmmo;
        this.currentUser.machinegun_ammo = this.machinegunAmmo;
        this.saveUserLocally();

        if (!this.currentUser.id) return; // Guest mode

        try {
            const payload = {
                user_id: this.currentUser.id,
                username: this.currentUser.username,
                score: score,
                wave: wave,
                kills: kills,
                coins_earned: coinsEarned,
                ammo_state: {
                    pistol_ammo: this.pistolAmmo,
                    shotgun_ammo: this.shotgunAmmo,
                    machinegun_ammo: this.machinegunAmmo
                }
            };
            const res = await fetch('/api/game/save_result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success && data.user) {
                this.currentUser = Object.assign({}, this.defaultUser, data.user);
                this.saveUserLocally();
            }
        } catch (e) {
            console.error("Skor sunucuya kaydedilemedi:", e);
        }
    }

    // ================= EVENT LISTENERS =================
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.code) this.keys[e.code] = true;
            if (e.key) {
                this.keys[e.key] = true;
                this.keys[e.key.toLowerCase()] = true;
                this.keys[e.key.toUpperCase()] = true;
            }

            // Start game if on menu and player presses any movement/action key
            if (this.state === STATE_MENU) {
                const startKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'];
                if (startKeys.includes(e.code) || ['w', 'a', 's', 'd', ' ', 'enter'].includes(e.key?.toLowerCase())) {
                    this.startSurvivalGame();
                }
            }

            // Weapon Switching Keys: 1, 2, 3, 4
            if (e.key === '1') this.switchWeapon('knife');
            if (e.key === '2') this.switchWeapon('pistol');
            if (e.key === '3') this.switchWeapon('shotgun');
            if (e.key === '4') this.switchWeapon('machinegun');

            // Quick Cycle with Q
            if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') this.cycleWeapon();

            // Dash / Roll with Space
            if (e.code === 'Space' || e.key === ' ') {
                if (this.state === STATE_PLAYING) {
                    this.performDash();
                }
            }

            // Pause with P or Escape
            if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P' || e.code === 'Escape') {
                if (this.state === STATE_PLAYING) this.state = STATE_PAUSED;
                else if (this.state === STATE_PAUSED) this.state = STATE_PLAYING;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code) this.keys[e.code] = false;
            if (e.key) {
                this.keys[e.key] = false;
                this.keys[e.key.toLowerCase()] = false;
                this.keys[e.key.toUpperCase()] = false;
            }
        });

        window.addEventListener('blur', () => {
            this.keys = {};
            if (this.touchMove) this.touchMove = { vx: 0, vy: 0 };
        });

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const left = (rect.left !== undefined) ? rect.left : (rect.x || 0);
            const top = (rect.top !== undefined) ? rect.top : (rect.y || 0);
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            this.mousePos.x = (e.clientX - left) * scaleX;
            this.mousePos.y = (e.clientY - top) * scaleY;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            Sound.init();
            if (e.button === 0) {
                this.isMouseDown = true;
                if (this.state === STATE_MENU) {
                    this.startSurvivalGame();
                } else if (this.state === STATE_GAMEOVER) {
                    this.state = STATE_MENU;
                }
            }
        });

        // Mouse Wheel weapon cycle
        window.addEventListener('wheel', (e) => {
            if (this.state === STATE_PLAYING) {
                this.cycleWeapon(e.deltaY > 0 ? 1 : -1);
            }
        });

        // Mobile Canvas Touch Listeners (Aiming & Shooting)
        const updateTouchAim = (touch) => {
            const rect = this.canvas.getBoundingClientRect();
            const left = (rect.left !== undefined) ? rect.left : (rect.x || 0);
            const top = (rect.top !== undefined) ? rect.top : (rect.y || 0);
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            this.mousePos.x = (touch.clientX - left) * scaleX;
            this.mousePos.y = (touch.clientY - top) * scaleY;
        };

        this.canvas.addEventListener('touchstart', (e) => {
            Sound.init();
            if (this.state === STATE_MENU) {
                this.startSurvivalGame();
                return;
            } else if (this.state === STATE_GAMEOVER) {
                this.state = STATE_MENU;
                return;
            }
            if (e.targetTouches.length > 0) {
                updateTouchAim(e.targetTouches[0]);
                this.isMouseDown = true;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.targetTouches.length > 0) {
                updateTouchAim(e.targetTouches[0]);
            }
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (e.targetTouches.length === 0) {
                this.isMouseDown = false;
            } else {
                updateTouchAim(e.targetTouches[0]);
            }
        });

        this.canvas.addEventListener('touchcancel', (e) => {
            if (e.targetTouches.length === 0) {
                this.isMouseDown = false;
            }
        });

        // Weapon Dock Slot Clicks
        document.querySelectorAll('.weapon-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const w = slot.dataset.weapon;
                if (w) this.switchWeapon(w);
            });
        });
    }

    // ================= WEAPON MANAGEMENT =================
    switchWeapon(type) {
        if (type === 'pistol' && (!this.currentUser || !this.currentUser.has_pistol)) {
            this.addFloatingText(this.player ? this.player.x : CANVAS_WIDTH / 2, (this.player ? this.player.y : CANVAS_HEIGHT / 2) - 20, "TABANCA KİLİTLİ! MARKET'TEN AL!", "#e74c3c");
            return;
        }
        if (type === 'shotgun' && (!this.currentUser || !this.currentUser.has_shotgun)) {
            this.addFloatingText(this.player ? this.player.x : CANVAS_WIDTH / 2, (this.player ? this.player.y : CANVAS_HEIGHT / 2) - 20, "AV TÜFEĞİ KİLİTLİ! MARKET'TEN AL!", "#e74c3c");
            return;
        }
        if (type === 'machinegun' && (!this.currentUser || !this.currentUser.has_machinegun)) {
            this.addFloatingText(this.player ? this.player.x : CANVAS_WIDTH / 2, (this.player ? this.player.y : CANVAS_HEIGHT / 2) - 20, "TARAMALI KİLİTLİ! MARKET'TEN AL!", "#e74c3c");
            return;
        }

        this.activeWeapon = type;
        this.updateWeaponDockUI();
    }

    cycleWeapon(dir = 1) {
        const order = ['knife', 'pistol', 'shotgun', 'machinegun'];
        let idx = order.indexOf(this.activeWeapon);
        for (let i = 1; i <= 4; i++) {
            let nextIdx = (idx + dir * i + 4) % 4;
            let w = order[nextIdx];
            if (w === 'knife') { this.switchWeapon('knife'); break; }
            if (w === 'pistol' && this.currentUser.has_pistol) { this.switchWeapon('pistol'); break; }
            if (w === 'shotgun' && this.currentUser.has_shotgun) { this.switchWeapon('shotgun'); break; }
            if (w === 'machinegun' && this.currentUser.has_machinegun) { this.switchWeapon('machinegun'); break; }
        }
    }

    updateWeaponDockUI() {
        document.querySelectorAll('.weapon-slot').forEach(slot => {
            const w = slot.dataset.weapon;
            slot.classList.remove('active', 'locked', 'out-of-ammo');

            if (w === this.activeWeapon) {
                slot.classList.add('active');
            }

            const ammoEl = slot.querySelector('.slot-ammo');
            if (w === 'knife') {
                if (ammoEl) ammoEl.textContent = 'SONSUZ';
            } else if (w === 'pistol') {
                const has = this.currentUser && this.currentUser.has_pistol;
                const pBar = document.getElementById('bar-pistol');
                if (!has) {
                    slot.classList.add('locked');
                    if (ammoEl) ammoEl.textContent = 'KİLİTLİ';
                    if (pBar) { pBar.style.width = '0%'; pBar.className = 'ammo-bar-fill empty'; }
                } else {
                    if (ammoEl) {
                        ammoEl.textContent = `${this.pistolAmmo} MERMİ`;
                        ammoEl.className = `slot-ammo ${this.pistolAmmo <= 0 ? 'zero' : ''}`;
                    }
                    if (pBar) {
                        const pRatio = Math.min(100, (this.pistolAmmo / 60) * 100);
                        pBar.style.width = `${pRatio}%`;
                        pBar.className = `ammo-bar-fill ${this.pistolAmmo <= 0 ? 'empty' : ''}`;
                    }
                    if (this.pistolAmmo <= 0) slot.classList.add('out-of-ammo');
                }
            } else if (w === 'shotgun') {
                const has = this.currentUser && this.currentUser.has_shotgun;
                const sBar = document.getElementById('bar-shotgun');
                if (!has) {
                    slot.classList.add('locked');
                    if (ammoEl) ammoEl.textContent = 'KİLİTLİ';
                    if (sBar) { sBar.style.width = '0%'; sBar.className = 'ammo-bar-fill empty'; }
                } else {
                    if (ammoEl) {
                        ammoEl.textContent = `${this.shotgunAmmo} FİŞEK`;
                        ammoEl.className = `slot-ammo ${this.shotgunAmmo <= 0 ? 'zero' : ''}`;
                    }
                    if (sBar) {
                        const sRatio = Math.min(100, (this.shotgunAmmo / 24) * 100);
                        sBar.style.width = `${sRatio}%`;
                        sBar.className = `ammo-bar-fill ${this.shotgunAmmo <= 0 ? 'empty' : ''}`;
                    }
                    if (this.shotgunAmmo <= 0) slot.classList.add('out-of-ammo');
                }
            } else if (w === 'machinegun') {
                const has = this.currentUser && this.currentUser.has_machinegun;
                const mBar = document.getElementById('bar-machinegun');
                if (!has) {
                    slot.classList.add('locked');
                    if (ammoEl) ammoEl.textContent = 'KİLİTLİ';
                    if (mBar) { mBar.style.width = '0%'; mBar.className = 'ammo-bar-fill empty'; }
                } else {
                    if (ammoEl) {
                        ammoEl.textContent = `${this.machinegunAmmo} MERMİ`;
                        ammoEl.className = `slot-ammo ${this.machinegunAmmo <= 0 ? 'zero' : ''}`;
                    }
                    if (mBar) {
                        const mRatio = Math.min(100, (this.machinegunAmmo / 90) * 100);
                        mBar.style.width = `${mRatio}%`;
                        mBar.className = `ammo-bar-fill ${this.machinegunAmmo <= 0 ? 'empty' : ''}`;
                    }
                    if (this.machinegunAmmo <= 0) slot.classList.add('out-of-ammo');
                }
            }
        });
    }

    updateTopBarUI() {
        const u = this.currentUser || this.defaultUser;
        const userEl = document.getElementById('nav-username');
        const coinsEl = document.getElementById('nav-coins');
        const highEl = document.getElementById('nav-highscore');
        const adminBtn = document.getElementById('btn-admin');

        if (userEl) userEl.textContent = u.username + (u.is_admin ? " [ADMIN]" : "");
        if (coinsEl) coinsEl.textContent = `${(u.coins || 0).toLocaleString()} 💰`;
        if (highEl) highEl.textContent = (u.high_score || 0).toLocaleString();
        if (adminBtn) adminBtn.style.display = u.is_admin ? 'inline-flex' : 'none';
    }

    // ================= START GAMEPLAY =================
    startSurvivalGame() {
        this.gameMode = MODE_SURVIVAL;
        this.resetGame();
    }

    startBossMode() {
        this.gameMode = MODE_BOSS;
        this.resetGame();
    }

    resetGame() {
        const u = this.currentUser || this.defaultUser;

        // Permanent Upgrades calculations
        const baseHp = 100 + (u.bonus_hp || 0) * 25;
        const baseArmor = 30 + (u.bonus_armor || 0) * 20;
        const speedBonus = 1 + (u.move_speed || 0) * 0.08 + (u.admin_hyper_boots ? 0.75 : 0);
        const dmgMult = (1 + (u.bonus_dmg || 0) * 0.15) * (u.admin_god_blade ? 5.0 : 1.0);
        const atkSpeedMult = 1 + (u.attack_speed || 0) * 0.12;

        this.player = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            radius: 14,
            speed: 3.2 * speedBonus,
            maxHp: baseHp,
            hp: baseHp,
            maxArmor: baseArmor,
            armor: baseArmor,
            dmgMult: dmgMult,
            critChance: (u.crit_chance || 0) * 0.08 + (u.admin_god_blade ? 1.0 : 0.05),
            magnetRange: 90 + (u.magnet_range || 0) * 60 + (u.admin_cosmic_magnet ? 1200 : 0),
            knifeCount: 1 + (u.start_knives || 0),
            hasCleaver: Boolean(u.perm_cleaver || u.admin_nuke_cleaver),
            hasOrbital: Boolean(u.admin_orbital_knives),
            angle: 0,
            dashCooldown: 0,
            dashDuration: 0,
            isDashing: false,
            invulnerableTime: 0
        };

        this.syncWeaponAmmoFromUser();

        // Clear entities
        this.knives = [];
        this.bullets = [];
        this.enemies = [];
        this.drops = [];
        this.particles = [];
        this.floatingTexts = [];
        this.orbitalKnives = [];
        this.bloodDecals = [];
        this.shellCasings = [];
        this.muzzleFlashes = [];

        this.score = 0;
        this.kills = 0;
        this.wave = 1;
        this.gameLevel = 1;
        this.currentXP = 0;
        this.targetXP = 20;
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.knifeTimer = 0;
        this.cleaverTimer = 0;
        this.activeBoss = null;
        this.isBossWave = (this.gameMode === MODE_BOSS);

        // Orbital knives init
        if (this.player.hasOrbital) {
            for (let i = 0; i < 6; i++) {
                this.orbitalKnives.push({ angle: (Math.PI * 2 / 6) * i, dist: 55 });
            }
        }

        if (this.gameMode === MODE_BOSS) {
            this.spawnBoss();
        }

        this.state = STATE_PLAYING;
        this.updateWeaponDockUI();
    }

    // ================= DASH MECHANIC =================
    performDash() {
        if (this.state !== STATE_PLAYING || !this.player || this.player.dashCooldown > 0) return;
        const u = this.currentUser || this.defaultUser;
        const cd = u.admin_hyper_boots ? 0.1 : 1.2;

        this.player.isDashing = true;
        this.player.dashDuration = 0.22;
        this.player.dashCooldown = cd;
        this.player.invulnerableTime = 0.3;

        Sound.play('dodge_roll');

        let vx = 0, vy = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) vy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) vy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) vx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) vx += 1;

        if (this.touchMove && (this.touchMove.vx !== 0 || this.touchMove.vy !== 0)) {
            vx += this.touchMove.vx;
            vy += this.touchMove.vy;
        }

        if (vx === 0 && vy === 0) {
            vx = Math.cos(this.player.angle);
            vy = Math.sin(this.player.angle);
        } else {
            const len = Math.hypot(vx, vy);
            vx /= len; vy /= len;
        }

        this.player.dashVx = vx * 11.5;
        this.player.dashVy = vy * 11.5;

        // Dash trail particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() * 16 - 8),
                y: this.player.y + (Math.random() * 16 - 8),
                vx: -vx * 2 + (Math.random() - 0.5),
                vy: -vy * 2 + (Math.random() - 0.5),
                life: 0.2,
                color: '#00ffff',
                size: 3
            });
        }
    }

    // ================= WEAPON FIRING =================
    fireActiveWeapon() {
        if (!this.player) return;

        if (this.activeWeapon === 'knife') {
            this.knifeTimer++;
            if (this.knifeTimer >= this.knifeInterval) {
                this.knifeTimer = 0;
                this.throwKnives();
            }
        } else if (this.activeWeapon === 'pistol') {
            this.pistolTimer++;
            if (this.pistolTimer >= 16) {
                this.pistolTimer = 0;
                this.firePistol();
            }
        } else if (this.activeWeapon === 'shotgun') {
            this.shotgunTimer++;
            if (this.shotgunTimer >= 42) {
                this.shotgunTimer = 0;
                this.fireShotgun();
            }
        } else if (this.activeWeapon === 'machinegun') {
            this.machinegunTimer++;
            if (this.machinegunTimer >= 6) {
                this.machinegunTimer = 0;
                this.fireMachineGun();
            }
        }

        // Secondary Passive Weapon: Cleaver
        if (this.player.hasCleaver) {
            this.cleaverTimer++;
            const u = this.currentUser || this.defaultUser;
            const threshold = u.admin_nuke_cleaver ? 14 : 75;
            if (this.cleaverTimer >= threshold) {
                this.cleaverTimer = 0;
                this.throwCleaver();
            }
        }
    }

    getAimAngle() {
        return Math.atan2(this.mousePos.y - this.player.y, this.mousePos.x - this.player.x);
    }

    throwKnives() {
        const aimAngle = this.getAimAngle();
        const count = this.player.knifeCount || 1;
        const spreadAngle = 0.15;
        const startOffset = -((count - 1) * spreadAngle) / 2;

        Sound.play('knife_throw');

        for (let i = 0; i < count; i++) {
            const angle = aimAngle + startOffset + i * spreadAngle;
            const isCrit = Math.random() < this.player.critChance;
            const baseDmg = 40 * this.player.dmgMult;
            const dmg = isCrit ? baseDmg * 2.2 : baseDmg;

            this.knives.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * 12,
                vy: Math.sin(angle) * 12,
                rotation: angle,
                rotSpeed: 0.35,
                dmg: dmg,
                isCrit: isCrit,
                isCleaver: false,
                pierce: 1,
                life: 0.9
            });
        }
    }

    throwCleaver() {
        const aimAngle = this.getAimAngle();
        Sound.play('cleaver_throw');
        const isCrit = Math.random() < this.player.critChance;
        const baseDmg = 85 * this.player.dmgMult;
        const dmg = isCrit ? baseDmg * 2.5 : baseDmg;

        this.knives.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(aimAngle) * 9,
            vy: Math.sin(aimAngle) * 9,
            rotation: aimAngle,
            rotSpeed: 0.45,
            dmg: dmg,
            isCrit: isCrit,
            isCleaver: true,
            pierce: 99, // Pierces all enemies!
            life: 1.5
        });
    }

    addShellCasing(x, y, angle) {
        const ejectAngle = angle + (Math.PI / 2) + (Math.random() - 0.5) * 0.5;
        const speed = 3.5 + Math.random() * 2.5;
        this.shellCasings.push({
            x: x + Math.cos(angle) * 8,
            y: y + Math.sin(angle) * 8,
            vx: Math.cos(ejectAngle) * speed,
            vy: Math.sin(ejectAngle) * speed,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.5,
            life: 5.0,
            friction: 0.90
        });
        if (this.shellCasings.length > 70) this.shellCasings.shift();
    }

    addMuzzleFlash(x, y, angle, size = 18) {
        this.muzzleFlashes.push({
            x: x + Math.cos(angle) * 20,
            y: y + Math.sin(angle) * 20,
            angle: angle,
            size: size,
            life: 0.05
        });
    }

    addBloodSplatter(x, y, isBig = false) {
        const count = isBig ? 3 : 1;
        const colors = ['#641e16', '#78281f', '#922b21', '#900c3f'];
        for (let i = 0; i < count; i++) {
            const dots = [];
            const numDots = Math.floor(Math.random() * 4) + 2;
            for (let j = 0; j < numDots; j++) {
                dots.push({
                    ox: (Math.random() - 0.5) * (isBig ? 28 : 16),
                    oy: (Math.random() - 0.5) * (isBig ? 28 : 16),
                    r: Math.random() * (isBig ? 3 : 1.8) + 0.8
                });
            }
            this.bloodDecals.push({
                x: x + (Math.random() - 0.5) * 12,
                y: y + (Math.random() - 0.5) * 12,
                radiusX: (Math.random() * 5 + 3) * (isBig ? 1.7 : 1.0),
                radiusY: (Math.random() * 3 + 2) * (isBig ? 1.7 : 1.0),
                rot: Math.random() * Math.PI * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                dots: dots,
                alpha: 0.75,
                decay: 0.04
            });
        }
        if (this.bloodDecals.length > 90) this.bloodDecals.splice(0, 5);
    }

    firePistol() {
        if (this.pistolAmmo <= 0) {
            Sound.play('empty_click');
            this.addFloatingText(this.player.x, this.player.y - 20, "TABANCA MERMİSİ BİTTİ!", "#e74c3c");
            this.switchWeapon('knife');
            return;
        }

        this.pistolAmmo--;
        this.updateWeaponDockUI();
        Sound.play('gun_shot');

        const aimAngle = this.getAimAngle();
        const isCrit = Math.random() < this.player.critChance;
        const baseDmg = 55 * this.player.dmgMult;
        const dmg = isCrit ? baseDmg * 2.0 : baseDmg;

        this.addMuzzleFlash(this.player.x, this.player.y, aimAngle, 16);
        this.addShellCasing(this.player.x, this.player.y, aimAngle);

        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(aimAngle) * 18,
            vy: Math.sin(aimAngle) * 18,
            angle: aimAngle,
            dmg: dmg,
            isCrit: isCrit,
            type: 'pistol',
            pierce: 1,
            life: 0.8
        });

        // Muzzle smoke particle
        this.particles.push({
            x: this.player.x + Math.cos(aimAngle) * 20,
            y: this.player.y + Math.sin(aimAngle) * 20,
            vx: Math.cos(aimAngle) * 2,
            vy: Math.sin(aimAngle) * 2,
            life: 0.15,
            color: '#f39c12',
            size: 4
        });
    }

    fireShotgun() {
        if (this.shotgunAmmo <= 0) {
            Sound.play('empty_click');
            this.addFloatingText(this.player.x, this.player.y - 20, "TÜFEK FİŞEĞİ BİTTİ!", "#e74c3c");
            this.switchWeapon('knife');
            return;
        }

        this.shotgunAmmo--;
        this.updateWeaponDockUI();
        Sound.play('shotgun_blast');
        this.screenShake = 6;

        const aimAngle = this.getAimAngle();
        this.addMuzzleFlash(this.player.x, this.player.y, aimAngle, 26);
        this.addShellCasing(this.player.x, this.player.y, aimAngle);
        this.addShellCasing(this.player.x, this.player.y, aimAngle);

        const spreads = [-0.22, -0.11, 0, 0.11, 0.22];

        spreads.forEach(spread => {
            const angle = aimAngle + spread;
            const speed = 14 + Math.random() * 3;
            const isCrit = Math.random() < this.player.critChance;
            const baseDmg = 32 * this.player.dmgMult;
            const dmg = isCrit ? baseDmg * 2.0 : baseDmg;

            this.bullets.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                angle: angle,
                dmg: dmg,
                isCrit: isCrit,
                type: 'shotgun',
                pierce: 1,
                life: 0.55
            });
        });
    }

    fireMachineGun() {
        if (this.machinegunAmmo <= 0) {
            Sound.play('empty_click');
            this.addFloatingText(this.player.x, this.player.y - 20, "TARAMALI MERMİSİ BİTTİ!", "#e74c3c");
            this.switchWeapon('knife');
            return;
        }

        this.machinegunAmmo--;
        this.updateWeaponDockUI();
        Sound.play('machinegun_fire');
        this.screenShake = 2;

        const spread = (Math.random() - 0.5) * 0.16;
        const aimAngle = this.getAimAngle() + spread;
        const isCrit = Math.random() < this.player.critChance;
        const baseDmg = 30 * this.player.dmgMult;
        const dmg = isCrit ? baseDmg * 2.0 : baseDmg;

        this.addMuzzleFlash(this.player.x, this.player.y, aimAngle, 14);
        this.addShellCasing(this.player.x, this.player.y, aimAngle);

        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(aimAngle) * 20,
            vy: Math.sin(aimAngle) * 20,
            angle: aimAngle,
            dmg: dmg,
            isCrit: isCrit,
            type: 'machinegun',
            pierce: 1,
            life: 0.7
        });
    }

    // ================= ENEMY & BOSS SPAWNING =================
    spawnEnemy() {
        // Spawn around edges
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -30 : CANVAS_WIDTH + 30;
            y = Math.random() * CANVAS_HEIGHT;
        } else {
            x = Math.random() * CANVAS_WIDTH;
            y = Math.random() < 0.5 ? -30 : CANVAS_HEIGHT + 30;
        }

        const waveScale = 1 + (this.wave - 1) * 0.12;
        const r = Math.random();

        if (r < 0.18 + Math.min(0.2, this.wave * 0.02)) {
            // Brute
            this.enemies.push({
                x: x, y: y,
                radius: 20,
                hp: 130 * waveScale,
                maxHp: 130 * waveScale,
                speed: 1.2,
                dmg: 25,
                type: 'brute',
                xpVal: 25,
                flashTimer: 0
            });
        } else if (r < 0.45) {
            // Runner
            this.enemies.push({
                x: x, y: y,
                radius: 12,
                hp: 30 * waveScale,
                maxHp: 30 * waveScale,
                speed: 3.1,
                dmg: 10,
                type: 'runner',
                xpVal: 5,
                flashTimer: 0
            });
        } else {
            // Shambler
            this.enemies.push({
                x: x, y: y,
                radius: 14,
                hp: 45 * waveScale,
                maxHp: 45 * waveScale,
                speed: 1.8,
                dmg: 12,
                type: 'shambler',
                xpVal: 2,
                flashTimer: 0
            });
        }
    }

    spawnBoss() {
        Sound.play('boss_alert');
        this.addFloatingText(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50, "⚠️ PATRON ZOMBİ GELİYOR! ⚠️", "#e74c3c");

        const bossScale = (this.gameMode === MODE_BOSS) ? 1.5 + (this.wave * 0.2) : 1.2 + (this.wave * 0.15);

        this.activeBoss = {
            x: CANVAS_WIDTH / 2,
            y: -50,
            radius: 34,
            hp: 950 * bossScale,
            maxHp: 950 * bossScale,
            speed: 1.6,
            dmg: 35,
            isBoss: true,
            type: 'boss',
            xpVal: 100,
            flashTimer: 0,
            dashTimer: 0
        };

        this.enemies.push(this.activeBoss);
    }

    // ================= UPDATE LOOP =================
    update(dt) {
        if (this.state !== STATE_PLAYING) return;

        // Player Movement
        this.updatePlayer(dt);

        // Weapon Execution
        this.fireActiveWeapon();

        // Projectiles update
        this.updateProjectiles(dt);

        // Enemies & Boss update
        this.updateEnemies(dt);

        // Drops & Pickup
        this.updateDrops(dt);

        // Floating texts & particles
        this.updateEffects(dt);

        // Wave logic & Spawning
        this.updateWaveLogic(dt);

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - 0.4);
        }
    }

    updatePlayer(dt) {
        const p = this.player;
        if (!p) return;

        // Coordinate integrity check
        if (isNaN(p.x) || !isFinite(p.x)) p.x = CANVAS_WIDTH / 2;
        if (isNaN(p.y) || !isFinite(p.y)) p.y = CANVAS_HEIGHT / 2;
        if (isNaN(p.angle) || !isFinite(p.angle)) p.angle = 0;

        // Dash handling
        if (p.isDashing) {
            p.x += p.dashVx;
            p.y += p.dashVy;
            p.dashDuration -= dt;
            if (p.dashDuration <= 0) {
                p.isDashing = false;
            }
        } else {
            // Normal WASD / Arrow movement + Mobile Touch Joystick
            let mx = 0, my = 0;
            if (this.keys['KeyW'] || this.keys['w'] || this.keys['W'] || this.keys['ArrowUp'] || this.keys['Up']) my -= 1;
            if (this.keys['KeyS'] || this.keys['s'] || this.keys['S'] || this.keys['ArrowDown'] || this.keys['Down']) my += 1;
            if (this.keys['KeyA'] || this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft'] || this.keys['Left']) mx -= 1;
            if (this.keys['KeyD'] || this.keys['d'] || this.keys['D'] || this.keys['ArrowRight'] || this.keys['Right']) mx += 1;

            if (this.touchMove && (this.touchMove.vx !== 0 || this.touchMove.vy !== 0)) {
                mx += this.touchMove.vx;
                my += this.touchMove.vy;
            }

            const len = Math.hypot(mx, my);
            if (len > 1) {
                mx /= len;
                my /= len;
            }

            p.x += mx * p.speed;
            p.y += my * p.speed;
        }

        // Clamp inside canvas
        p.x = Math.max(p.radius, Math.min(CANVAS_WIDTH - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(CANVAS_HEIGHT - p.radius, p.y));

        // Cooldowns
        if (p.dashCooldown > 0) p.dashCooldown -= dt;
        if (p.invulnerableTime > 0) p.invulnerableTime -= dt;

        // Facing angle: if moving with joystick and not actively aiming/shooting, face move direction
        if (this.touchMove && (Math.abs(this.touchMove.vx) > 0.05 || Math.abs(this.touchMove.vy) > 0.05) && !this.isMouseDown) {
            p.angle = Math.atan2(this.touchMove.vy, this.touchMove.vx);
        } else {
            p.angle = Math.atan2(this.mousePos.y - p.y, this.mousePos.x - p.x);
        }

        // Update dash UI bar & on-screen dash button
        const dashBar = document.getElementById('dash-bar');
        const touchDashBtn = document.getElementById('btn-touch-dash');
        const u = this.currentUser || this.defaultUser;
        const maxCd = u.admin_hyper_boots ? 0.1 : 1.2;
        const ratio = Math.max(0, 1 - (p.dashCooldown / maxCd));

        if (dashBar) {
            dashBar.style.width = `${Math.min(100, ratio * 100)}%`;
            dashBar.style.background = (ratio >= 1) ? '#00ffff' : '#888';
        }

        if (touchDashBtn) {
            if (p.dashCooldown > 0) {
                touchDashBtn.classList.add('cooldown');
            } else {
                touchDashBtn.classList.remove('cooldown');
            }
        }

        // Orbital Knives update
        if (p.hasOrbital && this.orbitalKnives.length > 0) {
            this.orbitalKnives.forEach(ok => {
                ok.angle += 0.06;
                const ox = p.x + Math.cos(ok.angle) * ok.dist;
                const oy = p.y + Math.sin(ok.angle) * ok.dist;

                // Collide with enemies
                this.enemies.forEach(e => {
                    const dist = Math.hypot(e.x - ox, e.y - oy);
                    if (dist < e.radius + 10) {
                        this.damageEnemy(e, 8 * p.dmgMult, false);
                    }
                });
            });
        }
    }

    updateProjectiles(dt) {
        // Knives
        for (let i = this.knives.length - 1; i >= 0; i--) {
            const k = this.knives[i];
            k.x += k.vx;
            k.y += k.vy;
            k.rotation += k.rotSpeed;
            k.life -= dt;

            // Collision with enemies
            let hit = false;
            for (let j = 0; j < this.enemies.length; j++) {
                const e = this.enemies[j];
                const dist = Math.hypot(e.x - k.x, e.y - k.y);
                const hitRadius = k.isCleaver ? (e.radius + 18) : (e.radius + 8);

                if (dist < hitRadius) {
                    this.damageEnemy(e, k.dmg, k.isCrit);
                    k.pierce--;
                    if (k.pierce <= 0) {
                        hit = true;
                        break;
                    }
                }
            }

            if (hit || k.life <= 0 || k.x < -40 || k.x > CANVAS_WIDTH + 40 || k.y < -40 || k.y > CANVAS_HEIGHT + 40) {
                this.knives.splice(i, 1);
            }
        }

        // Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life -= dt;

            let hit = false;
            for (let j = 0; j < this.enemies.length; j++) {
                const e = this.enemies[j];
                const dist = Math.hypot(e.x - b.x, e.y - b.y);
                if (dist < e.radius + 6) {
                    this.damageEnemy(e, b.dmg, b.isCrit);
                    b.pierce--;
                    if (b.pierce <= 0) {
                        hit = true;
                        break;
                    }
                }
            }

            if (hit || b.life <= 0 || b.x < -20 || b.x > CANVAS_WIDTH + 20 || b.y < -20 || b.y > CANVAS_HEIGHT + 20) {
                this.bullets.splice(i, 1);
            }
        }
    }

    damageEnemy(e, dmg, isCrit) {
        e.hp -= dmg;
        e.flashTimer = 0.08;
        Sound.play('hit');

        this.addBloodSplatter(e.x, e.y, isCrit);
        this.addFloatingText(e.x, e.y - 12, Math.round(dmg), isCrit ? '#f1c40f' : '#ecf0f1', isCrit);

        // Blood particles
        for (let i = 0; i < (isCrit ? 6 : 3); i++) {
            this.particles.push({
                x: e.x, y: e.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 0.3,
                color: '#c0392b',
                size: 3
            });
        }

        if (e.hp <= 0) {
            this.killEnemy(e);
        }
    }

    killEnemy(e) {
        Sound.play('zombie_death');
        this.kills++;
        this.score += Math.round(e.maxHp * 1.5);
        this.addBloodSplatter(e.x, e.y, true);

        // Spawn XP drop
        this.drops.push({
            x: e.x, y: e.y,
            val: e.xpVal || 2,
            type: 'xp',
            life: 0
        });

        // Chance of Coin drop (35%)
        if (Math.random() < 0.35 || e.isBoss) {
            this.drops.push({
                x: e.x + (Math.random() * 16 - 8),
                y: e.y + (Math.random() * 16 - 8),
                val: e.isBoss ? 50 : 2,
                type: 'coin',
                life: 0
            });
        }

        if (e.isBoss) {
            this.activeBoss = null;
            this.addFloatingText(e.x, e.y - 30, "🏆 PATRON YIKILDI! +50 PARA!", "#f1c40f", true);

            if (this.gameMode === MODE_BOSS) {
                // In continuous boss mode, spawn the next tougher boss shortly!
                this.wave++;
                setTimeout(() => {
                    if (this.state === STATE_PLAYING) this.spawnBoss();
                }, 2000);
            }
        }

        const idx = this.enemies.indexOf(e);
        if (idx !== -1) this.enemies.splice(idx, 1);
    }

    updateEnemies(dt) {
        const p = this.player;

        for (let i = 0; i < this.enemies.length; i++) {
            const e = this.enemies[i];
            if (e.flashTimer > 0) e.flashTimer -= dt;

            // Move towards player
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.hypot(dx, dy);

            e.angle = Math.atan2(dy, dx);

            if (dist > 2) {
                e.x += (dx / dist) * e.speed;
                e.y += (dy / dist) * e.speed;
            }

            // Damage player on contact
            if (dist < e.radius + p.radius && p.invulnerableTime <= 0) {
                this.damagePlayer(e.dmg);
            }
        }
    }

    damagePlayer(dmg) {
        const p = this.player;
        if (p.isDashing || p.invulnerableTime > 0) return;

        p.invulnerableTime = 0.45;
        this.screenShake = 8;
        Sound.play('player_hurt');

        // Absorb through armor first
        if (p.armor > 0) {
            if (p.armor >= dmg) {
                p.armor -= dmg;
                dmg = 0;
            } else {
                dmg -= p.armor;
                p.armor = 0;
            }
        }

        if (dmg > 0) {
            p.hp -= dmg;
        }

        if (p.hp <= 0) {
            this.gameOver();
        }
    }

    updateDrops(dt) {
        const p = this.player;

        for (let i = this.drops.length - 1; i >= 0; i--) {
            const d = this.drops[i];
            d.life += dt;

            const dx = p.x - d.x;
            const dy = p.y - d.y;
            const dist = Math.hypot(dx, dy);

            // Magnet pulling
            if (dist < p.magnetRange) {
                const pullSpeed = 6 + (1 - dist / p.magnetRange) * 8;
                d.x += (dx / dist) * pullSpeed;
                d.y += (dy / dist) * pullSpeed;
            }

            // Collect drop
            if (dist < p.radius + 12) {
                if (d.type === 'coin') {
                    Sound.play('coin_pickup');
                    this.currentUser.coins = (this.currentUser.coins || 0) + d.val;
                    this.addFloatingText(d.x, d.y - 10, `+${d.val} 💰`, '#f1c40f');
                    this.updateTopBarUI();
                } else {
                    // XP Gem
                    this.addXP(d.val);
                }
                this.drops.splice(i, 1);
            }
        }
    }

    addXP(amount) {
        this.currentXP += amount;
        if (this.currentXP >= this.targetXP) {
            this.currentXP -= this.targetXP;
            this.targetXP = Math.round(this.targetXP * 1.35 + 10);
            this.gameLevel++;
            Sound.play('level_up');

            // CRITICAL REQUIREMENT: "boss modunda level atladıkça olan güncelleştirme olmasın"
            if (this.gameMode === MODE_BOSS) {
                // In boss mode, NO upgrade card pause! Automatically heal and add stat boost!
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
                this.player.armor = this.player.maxArmor;
                this.player.dmgMult *= 1.05;
                this.addFloatingText(this.player.x, this.player.y - 30, `SEVİYE ${this.gameLevel}! (GÜÇLENDİN)`, "#2ecc71", true);
            } else {
                // In Survival mode, show 3 random upgrade cards
                this.showUpgradeCards();
            }
        }
    }

    showUpgradeCards() {
        this.state = STATE_UPGRADE;
        const container = document.getElementById('upgrade-cards-modal');
        if (!container) return;

        // Pick 3 random cards
        const shuffled = [...this.upgradePool].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);

        const cardHolder = document.getElementById('upgrade-choices');
        if (cardHolder) {
            cardHolder.innerHTML = '';
            choices.forEach(c => {
                const cardEl = document.createElement('div');
                cardEl.className = 'upgrade-card';
                cardEl.innerHTML = `
                    <div class="upgrade-card-icon">${c.icon}</div>
                    <div class="upgrade-card-title">${c.name}</div>
                    <div class="upgrade-card-desc">${c.desc}</div>
                `;
                cardEl.onclick = () => this.applyUpgradeChoice(c.id);
                cardHolder.appendChild(cardEl);
            });
        }

        container.classList.add('active');
    }

    applyUpgradeChoice(id) {
        const p = this.player;
        switch (id) {
            case 'extra_knife': p.knifeCount = (p.knifeCount || 1) + 1; break;
            case 'cleaver': p.hasCleaver = true; break;
            case 'attack_speed': this.knifeInterval = Math.max(12, Math.round(this.knifeInterval * 0.78)); break;
            case 'damage': p.dmgMult *= 1.3; break;
            case 'move_speed': p.speed *= 1.15; break;
            case 'max_hp': p.maxHp += 30; p.hp = Math.min(p.maxHp, p.hp + 30); break;
            case 'armor': p.maxArmor += 25; p.armor = p.maxArmor; break;
            case 'magnet': p.magnetRange *= 1.8; break;
            case 'crit': p.critChance += 0.15; break;
        }

        document.getElementById('upgrade-cards-modal')?.classList.remove('active');
        this.state = STATE_PLAYING;
    }

    updateWaveLogic(dt) {
        if (this.gameMode === MODE_SURVIVAL) {
            this.waveTimer += dt;
            const waveLength = 30; // 30 seconds per wave

            if (this.waveTimer >= waveLength) {
                this.waveTimer = 0;
                this.wave++;

                // Boss wave every 5 waves
                if (this.wave % 5 === 0) {
                    this.isBossWave = true;
                    this.spawnBoss();
                } else {
                    this.isBossWave = false;
                }
            }

            // Normal spawn rate
            this.spawnTimer += dt;
            const spawnInterval = Math.max(0.4, 1.8 - this.wave * 0.08);
            if (this.spawnTimer >= spawnInterval && !this.isBossWave) {
                this.spawnTimer = 0;
                this.spawnEnemy();
            }
        } else if (this.gameMode === MODE_BOSS) {
            // Minion spawns in Boss mode to allow tactical refill
            this.spawnTimer += dt;
            if (this.spawnTimer >= 2.8 && this.enemies.length < 8) {
                this.spawnTimer = 0;
                this.spawnEnemy();
            }
        }
    }

    updateEffects(dt) {
        // Floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life -= dt;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life -= dt;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }

        // Shell Casings
        for (let i = this.shellCasings.length - 1; i >= 0; i--) {
            const c = this.shellCasings[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vx *= c.friction;
            c.vy *= c.friction;
            c.rot += c.rotSpeed;
            c.rotSpeed *= 0.96;
            c.life -= dt;
            if (c.life <= 0) this.shellCasings.splice(i, 1);
        }

        // Muzzle Flashes
        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            this.muzzleFlashes[i].life -= dt;
            if (this.muzzleFlashes[i].life <= 0) this.muzzleFlashes.splice(i, 1);
        }

        // Blood Decals
        for (let i = this.bloodDecals.length - 1; i >= 0; i--) {
            const d = this.bloodDecals[i];
            d.alpha -= d.decay * dt;
            if (d.alpha <= 0) this.bloodDecals.splice(i, 1);
        }
    }

    addFloatingText(x, y, text, color = '#ffffff', isBig = false) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            isBig: isBig,
            vy: -0.9,
            life: 0.9
        });
    }

    gameOver() {
        this.state = STATE_GAMEOVER;
        const earnedCoins = this.kills * 2 + Math.floor(this.score / 80);
        this.saveGameResultToServer(this.score, this.wave, this.kills, earnedCoins);

        const goModal = document.getElementById('game-over-modal');
        if (goModal) {
            document.getElementById('go-score').textContent = this.score.toLocaleString();
            document.getElementById('go-wave').textContent = this.wave;
            document.getElementById('go-kills').textContent = this.kills;
            document.getElementById('go-coins').textContent = `+${earnedCoins} 💰`;
            goModal.classList.add('active');
        }
    }

    // ================= RENDERING =================
    render() {
        const ctx = this.ctx;
        ctx.save();

        // Screen Shake
        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake;
            const sy = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(sx, sy);
        }

        // Clear Canvas
        ctx.fillStyle = '#1c2638';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Retro Dungeon Grid lines
        ctx.strokeStyle = 'rgba(40, 56, 82, 0.4)';
        ctx.lineWidth = 1;
        const tileSize = 48;
        for (let x = 0; x < CANVAS_WIDTH; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        if (this.state === STATE_PLAYING || this.state === STATE_UPGRADE || this.state === STATE_PAUSED || this.state === STATE_GAMEOVER) {
            this.renderGameplay(ctx);
        } else if (this.state === STATE_MENU) {
            this.renderMenu(ctx);
        }

        ctx.restore();
    }

    renderGameplay(ctx) {
        // 1. Blood Decals on Floor
        this.bloodDecals.forEach(d => Sprites.drawBloodDecal(ctx, d));

        // 2. Spent Brass Shell Casings
        this.shellCasings.forEach(c => Sprites.drawShellCasing(ctx, c));

        // 3. Drops (XP Gems & Coins)
        this.drops.forEach(d => Sprites.drawDrop(ctx, d));

        // 4. Enemies & Boss
        this.enemies.forEach(e => Sprites.drawEnemy(ctx, e));

        // 5. Bullets
        this.bullets.forEach(b => Sprites.drawBullet(ctx, b.x, b.y, b.angle, b.isCrit, b.type));

        // 6. Knives & Cleavers
        this.knives.forEach(k => Sprites.drawKnife(ctx, k.x, k.y, k.rotation, k.isCrit, k.isCleaver));

        // 7. Tactical Laser Sight when wielding firearms
        if (this.activeWeapon !== 'knife' && this.player) {
            const laserColor = (this.activeWeapon === 'shotgun') ? 'rgba(231, 76, 60, 0.45)' : ((this.activeWeapon === 'machinegun') ? 'rgba(241, 196, 15, 0.45)' : 'rgba(0, 210, 255, 0.45)');
            Sprites.drawLaserSight(ctx, this.player.x, this.player.y, this.mousePos.x, this.mousePos.y, laserColor);
        }

        // 8. Orbital Knives
        if (this.player.hasOrbital) {
            this.orbitalKnives.forEach(ok => {
                const ox = this.player.x + Math.cos(ok.angle) * ok.dist;
                const oy = this.player.y + Math.sin(ok.angle) * ok.dist;
                Sprites.drawOrbitalKnife(ctx, ox, oy, ok.angle + Math.PI / 2);
            });
        }

        // 9. Player
        Sprites.drawPlayer(ctx, this.player.x, this.player.y, this.player.angle, this.player.isDashing, 0, this.activeWeapon);

        // 10. Muzzle Flashes
        this.muzzleFlashes.forEach(mf => Sprites.drawMuzzleFlash(ctx, mf.x, mf.y, mf.angle, mf.size));

        // 11. Ambient Dungeon Lighting Vignette
        if (this.enableLighting && this.player) {
            const vignette = ctx.createRadialGradient(this.player.x, this.player.y, 80, this.player.x, this.player.y, 450);
            vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vignette.addColorStop(0.65, 'rgba(10, 16, 26, 0.35)');
            vignette.addColorStop(1, 'rgba(8, 12, 20, 0.80)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // 12. Particles
        this.particles.forEach(pt => {
            ctx.fillStyle = pt.color;
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        });

        // 13. Floating texts
        this.floatingTexts.forEach(ft => {
            ctx.fillStyle = ft.color;
            ctx.font = ft.isBig ? 'bold 12px "Press Start 2P", monospace' : '9px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        });

        // 14. Custom 8-Bit Targeting Crosshair
        const isTargetingEnemy = this.enemies.some(e => Math.hypot(e.x - this.mousePos.x, e.y - this.mousePos.y) < e.radius + 12);
        Sprites.drawCrosshair(ctx, this.mousePos.x, this.mousePos.y, isTargetingEnemy);

        // 15. Render In-Game HUD
        this.renderHUD(ctx);
    }

    renderHUD(ctx) {
        const p = this.player;

        // Top Left: Health & Armor Bars
        const barX = 20, barY = 20, barW = 200, barH = 14;

        // Health Bar
        ctx.fillStyle = '#0d131a';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        const hpRatio = Math.max(0, p.hp / p.maxHp);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(barX, barY, barW * hpRatio, barH);

        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`CAN: ${Math.max(0, Math.round(p.hp))}/${p.maxHp}`, barX + 6, barY + 11);

        // Armor Bar
        const armY = barY + 20;
        ctx.fillStyle = '#0d131a';
        ctx.fillRect(barX - 2, armY - 2, barW + 4, barH + 4);
        const armRatio = Math.max(0, p.armor / p.maxArmor);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(barX, armY, barW * armRatio, barH);

        ctx.fillStyle = '#fff';
        ctx.fillText(`ZIRH: ${Math.round(p.armor)}/${p.maxArmor}`, barX + 6, armY + 11);

        // Top Center: XP & Level Bar
        const xpX = CANVAS_WIDTH / 2 - 150, xpY = 20, xpW = 300, xpH = 10;
        ctx.fillStyle = '#0d131a';
        ctx.fillRect(xpX - 2, xpY - 2, xpW + 4, xpH + 4);
        const xpRatio = Math.min(1, this.currentXP / this.targetXP);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(xpX, xpY, xpW * xpRatio, xpH);

        ctx.fillStyle = '#f1c40f';
        ctx.textAlign = 'center';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`LVL ${this.gameLevel} [${this.currentXP}/${this.targetXP} XP]`, CANVAS_WIDTH / 2, xpY + 24);

        // Top Right: Score & Wave Info
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`SKOR: ${this.score.toLocaleString()}`, CANVAS_WIDTH - 20, 30);
        ctx.fillStyle = '#00d2ff';
        ctx.fillText(`DALGA: ${this.wave}`, CANVAS_WIDTH - 20, 48);
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`LEŞ: ${this.kills}`, CANVAS_WIDTH - 20, 66);

        // Boss Health Bar at top if Boss is alive
        if (this.activeBoss) {
            const bBarW = 400, bBarH = 16;
            const bBarX = CANVAS_WIDTH / 2 - bBarW / 2;
            const bBarY = 60;

            ctx.fillStyle = 'rgba(13, 19, 26, 0.9)';
            ctx.fillRect(bBarX - 3, bBarY - 3, bBarW + 6, bBarH + 6);
            const bRatio = Math.max(0, this.activeBoss.hp / this.activeBoss.maxHp);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(bBarX, bBarY, bBarW * bRatio, bBarH);

            ctx.fillStyle = '#fff';
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`⚠️ PATRON: ${Math.round(this.activeBoss.hp)} / ${Math.round(this.activeBoss.maxHp)} HP ⚠️`, CANVAS_WIDTH / 2, bBarY + 12);
        }

        // Pause indicator
        if (this.state === STATE_PAUSED) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '16px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('OYUN DURAKLATILDI', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.font = '9px "Press Start 2P", monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText('[P] veya [ESC] ile devam et', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        }
    }

    renderMenu(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#f1c40f';
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.fillText('ZOMBIE SLAYER', CANVAS_WIDTH / 2, 160);

        ctx.fillStyle = '#00d2ff';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('🗡️ BIÇAK USTASI 🗡️', CANVAS_WIDTH / 2, 200);

        // Subtitle / Features
        ctx.fillStyle = '#8c9ba5';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('4 SİLAH - CEPHANE SİSTEMİ - MARKET - BOSS MODU', CANVAS_WIDTH / 2, 240);

        // Buttons info
        ctx.fillStyle = '#2ecc71';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('👉 BAŞLAMAK İÇİN TIKLA VEYA BİR MOD SEÇ:', CANVAS_WIDTH / 2, 330);

        // Mode select buttons on menu
        this.renderMenuButton(ctx, CANVAS_WIDTH / 2 - 170, 370, 160, 45, 'DALGA MODU', '#3498db');
        this.renderMenuButton(ctx, CANVAS_WIDTH / 2 + 10, 370, 160, 45, 'BOSS MODU', '#e74c3c');

        // Weapon guide
        ctx.fillStyle = '#f1c40f';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('[1] Bıçak  |  [2] Tabanca  |  [3] Av Tüfeği  |  [4] Taramalı', CANVAS_WIDTH / 2, 470);
        ctx.fillStyle = '#fff';
        ctx.fillText('[WASD] Hareket  |  [FARE] Nişan/Ateş  |  [SPACE] Takla  |  [Q] Silah Değiştir', CANVAS_WIDTH / 2, 500);
    }

    renderMenuButton(ctx, x, y, w, h, text, color) {
        ctx.fillStyle = '#1c2638';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = color;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w / 2, y + h / 2 + 4);
    }
}

// Global instance
let Game = null;

function bootGame() {
    if (!window.Game) {
        Game = new ZombieGame();
        window.Game = Game; // Expose for UI actions
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootGame);
} else {
    bootGame();
}
