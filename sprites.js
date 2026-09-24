// zombie_web/sprites.js - High-Performance Procedural 8-Bit Pixel Art Renderer
// Generates and caches retro pixelated sprites for maximum 60FPS performance

const Sprites = {
    cache: {},

    init() {
        // Pre-render common static sprites
        this.cache['gem_green'] = this.createGemCanvas('#2ecc71', '#27ae60');
        this.cache['gem_blue'] = this.createGemCanvas('#3498db', '#2980b9');
        this.cache['gem_purple'] = this.createGemCanvas('#9b59b6', '#8e44ad');
        this.cache['coin'] = this.createCoinCanvas();
    },

    createGemCanvas(primary, secondary) {
        const c = document.createElement('canvas');
        c.width = 16; c.height = 16;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Diamond gem shape
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.lineTo(14, 8);
        ctx.lineTo(8, 14);
        ctx.lineTo(2, 8);
        ctx.closePath();
        ctx.fill();

        // Shading
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.moveTo(8, 8);
        ctx.lineTo(14, 8);
        ctx.lineTo(8, 14);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(7, 5, 2, 2);

        return c;
    },

    createCoinCanvas() {
        const c = document.createElement('canvas');
        c.width = 16; c.height = 16;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(8, 8, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d68910';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#b7950b';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 8, 8.5);

        return c;
    },

    // Draw Player
    drawPlayer(ctx, x, y, angle, isDashing = false, walkCycle = 0, activeWeapon = 'knife') {
        ctx.save();
        ctx.translate(x, y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dash trail/ghosting glow
        if (isDashing) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
        }

        ctx.rotate(angle);

        // Body (Brown Vest)
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-8, -10, 16, 20);

        // Vest jacket
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-9, -11, 4, 22);
        ctx.fillRect(5, -11, 4, 22);

        // Head
        ctx.fillStyle = '#f5cba7'; // Skin tone
        ctx.beginPath();
        ctx.arc(0, -3, 8, 0, Math.PI * 2);
        ctx.fill();

        // Red Ninja/Hero Bandana
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-8, -9, 16, 5);
        // Bandana tails
        ctx.fillRect(-12, -8, 5, 3);
        ctx.fillRect(-15, -6, 4, 3);

        // Eyes
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(2, -4, 3, 3);
        ctx.fillRect(2, 0, 3, 3);

        // Hands / Holding active weapon
        ctx.fillStyle = '#f5cba7';
        ctx.fillRect(7, 4, 5, 5);
        ctx.fillRect(7, -9, 5, 5);

        // Draw weapon in hands
        if (activeWeapon === 'knife') {
            // Shiny Dagger
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(10, -2, 10, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(14, -1, 4, 1);
            ctx.fillStyle = '#8e44ad'; // Purple hilt
            ctx.fillRect(8, -4, 2, 7);
        } else if (activeWeapon === 'pistol') {
            // Pistol
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(9, -2, 11, 4);
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(11, -3, 7, 2);
            ctx.fillStyle = '#e67e22'; // Muzzle accent
            ctx.fillRect(19, -2, 2, 4);
        } else if (activeWeapon === 'shotgun') {
            // Double-barrel Shotgun
            ctx.fillStyle = '#784212'; // Wooden stock
            ctx.fillRect(6, -2, 6, 4);
            ctx.fillStyle = '#2c3e50'; // Steel barrels
            ctx.fillRect(12, -3, 15, 6);
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(26, -3, 2, 6);
        } else if (activeWeapon === 'machinegun') {
            // Machine Gun / Assault Rifle
            ctx.fillStyle = '#17202a';
            ctx.fillRect(8, -3, 18, 5);
            ctx.fillStyle = '#566573';
            ctx.fillRect(12, -5, 10, 2);
            // Banana magazine
            ctx.fillStyle = '#b7950b';
            ctx.fillRect(13, 2, 4, 7);
            // Flash suppressor
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(25, -2, 3, 3);
        }

        ctx.restore();
    },

    // Draw Knife Projectile
    drawKnife(ctx, x, y, rotation, isCrit = false, isCleaver = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        if (isCleaver) {
            // Giant Butcher Cleaver
            ctx.fillStyle = isCrit ? '#f39c12' : '#ecf0f1';
            ctx.fillRect(-14, -10, 28, 20);
            // Heavy cutting edge
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(10, -10, 4, 20);
            // Cleaver hole
            ctx.fillStyle = '#1c2638';
            ctx.fillRect(4, -7, 4, 4);
            // Handle
            ctx.fillStyle = '#873600';
            ctx.fillRect(-22, -4, 9, 8);
            // Blood stains on blade
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(0, 2, 8, 4);
            ctx.fillRect(5, -4, 4, 3);
        } else {
            // Throwing Dagger
            ctx.fillStyle = isCrit ? '#f1c40f' : '#ecf0f1';
            // Blade
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-4, -4);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();

            // Shineline
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -1, 10, 2);

            // Crossguard
            ctx.fillStyle = isCrit ? '#e67e22' : '#34495e';
            ctx.fillRect(-5, -6, 3, 12);

            // Handle & Pommel
            ctx.fillStyle = '#962d3e';
            ctx.fillRect(-10, -2, 6, 4);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(-12, -3, 3, 6);
        }

        ctx.restore();
    },

    // Draw Bullet
    drawBullet(ctx, x, y, angle, isCrit = false, type = 'pistol') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        if (type === 'shotgun') {
            // Heavy Pellet / Slug
            ctx.fillStyle = isCrit ? '#e74c3c' : '#f39c12';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1, -1, 3, 3);
        } else if (type === 'machinegun') {
            // Elongated rapid-fire glowing tracer
            ctx.fillStyle = isCrit ? '#f39c12' : '#f1c40f';
            ctx.fillRect(-6, -2, 12, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, -1, 8, 2);
        } else {
            // Pistol bullet
            ctx.fillStyle = isCrit ? '#e67e22' : '#f4d03f';
            ctx.fillRect(-5, -2, 10, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, -1, 5, 2);
        }

        ctx.restore();
    },

    // Draw Orbital Knife
    drawOrbitalKnife(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -1, 10, 2);

        ctx.shadowBlur = 0;
        ctx.restore();
    },

    // Draw Enemy
    drawEnemy(ctx, e) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Flash white on hit
        if (e.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, e.radius + 2, e.radius * 0.9, e.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Direction towards player or angle
        ctx.rotate(e.angle || 0);

        if (e.isBoss) {
            // ============ BOSS RENDERING ============
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 15;

            // Massive menacing body
            ctx.fillStyle = '#4a235a'; // Deep demonic purple
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            ctx.fill();

            // Armor plates
            ctx.fillStyle = '#17202a';
            ctx.fillRect(-e.radius * 0.8, -e.radius * 0.6, e.radius * 1.6, e.radius * 0.5);

            // Glowing Horns / Spikes
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.moveTo(-15, -e.radius);
            ctx.lineTo(-8, -e.radius - 16);
            ctx.lineTo(-2, -e.radius);
            ctx.moveTo(15, -e.radius);
            ctx.lineTo(8, -e.radius - 16);
            ctx.lineTo(2, -e.radius);
            ctx.fill();

            // Glowing Red Boss Eyes
            ctx.fillStyle = '#ff0033';
            ctx.beginPath();
            ctx.arc(e.radius * 0.4, -6, 5, 0, Math.PI * 2);
            ctx.arc(e.radius * 0.4, 6, 5, 0, Math.PI * 2);
            ctx.fill();

            // Cleavers in hands
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(e.radius * 0.6, -18, 20, 10);
            ctx.fillRect(e.radius * 0.6, 8, 20, 10);

            ctx.shadowBlur = 0;
        } else if (e.type === 'brute') {
            // Bulky Armored Brute
            ctx.fillStyle = '#5b2c6f';
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            ctx.fill();

            // Iron chestplate
            ctx.fillStyle = '#34495e';
            ctx.fillRect(-10, -10, 20, 20);

            // Red glowing eyes
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(6, -5, 4, 3);
            ctx.fillRect(6, 2, 4, 3);

            // Spikes on shoulders
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(-6, -e.radius - 4, 6, 6);
            ctx.fillRect(-6, e.radius - 2, 6, 6);
        } else if (e.type === 'runner') {
            // Lean Fast Runner Ghoul
            ctx.fillStyle = '#c0392b'; // Crimson mutated flesh
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            ctx.fill();

            // Sharp Yellow Eyes
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(4, -4, 3, 2);
            ctx.fillRect(4, 2, 3, 2);

            // Claws
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(8, -7, 5, 2);
            ctx.fillRect(8, 5, 5, 2);
        } else {
            // Standard Shambler (Classic Zombie)
            ctx.fillStyle = '#27ae60'; // Rotten green
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            ctx.fill();

            // Torn Shirt
            ctx.fillStyle = '#2980b9';
            ctx.fillRect(-6, -8, 12, 16);

            // Vacant dead eyes
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(3, -4, 3, 3);
            ctx.fillRect(3, 1, 3, 3);

            // Outstretched zombie arms
            ctx.fillStyle = '#1e8449';
            ctx.fillRect(6, -7, 9, 3);
            ctx.fillRect(6, 4, 9, 3);
        }

        ctx.restore();

        // Enemy Health Bar (if damaged or boss)
        if (e.hp < e.maxHp || e.isBoss) {
            const barW = e.radius * 2.2;
            const barH = e.isBoss ? 8 : 4;
            const barX = e.x - barW / 2;
            const barY = e.y - e.radius - (e.isBoss ? 16 : 8);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

            const hpRatio = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = e.isBoss ? '#e74c3c' : '#2ecc71';
            ctx.fillRect(barX, barY, barW * hpRatio, barH);
        }
    },

    // Draw Drop (XP Gem or Coin)
    drawDrop(ctx, drop) {
        if (drop.type === 'coin') {
            const c = this.cache['coin'];
            if (c) {
                // Bobbing & subtle spin
                const bob = Math.sin(drop.life * 0.1) * 2;
                ctx.drawImage(c, drop.x - 8, drop.y - 8 + bob);
            }
        } else {
            let gemCanvas = this.cache['gem_green'];
            if (drop.val >= 25) gemCanvas = this.cache['gem_purple'];
            else if (drop.val >= 5) gemCanvas = this.cache['gem_blue'];

            if (gemCanvas) {
                // Bobbing animation with soft glow halo
                const bob = Math.sin(drop.life * 0.08) * 2.5;
                ctx.save();
                ctx.shadowColor = (drop.val >= 25) ? '#9b59b6' : ((drop.val >= 5) ? '#3498db' : '#2ecc71');
                ctx.shadowBlur = 6;
                ctx.drawImage(gemCanvas, drop.x - 8, drop.y - 8 + bob);
                ctx.restore();
            }
        }
    },

    // Draw Dynamic Muzzle Flash
    drawMuzzleFlash(ctx, x, y, angle, size = 16) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.fillStyle = '#fff176';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 1.3, -size * 0.4);
        ctx.lineTo(size * 0.8, 0);
        ctx.lineTo(size * 1.3, size * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(size * 0.4, 0, size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // Draw Brass Shell Casing
    drawShellCasing(ctx, c) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(-2, -1, 4, 2);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-1, -1, 2, 1);
        ctx.restore();
    },

    // Draw Persistent Blood Splatter
    drawBloodDecal(ctx, d) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, d.alpha);
        ctx.fillStyle = d.color || '#8b0000';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.radiusX, d.radiusY, d.rot, 0, Math.PI * 2);
        ctx.fill();

        // Splatter droplets around
        if (d.dots) {
            d.dots.forEach(dot => {
                ctx.beginPath();
                ctx.arc(d.x + dot.ox, d.y + dot.oy, dot.r, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.restore();
    },

    // Draw Tactical Laser Sight
    drawLaserSight(ctx, startX, startY, targetX, targetY, color = 'rgba(231, 76, 60, 0.4)') {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // Draw Retro 8-bit Crosshair
    drawCrosshair(ctx, x, y, isTargeting = false) {
        ctx.save();
        ctx.translate(x, y);

        const col = isTargeting ? '#e74c3c' : '#00d2ff';
        const size = isTargeting ? 10 : 8;

        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;

        // Center dot
        ctx.fillStyle = col;
        ctx.fillRect(-1, -1, 2, 2);

        // Reticle ticks
        ctx.beginPath();
        ctx.moveTo(-size, 0); ctx.lineTo(-3, 0);
        ctx.moveTo(3, 0); ctx.lineTo(size, 0);
        ctx.moveTo(0, -size); ctx.lineTo(0, -3);
        ctx.moveTo(0, 3); ctx.lineTo(0, size);
        ctx.stroke();

        ctx.restore();
    }
};

Sprites.init();
