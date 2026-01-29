// Blood particle system

const Blood = {
    particles: [],
    pools: [],
    
    // Spawn blood particles at position
    spawn(x, y, count = 15, velocity = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = velocity * (0.5 + Math.random() * 0.5);
            const size = 2 + Math.random() * 4;
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3, // Slight upward bias
                size,
                color: Math.random() > 0.3 ? '#8B0000' : '#CC0000',
                gravity: 0.3,
                friction: 0.98,
                life: 1,
                decay: 0.01 + Math.random() * 0.02,
                bounced: false
            });
        }
    },
    
    // Big blood burst for kills
    burst(x, y) {
        this.spawn(x, y, 50, 12);
        
        // Add a pool where the body falls
        setTimeout(() => {
            this.addPool(x, Game.groundY);
        }, 300);
    },
    
    // Add blood pool on ground
    addPool(x, y) {
        this.pools.push({
            x,
            y,
            width: 20 + Math.random() * 40,
            height: 3 + Math.random() * 3,
            color: '#5a0000',
            alpha: 0.8
        });
    },
    
    update(groundY) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Physics
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.x += p.vx;
            p.y += p.vy;
            
            // Bounce off ground
            if (p.y > groundY && !p.bounced) {
                p.y = groundY;
                p.vy *= -0.3;
                p.vx *= 0.5;
                p.bounced = true;
                
                // Small chance to create pool
                if (Math.random() < 0.1) {
                    this.pools.push({
                        x: p.x,
                        y: groundY,
                        width: 5 + Math.random() * 10,
                        height: 2,
                        color: '#5a0000',
                        alpha: 0.6
                    });
                }
            }
            
            // Decay
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Slowly fade pools (very slow - they mostly persist)
        for (let i = this.pools.length - 1; i >= 0; i--) {
            const pool = this.pools[i];
            pool.alpha -= 0.0001;
            if (pool.alpha <= 0) {
                this.pools.splice(i, 1);
            }
        }
        
        // Limit pools to prevent memory issues
        while (this.pools.length > 200) {
            this.pools.shift();
        }
    },
    
    draw(ctx) {
        // Draw pools first (behind everything)
        for (const pool of this.pools) {
            ctx.fillStyle = pool.color;
            ctx.globalAlpha = pool.alpha;
            ctx.beginPath();
            ctx.ellipse(pool.x, pool.y, pool.width / 2, pool.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Draw particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },
    
    // Clear all blood (for level reset)
    clear() {
        this.particles = [];
        this.pools = [];
    }
};
