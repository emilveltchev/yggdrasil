// Projectile system for ranged enemies

const Projectiles = {
    list: [],
    
    spawn(x, y, targetX, targetY, damage = 12, speed = 8, color = '#44aa44') {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.list.push({
            x,
            y,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            damage,
            color,
            size: 6,
            rotation: Math.atan2(dy, dx),
            trail: []
        });
    },
    
    update(dt, player, groundY) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            
            // Store trail position
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 5) p.trail.shift();
            
            // Move
            p.x += p.vx;
            p.y += p.vy;
            
            // Check hit player
            const dx = p.x - player.x;
            const dy = p.y - (player.y - 30);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 25) {
                if (player.takeDamage(p.damage)) {
                    // Hit! Remove projectile
                    this.list.splice(i, 1);
                    continue;
                }
            }
            
            // Remove if off screen or hit ground
            if (p.x < -50 || p.x > 1330 || p.y > groundY || p.y < -50) {
                this.list.splice(i, 1);
            }
        }
    },
    
    draw(ctx) {
        for (const p of this.list) {
            // Draw trail
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            
            if (p.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(p.trail[0].x, p.trail[0].y);
                for (let i = 1; i < p.trail.length; i++) {
                    ctx.lineTo(p.trail[i].x, p.trail[i].y);
                }
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
            
            // Draw knife
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            // Blade
            ctx.fillStyle = '#cccccc';
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-4, -3);
            ctx.lineTo(-4, 3);
            ctx.closePath();
            ctx.fill();
            
            // Handle
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-10, -2, 6, 4);
            
            ctx.restore();
        }
    },
    
    clear() {
        this.list = [];
    }
};
