// Enemy types and AI with dismemberment

class Enemy {
    constructor(x, y, type = 'red') {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
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
        this.scale = stats.scale || 1;
        this.isBoss = stats.isBoss || false;
        
        // Animation state
        this.walkCycle = Math.random() * Math.PI * 2;
        this.breathCycle = Math.random() * Math.PI * 2;
        this.facingRight = true;
        
        // AI state
        this.state = 'idle';
        this.stateTimer = 0;
        
        // Combat
        this.swordAngle = 0;
        this.isAttacking = false;
        this.isRangedAttack = false;
        this.threwProjectile = false;
        this.attackTimer = 0;
        this.hitstopFrames = 0;
        
        // Death and dismemberment
        this.dead = false;
        this.deathTimer = 0;
        this.ragdoll = null;
        this.severedHead = null;
        this.decapitated = false;
    }
    
    update(dt, player, groundY, canvasWidth) {
        if (this.dead) {
            this.updateDeath(dt, groundY);
            return;
        }
        
        if (this.hitstopFrames > 0) {
            this.hitstopFrames--;
            return;
        }
        
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        
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
        
        if (Math.abs(this.vx) > 0.1) {
            this.walkCycle += dt * 0.008;
        }
        this.breathCycle += dt * 0.002;
        
        if (!this.isAttacking) {
            const targetAngle = this.facingRight ? 0.5 : -0.5;
            this.swordAngle += (targetAngle - this.swordAngle) * 0.1;
        }
    }
    
    updateIdle(dt, player) {
        const dist = Math.abs(player.x - this.x);
        if (dist < 500) {
            this.state = 'approach';
        }
    }
    
    updateApproach(dt, player, groundY, canvasWidth) {
        const dx = player.x - this.x;
        const dist = Math.abs(dx);
        
        this.facingRight = dx > 0;
        
        if (dist > this.attackRange) {
            this.vx = Math.sign(dx) * this.speed;
            this.x += this.vx;
        } else {
            this.vx = 0;
            if (this.attackCooldown <= 0) {
                this.startAttack(player);
            }
        }
        
        this.x = Math.max(30, Math.min(canvasWidth - 30, this.x));
        this.y = groundY;
    }
    
    startAttack(player) {
        this.state = 'attack';
        this.isAttacking = true;
        this.attackTimer = this.attackDuration;
        this.attackCooldown = this.attackDuration + 500;
        
        const stats = Enemy.TYPES[this.type];
        if (stats && stats.ranged) {
            this.isRangedAttack = true;
            this.threwProjectile = false;
        } else {
            this.isRangedAttack = false;
            this.swordAngle = this.facingRight ? -1.5 : 1.5;
        }
    }
    
    updateAttack(dt, player) {
        this.attackTimer -= dt;
        const progress = 1 - (this.attackTimer / this.attackDuration);
        
        if (this.isRangedAttack) {
            if (progress < 0.4) {
                const windupTarget = this.facingRight ? -1.2 : 1.2;
                this.swordAngle += (windupTarget - this.swordAngle) * 0.15;
            } else if (progress < 0.6) {
                const throwTarget = this.facingRight ? 1.0 : -1.0;
                this.swordAngle += (throwTarget - this.swordAngle) * 0.4;
                
                if (!this.threwProjectile && progress > 0.45) {
                    this.threwProjectile = true;
                    const throwX = this.x + (this.facingRight ? 30 : -30);
                    const throwY = this.y - 35;
                    Projectiles.spawn(throwX, throwY, player.x, player.y - 30, this.damage, 10, this.color);
                }
            } else {
                const restTarget = this.facingRight ? 0.3 : -0.3;
                this.swordAngle += (restTarget - this.swordAngle) * 0.1;
            }
        } else {
            if (progress < 0.3) {
                const windupTarget = this.facingRight ? -1.5 : 1.5;
                this.swordAngle += (windupTarget - this.swordAngle) * 0.2;
            } else if (progress < 0.6) {
                const swingTarget = this.facingRight ? 1.5 : -1.5;
                this.swordAngle += (swingTarget - this.swordAngle) * 0.4;
                
                if (progress > 0.35 && progress < 0.55) {
                    this.checkHitPlayer(player);
                }
            } else {
                const restTarget = this.facingRight ? 0.5 : -0.5;
                this.swordAngle += (restTarget - this.swordAngle) * 0.1;
            }
        }
        
        if (this.attackTimer <= 0) {
            this.isAttacking = false;
            this.state = 'approach';
        }
    }
    
    checkHitPlayer(player) {
        const dist = Math.abs(player.x - this.x);
        if (dist < this.attackRange + 20) {
            player.takeDamage(this.damage);
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
    
    takeDamage(amount, knockbackDir = 1, isLaunch = false) {
        this.hp -= amount;
        this.state = 'hurt';
        this.stateTimer = 200;
        this.vx = knockbackDir * 10;
        this.hitstopFrames = 6;
        
        if (isLaunch) {
            this.vy = -8;
        }
        
        Blood.spawn(this.x, this.y - 30, 25, 10);
        Render.shake(10);
        
        if (this.hp <= 0) {
            this.die(knockbackDir, amount > 30);
        }
    }
    
    die(knockbackDir = 1, wasHeavyHit = false) {
        this.dead = true;
        this.deathTimer = 1500;
        
        // Determine if decapitated (50% chance, higher for heavy hits)
        this.decapitated = Math.random() < (wasHeavyHit ? 0.8 : 0.5);
        
        Blood.burst(this.x, this.y - 20);
        Render.shake(20);
        Effects.onKill();
        Effects.spawnSparks(this.x, this.y - 30, 12);
        
        // Create ragdoll body
        this.ragdoll = {
            x: this.x,
            y: this.y - 20,
            vx: knockbackDir * 8 + this.vx,
            vy: -6,
            rotation: 0,
            vr: knockbackDir * 0.4
        };
        
        // Create severed head if decapitated
        if (this.decapitated) {
            const headY = this.y - 55 * this.scale;
            this.severedHead = {
                x: this.x,
                y: headY,
                vx: knockbackDir * 12 + (Math.random() - 0.5) * 8,
                vy: -10 - Math.random() * 5,
                rotation: 0,
                vr: (Math.random() - 0.5) * 0.8,
                bounces: 0,
                radius: 15 * this.scale
            };
            
            // Extra blood burst from neck
            Blood.spawn(this.x, headY + 20, 40, 15);
            
            // Neck blood fountain effect
            this.neckBloodTimer = 500;
        }
        
        // Notify player for combo
        if (typeof Player !== 'undefined') {
            Player.addCombo();
        }
    }
    
    updateDeath(dt, groundY) {
        this.deathTimer -= dt;
        
        // Update ragdoll body
        if (this.ragdoll) {
            this.ragdoll.vy += 0.6;
            this.ragdoll.x += this.ragdoll.vx;
            this.ragdoll.y += this.ragdoll.vy;
            this.ragdoll.rotation += this.ragdoll.vr;
            this.ragdoll.vx *= 0.99;
            
            if (this.ragdoll.y > groundY - 10) {
                this.ragdoll.y = groundY - 10;
                this.ragdoll.vy *= -0.3;
                this.ragdoll.vx *= 0.7;
                this.ragdoll.vr *= 0.5;
            }
            
            // Neck blood fountain
            if (this.decapitated && this.neckBloodTimer > 0) {
                this.neckBloodTimer -= dt;
                if (Math.random() < 0.3) {
                    const neckX = this.ragdoll.x + Math.sin(this.ragdoll.rotation) * 20;
                    const neckY = this.ragdoll.y - Math.cos(this.ragdoll.rotation) * 20;
                    Blood.spawn(neckX, neckY, 3, 8);
                }
            }
        }
        
        // Update severed head
        if (this.severedHead) {
            const head = this.severedHead;
            head.vy += 0.5;
            head.x += head.vx;
            head.y += head.vy;
            head.rotation += head.vr;
            
            // Bounce off ground
            if (head.y > groundY - head.radius) {
                head.y = groundY - head.radius;
                head.vy *= -0.5;
                head.vx *= 0.6;
                head.vr *= 0.7;
                head.bounces++;
                
                if (head.bounces < 3) {
                    Blood.spawn(head.x, head.y + head.radius, 5, 4);
                }
            }
            
            // Bounce off walls
            if (head.x < head.radius || head.x > Render.canvas.width - head.radius) {
                head.vx *= -0.6;
                head.x = Math.max(head.radius, Math.min(Render.canvas.width - head.radius, head.x));
            }
        }
    }
    
    draw() {
        const ctx = Render.ctx;
        
        if (this.dead) {
            this.drawDead(ctx);
            return;
        }
        
        // Hurt flash
        let color = this.color;
        if (this.state === 'hurt' && Math.floor(this.stateTimer / 30) % 2 === 0) {
            color = '#ffffff';
        }
        
        const walk = Math.sin(this.walkCycle * 10);
        const breath = Math.sin(this.breathCycle) * 0.05;
        
        let armR = this.swordAngle * 0.6;
        let armL = (this.facingRight ? -0.3 : 0.3) + breath;
        let legL = -0.2 + walk * 0.3;
        let legR = 0.2 - walk * 0.3;
        
        Render.drawStickFigure({
            x: this.x,
            y: this.y,
            color,
            scale: this.scale,
            limbs: { armL, armR, legL, legR },
            headTilt: breath
        });
        
        // Draw sword
        const shoulderY = this.y - 35 * this.scale;
        const armAngle = this.swordAngle * 0.5;
        const handX = this.x + Math.sin(armAngle) * 30 * this.scale;
        const handY = shoulderY + Math.cos(armAngle) * 30 * this.scale;
        
        const swingProgress = this.isAttacking ? 0.5 : 0;
        const swordLength = this.isBoss ? 80 : 50;
        Render.drawSword(handX, handY, this.swordAngle, swordLength * this.scale, swingProgress);
        
        // HP bar
        if (this.hp < this.maxHP || this.isBoss) {
            const barWidth = this.isBoss ? 120 : 50;
            const barY = this.y - 80 * this.scale - 10;
            Render.drawHPBar(this.x, barY, this.hp, this.maxHP, barWidth);
            
            if (this.isBoss) {
                ctx.fillStyle = '#aa0000';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('THE GIANT', this.x, barY - 10);
            }
        }
    }
    
    drawDead(ctx) {
        const alpha = Math.max(0, this.deathTimer / 1500);
        
        // Draw headless body ragdoll
        if (this.ragdoll) {
            ctx.save();
            ctx.translate(this.ragdoll.x, this.ragdoll.y);
            ctx.rotate(this.ragdoll.rotation);
            ctx.globalAlpha = alpha;
            
            Render.drawStickFigure({
                x: 0,
                y: 0,
                color: this.color,
                scale: this.scale,
                limbs: { armL: -1, armR: 1, legL: -0.8, legR: 0.8 },
                noHead: this.decapitated
            });
            
            ctx.restore();
        }
        
        // Draw severed head
        if (this.severedHead) {
            const head = this.severedHead;
            ctx.save();
            ctx.translate(head.x, head.y);
            ctx.rotate(head.rotation);
            ctx.globalAlpha = alpha;
            
            // Head circle
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4 * this.scale;
            ctx.beginPath();
            ctx.arc(0, 0, head.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Neck stump (bloody)
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.ellipse(0, head.radius * 0.8, head.radius * 0.4, head.radius * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        ctx.globalAlpha = 1;
    }
}

// Enemy type definitions
Enemy.TYPES = {
    red: {
        hp: 30,
        speed: 2.5,
        damage: 10,
        color: '#cc4444',
        attackRange: 60,
        attackDuration: 700
    },
    orange: {
        hp: 20,
        speed: 4.5,
        damage: 8,
        color: '#ff8844',
        attackRange: 50,
        attackDuration: 400
    },
    purple: {
        hp: 60,
        speed: 1.5,
        damage: 15,
        color: '#8844aa',
        attackRange: 70,
        attackDuration: 1000
    },
    green: {
        hp: 25,
        speed: 2,
        damage: 12,
        color: '#44aa44',
        attackRange: 300,
        attackDuration: 1200,
        ranged: true
    },
    boss: {
        hp: 300,
        speed: 2,
        damage: 30,
        color: '#aa0000',
        attackRange: 100,
        attackDuration: 900,
        scale: 1.8,
        isBoss: true
    }
};
