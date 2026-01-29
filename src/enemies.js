// Enemy types and AI

class Enemy {
    constructor(x, y, type = 'red') {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.type = type;
        
        // Set stats based on type
        const stats = Enemy.TYPES[type] || Enemy.TYPES.red;
        this.hp = stats.hp;
        this.maxHP = stats.hp;
        this.speed = stats.speed;
        this.damage = stats.damage;
        this.color = stats.color;
        this.attackRange = stats.attackRange || 50;
        this.attackCooldown = 0;
        this.attackDuration = stats.attackDuration || 800;
        
        // Animation state
        this.walkCycle = Math.random() * Math.PI * 2;
        this.breathCycle = Math.random() * Math.PI * 2;
        this.facingRight = true;
        
        // AI state
        this.state = 'idle'; // idle, approach, attack, hurt, dead
        this.stateTimer = 0;
        this.targetX = x;
        
        // Combat
        this.swordAngle = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.hitstopFrames = 0;
        
        // Death
        this.dead = false;
        this.deathTimer = 0;
        this.ragdoll = null;
    }
    
    update(dt, player, groundY, canvasWidth) {
        if (this.dead) {
            this.updateDeath(dt, groundY);
            return;
        }
        
        // Hitstop
        if (this.hitstopFrames > 0) {
            this.hitstopFrames--;
            return;
        }
        
        // Attack cooldown
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        
        // State machine
        switch (this.state) {
            case 'idle':
                this.updateIdle(dt, player);
                break;
            case 'approach':
                this.updateApproach(dt, player, groundY, canvasWidth);
                break;
            case 'attack':
                this.updateAttack(dt, player);
                break;
            case 'hurt':
                this.updateHurt(dt);
                break;
        }
        
        // Animation
        if (Math.abs(this.vx) > 0.1) {
            this.walkCycle += dt * 0.008;
        }
        this.breathCycle += dt * 0.002;
        
        // Sword follows facing when not attacking
        if (!this.isAttacking) {
            const targetAngle = this.facingRight ? 0.5 : -0.5;
            this.swordAngle += (targetAngle - this.swordAngle) * 0.1;
        }
    }
    
    updateIdle(dt, player) {
        // Start approaching when player is in range
        const dist = Math.abs(player.x - this.x);
        if (dist < 400) {
            this.state = 'approach';
        }
    }
    
    updateApproach(dt, player, groundY, canvasWidth) {
        const dx = player.x - this.x;
        const dist = Math.abs(dx);
        
        // Face player
        this.facingRight = dx > 0;
        
        // Move toward player
        if (dist > this.attackRange) {
            this.vx = Math.sign(dx) * this.speed;
            this.x += this.vx;
        } else {
            this.vx = 0;
            // In range - attack!
            if (this.attackCooldown <= 0) {
                this.startAttack(player);
            }
        }
        
        // Clamp to screen
        this.x = Math.max(30, Math.min(canvasWidth - 30, this.x));
        this.y = groundY;
    }
    
    startAttack(player) {
        this.state = 'attack';
        this.isAttacking = true;
        this.attackTimer = this.attackDuration;
        this.attackCooldown = this.attackDuration + 500;
        
        // Wind up - pull sword back
        this.swordAngle = this.facingRight ? -1.5 : 1.5;
    }
    
    updateAttack(dt, player) {
        this.attackTimer -= dt;
        
        const progress = 1 - (this.attackTimer / this.attackDuration);
        
        if (progress < 0.3) {
            // Wind up
            const windupTarget = this.facingRight ? -1.5 : 1.5;
            this.swordAngle += (windupTarget - this.swordAngle) * 0.2;
        } else if (progress < 0.6) {
            // Swing!
            const swingTarget = this.facingRight ? 1.5 : -1.5;
            this.swordAngle += (swingTarget - this.swordAngle) * 0.4;
            
            // Check hit on player
            if (progress > 0.35 && progress < 0.55) {
                this.checkHitPlayer(player);
            }
        } else {
            // Recovery
            const restTarget = this.facingRight ? 0.5 : -0.5;
            this.swordAngle += (restTarget - this.swordAngle) * 0.1;
        }
        
        if (this.attackTimer <= 0) {
            this.isAttacking = false;
            this.state = 'approach';
        }
    }
    
    checkHitPlayer(player) {
        // Simple distance check
        const dist = Math.abs(player.x - this.x);
        if (dist < this.attackRange + 20 && player.takeDamage(this.damage)) {
            // Hit!
        }
    }
    
    updateHurt(dt) {
        this.stateTimer -= dt;
        this.vx *= 0.9;
        this.x += this.vx;
        
        if (this.stateTimer <= 0) {
            this.state = 'approach';
        }
    }
    
    takeDamage(amount, knockbackDir = 1) {
        this.hp -= amount;
        this.state = 'hurt';
        this.stateTimer = 200;
        this.vx = knockbackDir * 8;
        this.hitstopFrames = 6;
        
        // Blood!
        Blood.spawn(this.x, this.y - 30, 20, 8);
        Render.shake(8);
        
        if (this.hp <= 0) {
            this.die();
        }
    }
    
    die() {
        this.dead = true;
        this.deathTimer = 1000;
        
        // Big blood burst
        Blood.burst(this.x, this.y - 20);
        Render.shake(15);
        
        // Create ragdoll
        this.ragdoll = {
            x: this.x,
            y: this.y - 20,
            vx: this.vx * 2,
            vy: -5,
            rotation: 0,
            vr: (Math.random() - 0.5) * 0.3
        };
    }
    
    updateDeath(dt, groundY) {
        this.deathTimer -= dt;
        
        if (this.ragdoll) {
            // Physics
            this.ragdoll.vy += 0.5;
            this.ragdoll.x += this.ragdoll.vx;
            this.ragdoll.y += this.ragdoll.vy;
            this.ragdoll.rotation += this.ragdoll.vr;
            
            // Hit ground
            if (this.ragdoll.y > groundY - 10) {
                this.ragdoll.y = groundY - 10;
                this.ragdoll.vy = 0;
                this.ragdoll.vx *= 0.7;
                this.ragdoll.vr *= 0.5;
            }
        }
    }
    
    draw() {
        const ctx = Render.ctx;
        
        if (this.dead && this.ragdoll) {
            // Draw dead body
            ctx.save();
            ctx.translate(this.ragdoll.x, this.ragdoll.y);
            ctx.rotate(this.ragdoll.rotation);
            ctx.globalAlpha = Math.max(0, this.deathTimer / 1000);
            
            Render.drawStickFigure({
                x: 0,
                y: 0,
                color: this.color,
                scale: 1,
                limbs: { armL: -1, armR: 1, legL: -0.8, legR: 0.8 }
            });
            
            ctx.restore();
            ctx.globalAlpha = 1;
            return;
        }
        
        if (this.dead) return;
        
        // Hurt flash
        let color = this.color;
        if (this.state === 'hurt' && Math.floor(this.stateTimer / 30) % 2 === 0) {
            color = '#ffffff';
        }
        
        // Get limb pose
        const walk = Math.sin(this.walkCycle * 10);
        const breath = Math.sin(this.breathCycle) * 0.05;
        
        let armR = this.swordAngle * 0.6;
        let armL = (this.facingRight ? -0.3 : 0.3) + breath;
        let legL = -0.2 + walk * 0.3;
        let legR = 0.2 - walk * 0.3;
        
        // Draw figure
        Render.drawStickFigure({
            x: this.x,
            y: this.y,
            color,
            scale: 1,
            limbs: { armL, armR, legL, legR },
            headTilt: breath
        });
        
        // Draw sword
        const shoulderY = this.y - 35;
        const armAngle = this.swordAngle * 0.5;
        const handX = this.x + Math.sin(armAngle) * 30;
        const handY = shoulderY + Math.cos(armAngle) * 30;
        
        const swingProgress = this.isAttacking ? 0.5 : 0;
        Render.drawSword(handX, handY, this.swordAngle, 50, swingProgress);
        
        // HP bar
        if (this.hp < this.maxHP) {
            Render.drawHPBar(this.x, this.y - 80, this.hp, this.maxHP);
        }
    }
    
    getSwordHitbox() {
        const shoulderY = this.y - 35;
        const armAngle = this.swordAngle * 0.5;
        const handX = this.x + Math.sin(armAngle) * 30;
        const handY = shoulderY + Math.cos(armAngle) * 30;
        const swordLength = 50;
        
        return {
            x1: handX,
            y1: handY,
            x2: handX + Math.sin(this.swordAngle) * swordLength,
            y2: handY - Math.cos(this.swordAngle) * swordLength
        };
    }
}

// Enemy type definitions
Enemy.TYPES = {
    red: {
        hp: 30,
        speed: 2,
        damage: 10,
        color: '#cc4444',
        attackRange: 60,
        attackDuration: 800
    },
    orange: {
        hp: 20,
        speed: 4,
        damage: 8,
        color: '#ff8844',
        attackRange: 50,
        attackDuration: 500
    },
    purple: {
        hp: 60,
        speed: 1.2,
        damage: 15,
        color: '#8844aa',
        attackRange: 70,
        attackDuration: 1200
    },
    green: {
        hp: 25,
        speed: 1.5,
        damage: 12,
        color: '#44aa44',
        attackRange: 300, // Ranged
        attackDuration: 1500,
        ranged: true
    }
};
