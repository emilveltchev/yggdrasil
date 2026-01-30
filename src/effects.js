// Visual effects - slow-mo, screen flash, particles

const Effects = {
    // Slow motion
    slowMo: false,
    slowMoTimer: 0,
    slowMoScale: 0.3,
    
    // Screen flash
    flashAlpha: 0,
    flashColor: '#ffffff',
    
    // Hit sparks
    sparks: [],
    
    // Dust particles
    dust: [],
    
    // Sword trails
    swordTrail: [],
    maxTrailLength: 8,
    
    // Screen tint for kills
    killTint: 0,
    
    update(dt) {
        // Slow-mo timer
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
            this.slowMo = true;
            if (this.slowMoTimer <= 0) {
                this.slowMo = false;
            }
        }
        
        // Screen flash decay
        if (this.flashAlpha > 0) {
            this.flashAlpha -= 0.1;
        }
        
        // Kill tint decay
        if (this.killTint > 0) {
            this.killTint -= 0.02;
        }
        
        // Update sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.05;
            s.vy += 0.2;
            
            if (s.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
        
        // Update dust
        for (let i = this.dust.length - 1; i >= 0; i--) {
            const d = this.dust[i];
            d.x += d.vx;
            d.y += d.vy;
            d.life -= 0.02;
            d.vy -= 0.05; // Float up
            d.size *= 0.98;
            
            if (d.life <= 0) {
                this.dust.splice(i, 1);
            }
        }
        
        // Trim sword trail
        while (this.swordTrail.length > this.maxTrailLength) {
            this.swordTrail.shift();
        }
    },
    
    // Trigger slow-mo
    triggerSlowMo(durationMs) {
        this.slowMoTimer = durationMs;
    },
    
    // Trigger screen flash
    flash(color = '#ffffff', intensity = 0.5) {
        this.flashColor = color;
        this.flashAlpha = intensity;
    },
    
    // Trigger kill effect
    onKill() {
        this.killTint = 0.3;
        this.triggerSlowMo(150);
    },
    
    // Spawn hit sparks
    spawnSparks(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            this.sparks.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                color: Math.random() > 0.5 ? '#ffff00' : '#ffaa00'
            });
        }
    },
    
    // Spawn dust
    spawnDust(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            this.dust.push({
                x: x + (Math.random() - 0.5) * 20,
                y,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2,
                life: 1,
                size: 5 + Math.random() * 10,
                color: 'rgba(150,140,120,'
            });
        }
    },
    
    // Add point to sword trail
    addTrailPoint(x1, y1, x2, y2) {
        this.swordTrail.push({
            x1, y1, x2, y2,
            alpha: 1
        });
    },
    
    // Get time scale for slow-mo
    getTimeScale() {
        return this.slowMo ? this.slowMoScale : 1;
    },
    
    draw(ctx) {
        // Draw sword trail
        if (this.swordTrail.length > 1) {
            ctx.lineCap = 'round';
            for (let i = 0; i < this.swordTrail.length - 1; i++) {
                const t = this.swordTrail[i];
                const alpha = (i / this.swordTrail.length) * 0.6;
                ctx.strokeStyle = `rgba(200,200,255,${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(t.x1, t.y1);
                ctx.lineTo(t.x2, t.y2);
                ctx.stroke();
            }
        }
        
        // Draw sparks
        for (const s of this.sparks) {
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.life;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw dust
        for (const d of this.dust) {
            ctx.fillStyle = d.color + (d.life * 0.5) + ')';
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        
        // Screen flash overlay
        if (this.flashAlpha > 0) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillRect(0, 0, Render.canvas.width, Render.canvas.height);
            ctx.globalAlpha = 1;
        }
        
        // Kill tint (red vignette)
        if (this.killTint > 0) {
            const gradient = ctx.createRadialGradient(
                Render.canvas.width/2, Render.canvas.height/2, 0,
                Render.canvas.width/2, Render.canvas.height/2, Render.canvas.width/2
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(100,0,0,${this.killTint})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, Render.canvas.width, Render.canvas.height);
        }
    },
    
    clear() {
        this.sparks = [];
        this.dust = [];
        this.swordTrail = [];
        this.slowMoTimer = 0;
        this.slowMo = false;
        this.flashAlpha = 0;
        this.killTint = 0;
    }
};
