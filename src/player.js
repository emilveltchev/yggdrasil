// Player stick figure with sword combat

const Player = {
    x: 200,
    y: 500,
    vx: 0,
    vy: 0,
    
    // Stats
    hp: 100,
    maxHP: 100,
    speed: 5,
    
    // Animation state
    walkCycle: 0,
    breathCycle: 0,
    facingRight: true,
    
    // Sword state
    swordAngle: 0,
    targetSwordAngle: 0,
    
    // Swing state machine
    swingState: 'ready', // ready, windup, swing, followthrough, cooldown
    swingTimer: 0,
    swingStartAngle: 0,
    swingTargetAngle: 0,
    
    // Swing timings (ms)
    WINDUP_TIME: 150,
    SWING_TIME: 100,
    FOLLOWTHROUGH_TIME: 80,
    COOLDOWN_TIME: 100,
    
    // Dash
    dashCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    dashVx: 0,
    dashVy: 0,
    DASH_DURATION: 150,
    DASH_COOLDOWN: 500,
    DASH_SPEED: 15,
    
    // Hitstop
    hitstopFrames: 0,
    
    // Invincibility frames
    iframes: 0,
    
    init(x, y) {
        this.x = x;
        this.y = y;
        this.hp = this.maxHP;
        this.swingState = 'ready';
        this.dashCooldown = 0;
        this.iframes = 0;
    },
    
    update(dt, groundY, canvasWidth) {
        // Hitstop freezes everything
        if (this.hitstopFrames > 0) {
            this.hitstopFrames--;
            return;
        }
        
        // Decrease iframes
        if (this.iframes > 0) this.iframes--;
        
        // Dash cooldown
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        
        // Handle dashing
        if (this.isDashing) {
            this.dashTimer -= dt;
            this.x += this.dashVx;
            this.y += this.dashVy;
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            // Normal movement (only when not swinging or in followthrough)
            const canMove = this.swingState === 'ready' || this.swingState === 'cooldown';
            
            if (canMove) {
                this.vx = Input.moveX * this.speed;
            } else {
                this.vx *= 0.8; // Slow down during swing
            }
            
            this.x += this.vx;
            
            // Update facing direction based on mouse
            this.facingRight = Input.mouse.x > this.x;
        }
        
        // Clamp to screen
        this.x = Math.max(30, Math.min(canvasWidth - 30, this.x));
        this.y = groundY;
        
        // Start dash
        if (Input.dash && this.dashCooldown <= 0 && !this.isDashing && this.swingState === 'ready') {
            this.isDashing = true;
            this.dashTimer = this.DASH_DURATION;
            this.dashCooldown = this.DASH_COOLDOWN;
            this.iframes = this.DASH_DURATION + 50; // Invincible during dash + tiny buffer
            
            // Dash toward mouse
            const dx = Input.mouse.x - this.x;
            const dy = Input.mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.dashVx = (dx / dist) * this.DASH_SPEED;
            this.dashVy = (dy / dist) * this.DASH_SPEED * 0.3; // Reduce vertical dash
        }
        
        // Animation cycles
        if (Math.abs(this.vx) > 0.5) {
            this.walkCycle += dt * 0.01;
        } else {
            this.walkCycle = 0;
        }
        this.breathCycle += dt * 0.002;
        
        // Sword aiming - point toward mouse
        const dx = Input.mouse.x - this.x;
        const dy = Input.mouse.y - (this.y - 40); // Aim from shoulder height
        this.targetSwordAngle = Math.atan2(dx, -dy);
        
        // Update sword based on swing state
        this.updateSwing(dt);
        
        // Start swing on click
        if (Input.mouse.clicked && this.swingState === 'ready') {
            this.startSwing();
        }
    },
    
    startSwing() {
        this.swingState = 'windup';
        this.swingTimer = this.WINDUP_TIME;
        this.swingStartAngle = this.swordAngle;
        
        // Calculate swing arc (swing toward cursor then past it)
        const swingArc = 2.5; // Radians of total swing
        this.swingTargetAngle = this.targetSwordAngle + (this.facingRight ? swingArc/2 : -swingArc/2);
        this.windupAngle = this.targetSwordAngle - (this.facingRight ? swingArc/2 : -swingArc/2);
    },
    
    updateSwing(dt) {
        switch (this.swingState) {
            case 'ready':
                // Smoothly follow mouse
                this.swordAngle += (this.targetSwordAngle - this.swordAngle) * 0.2;
                break;
                
            case 'windup':
                this.swingTimer -= dt;
                const windupProgress = 1 - (this.swingTimer / this.WINDUP_TIME);
                // Pull back with easing
                const easeOut = 1 - Math.pow(1 - windupProgress, 2);
                this.swordAngle = this.swingStartAngle + (this.windupAngle - this.swingStartAngle) * easeOut;
                
                if (this.swingTimer <= 0) {
                    this.swingState = 'swing';
                    this.swingTimer = this.SWING_TIME;
                    this.swingStartAngle = this.swordAngle;
                }
                break;
                
            case 'swing':
                this.swingTimer -= dt;
                const swingProgress = 1 - (this.swingTimer / this.SWING_TIME);
                // Fast swing with slight ease
                const swingEase = swingProgress < 0.5 
                    ? 2 * swingProgress * swingProgress 
                    : 1 - Math.pow(-2 * swingProgress + 2, 2) / 2;
                this.swordAngle = this.windupAngle + (this.swingTargetAngle - this.windupAngle) * swingEase;
                
                if (this.swingTimer <= 0) {
                    this.swingState = 'followthrough';
                    this.swingTimer = this.FOLLOWTHROUGH_TIME;
                }
                break;
                
            case 'followthrough':
                this.swingTimer -= dt;
                // Slow down at end
                this.swordAngle += (this.swingTargetAngle - this.swordAngle) * 0.1;
                
                if (this.swingTimer <= 0) {
                    this.swingState = 'cooldown';
                    this.swingTimer = this.COOLDOWN_TIME;
                }
                break;
                
            case 'cooldown':
                this.swingTimer -= dt;
                // Return toward target
                this.swordAngle += (this.targetSwordAngle - this.swordAngle) * 0.15;
                
                if (this.swingTimer <= 0) {
                    this.swingState = 'ready';
                }
                break;
        }
    },
    
    // Check if sword is actively damaging
    isSwingActive() {
        return this.swingState === 'swing';
    },
    
    // Get sword hitbox (line from hand to tip)
    getSwordHitbox() {
        const handPos = this.getHandPosition();
        const swordLength = 60;
        return {
            x1: handPos.x,
            y1: handPos.y,
            x2: handPos.x + Math.sin(this.swordAngle) * swordLength,
            y2: handPos.y - Math.cos(this.swordAngle) * swordLength
        };
    },
    
    getHandPosition() {
        // Approximate right hand position
        const shoulderY = this.y - 35;
        const armAngle = this.swordAngle * 0.5 + (this.facingRight ? 0.3 : -0.3);
        const armLength = 30;
        return {
            x: this.x + Math.sin(armAngle) * armLength,
            y: shoulderY + Math.cos(armAngle) * armLength
        };
    },
    
    takeDamage(amount) {
        if (this.iframes > 0) return false;
        
        this.hp -= amount;
        this.iframes = 500; // Half second of invincibility
        Blood.spawn(this.x, this.y - 30, 10, 5);
        Render.shake(10);
        
        return true;
    },
    
    draw() {
        const ctx = Render.ctx;
        
        // Flash when invincible
        if (this.iframes > 0 && Math.floor(this.iframes / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Dash trail
        if (this.isDashing) {
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                Render.drawStickFigure({
                    x: this.x - this.dashVx * i * 2,
                    y: this.y - this.dashVy * i * 2,
                    color: '#ffffff',
                    scale: 1,
                    limbs: this.getLimbPose()
                });
            }
            ctx.globalAlpha = 1;
        }
        
        // Calculate limb positions
        const limbs = this.getLimbPose();
        
        // Draw figure
        Render.drawStickFigure({
            x: this.x,
            y: this.y,
            color: '#ffffff',
            scale: 1,
            limbs,
            headTilt: Math.sin(this.breathCycle) * 0.5
        });
        
        ctx.globalAlpha = 1;
        
        // Draw sword
        const hand = this.getHandPosition();
        const swingProgress = this.swingState === 'swing' ? (1 - this.swingTimer / this.SWING_TIME) : 0;
        Render.drawSword(hand.x, hand.y, this.swordAngle, 60, swingProgress);
    },
    
    getLimbPose() {
        const walk = Math.sin(this.walkCycle * 10);
        const breath = Math.sin(this.breathCycle) * 0.05;
        
        // Arm follows sword during swing
        let armR = this.swordAngle * 0.6;
        let armL = -0.3 + breath;
        
        // Legs based on walking
        let legL = -0.2 + walk * 0.4;
        let legR = 0.2 - walk * 0.4;
        
        if (this.isDashing) {
            // Stretched pose during dash
            armL = -0.8;
            armR = 0.8;
            legL = -0.6;
            legR = 0.6;
        }
        
        return { armL, armR, legL, legR };
    }
};
