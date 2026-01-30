// Player stick figure with sword combat, jumping, and wall mechanics

const Player = {
    x: 200,
    y: 500,
    vx: 0,
    vy: 0,
    
    // Stats
    hp: 100,
    maxHP: 100,
    speed: 5,
    jumpForce: -12,
    gravity: 0.5,
    
    // State
    grounded: true,
    onWall: false,
    wallDir: 0, // -1 left wall, 1 right wall
    wallSlideSpeed: 2,
    
    // Animation state
    walkCycle: 0,
    breathCycle: 0,
    facingRight: true,
    
    // Sword state
    swordAngle: 0,
    targetSwordAngle: 0,
    
    // Attack types
    attackType: 'slash', // slash, overhead, thrust, uppercut
    
    // Swing state machine
    swingState: 'ready', // ready, windup, swing, followthrough, cooldown
    swingTimer: 0,
    swingStartAngle: 0,
    swingTargetAngle: 0,
    
    // Attack properties (vary by type)
    currentAttack: null,
    
    // Attack definitions
    ATTACKS: {
        slash: {
            windupTime: 120,
            swingTime: 80,
            followthroughTime: 60,
            cooldownTime: 80,
            damage: 25,
            arc: 2.5,
            knockback: 8
        },
        overhead: {
            windupTime: 200,
            swingTime: 60,
            followthroughTime: 100,
            cooldownTime: 120,
            damage: 45,
            arc: 2.0,
            knockback: 15
        },
        thrust: {
            windupTime: 80,
            swingTime: 50,
            followthroughTime: 80,
            cooldownTime: 60,
            damage: 20,
            arc: 0.3,
            knockback: 5,
            reach: 1.4
        },
        uppercut: {
            windupTime: 150,
            swingTime: 70,
            followthroughTime: 80,
            cooldownTime: 100,
            damage: 35,
            arc: 2.0,
            knockback: 12,
            launch: true
        },
        airSlash: {
            windupTime: 60,
            swingTime: 60,
            followthroughTime: 40,
            cooldownTime: 50,
            damage: 20,
            arc: 2.8,
            knockback: 6
        },
        groundSlam: {
            windupTime: 100,
            swingTime: 80,
            followthroughTime: 150,
            cooldownTime: 100,
            damage: 40,
            arc: 1.0,
            knockback: 20,
            aoe: true
        }
    },
    
    // Dash
    dashCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    dashVx: 0,
    dashVy: 0,
    DASH_DURATION: 150,
    DASH_COOLDOWN: 400,
    DASH_SPEED: 18,
    
    // Hitstop
    hitstopFrames: 0,
    
    // Invincibility frames
    iframes: 0,
    
    // Wall jump buffer
    wallJumpBuffer: 0,
    
    // Combo tracking
    comboCount: 0,
    comboTimer: 0,
    
    init(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = this.maxHP;
        this.swingState = 'ready';
        this.dashCooldown = 0;
        this.iframes = 0;
        this.grounded = false;
        this.onWall = false;
        this.comboCount = 0;
    },
    
    update(dt, groundY, canvasWidth, platforms = []) {
        // Hitstop freezes everything
        if (this.hitstopFrames > 0) {
            this.hitstopFrames--;
            return;
        }
        
        // Decrease iframes
        if (this.iframes > 0) this.iframes--;
        
        // Dash cooldown
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        
        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }
        
        // Wall jump buffer
        if (this.wallJumpBuffer > 0) this.wallJumpBuffer -= dt;
        
        // Handle dashing
        if (this.isDashing) {
            this.dashTimer -= dt;
            this.x += this.dashVx;
            this.y += this.dashVy;
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            // Gravity
            if (!this.grounded) {
                if (this.onWall) {
                    // Wall slide - slower fall
                    this.vy = Math.min(this.vy + this.gravity * 0.3, this.wallSlideSpeed);
                } else {
                    this.vy += this.gravity;
                }
            }
            
            // Horizontal movement
            const canMove = this.swingState === 'ready' || this.swingState === 'cooldown';
            
            if (canMove) {
                if (this.onWall) {
                    // Limited air control on wall
                    this.vx = Input.moveX * this.speed * 0.3;
                } else if (!this.grounded) {
                    // Air control
                    this.vx += Input.moveX * 0.5;
                    this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));
                } else {
                    this.vx = Input.moveX * this.speed;
                }
            } else {
                this.vx *= 0.85;
            }
            
            // Apply velocity
            this.x += this.vx;
            this.y += this.vy;
            
            // Update facing direction based on mouse (only when not on wall)
            if (!this.onWall) {
                this.facingRight = Input.mouse.x > this.x;
            }
        }
        
        // Wall detection
        const wallMargin = 25;
        const wasOnWall = this.onWall;
        this.onWall = false;
        
        if (!this.grounded && this.vy >= 0) {
            if (this.x <= wallMargin) {
                this.onWall = true;
                this.wallDir = -1;
                this.x = wallMargin;
                this.facingRight = true;
            } else if (this.x >= canvasWidth - wallMargin) {
                this.onWall = true;
                this.wallDir = 1;
                this.x = canvasWidth - wallMargin;
                this.facingRight = false;
            }
        }
        
        if (this.onWall && !wasOnWall) {
            this.vy = 0; // Stop fall when grabbing wall
            this.wallJumpBuffer = 150;
        }
        
        // Ground collision
        const wasGrounded = this.grounded;
        if (this.y >= groundY) {
            this.y = groundY;
            
            // Landing dust
            if (!wasGrounded && this.vy > 5) {
                Effects.spawnDust(this.x, groundY, 8);
                Render.shake(3);
            }
            
            this.vy = 0;
            this.grounded = true;
            this.onWall = false;
        } else {
            this.grounded = false;
        }
        
        // Clamp to screen
        this.x = Math.max(wallMargin, Math.min(canvasWidth - wallMargin, this.x));
        
        // Jump
        if (Input.keys[' '] && !Input.prevKeys?.[' ']) {
            if (this.grounded) {
                // Ground jump
                this.vy = this.jumpForce;
                this.grounded = false;
            } else if (this.onWall || this.wallJumpBuffer > 0) {
                // Wall jump
                this.vy = this.jumpForce * 0.9;
                this.vx = -this.wallDir * this.speed * 1.5;
                this.onWall = false;
                this.wallJumpBuffer = 0;
            }
        }
        
        // Dash (shift or double-tap direction)
        if (Input.keys['shift'] && this.dashCooldown <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = this.DASH_DURATION;
            this.dashCooldown = this.DASH_COOLDOWN;
            this.iframes = this.DASH_DURATION + 30;
            
            // Dash direction based on input or facing
            const dashDirX = Input.moveX !== 0 ? Input.moveX : (this.facingRight ? 1 : -1);
            const dashDirY = Input.moveY * 0.5;
            
            const mag = Math.sqrt(dashDirX * dashDirX + dashDirY * dashDirY);
            this.dashVx = (dashDirX / mag) * this.DASH_SPEED;
            this.dashVy = (dashDirY / mag) * this.DASH_SPEED;
            
            // Dash dust
            Effects.spawnDust(this.x, this.y, 10);
        }
        
        // Animation cycles
        if (this.grounded && Math.abs(this.vx) > 0.5) {
            this.walkCycle += dt * 0.01;
        } else if (!this.grounded) {
            this.walkCycle = 0;
        }
        this.breathCycle += dt * 0.002;
        
        // Sword aiming - point toward mouse
        const dx = Input.mouse.x - this.x;
        const dy = Input.mouse.y - (this.y - 40);
        this.targetSwordAngle = Math.atan2(dx, -dy);
        
        // Update sword based on swing state
        this.updateSwing(dt);
        
        // Start attack on click
        if (Input.mouse.clicked && this.swingState === 'ready') {
            this.startAttack();
        }
        
        // Store previous keys for edge detection
        Input.prevKeys = { ...Input.keys };
    },
    
    startAttack() {
        // Determine attack type based on context
        if (!this.grounded) {
            if (Input.moveY > 0) {
                // Holding down in air = ground slam
                this.attackType = 'groundSlam';
            } else {
                this.attackType = 'airSlash';
            }
        } else if (Input.moveY < 0) {
            // Holding up = overhead chop
            this.attackType = 'overhead';
        } else if (Input.moveY > 0) {
            // Holding down then releasing = uppercut (simplified: just hold down)
            this.attackType = 'uppercut';
        } else if (Math.abs(Input.moveX) > 0) {
            // Moving horizontally = thrust
            this.attackType = 'thrust';
        } else {
            // Default = slash
            this.attackType = 'slash';
        }
        
        this.currentAttack = this.ATTACKS[this.attackType];
        this.swingState = 'windup';
        this.swingTimer = this.currentAttack.windupTime;
        this.swingStartAngle = this.swordAngle;
        
        // Calculate swing arc based on attack type
        const arc = this.currentAttack.arc;
        
        if (this.attackType === 'thrust') {
            // Thrust goes straight toward cursor
            this.swingTargetAngle = this.targetSwordAngle;
            this.windupAngle = this.targetSwordAngle + (this.facingRight ? 0.5 : -0.5);
        } else if (this.attackType === 'overhead') {
            // Overhead: starts high, ends low
            this.windupAngle = -Math.PI * 0.4;
            this.swingTargetAngle = Math.PI * 0.3;
        } else if (this.attackType === 'uppercut') {
            // Uppercut: starts low, ends high
            this.windupAngle = Math.PI * 0.3;
            this.swingTargetAngle = -Math.PI * 0.4;
        } else if (this.attackType === 'groundSlam') {
            // Ground slam: sword points down
            this.windupAngle = 0;
            this.swingTargetAngle = Math.PI;
            this.vy = 15; // Accelerate downward
        } else {
            // Normal slash arc
            this.swingTargetAngle = this.targetSwordAngle + (this.facingRight ? arc/2 : -arc/2);
            this.windupAngle = this.targetSwordAngle - (this.facingRight ? arc/2 : -arc/2);
        }
    },
    
    updateSwing(dt) {
        if (!this.currentAttack && this.swingState !== 'ready') {
            this.currentAttack = this.ATTACKS.slash;
        }
        
        switch (this.swingState) {
            case 'ready':
                this.swordAngle += (this.targetSwordAngle - this.swordAngle) * 0.2;
                break;
                
            case 'windup':
                this.swingTimer -= dt;
                const windupProgress = 1 - (this.swingTimer / this.currentAttack.windupTime);
                const easeOut = 1 - Math.pow(1 - windupProgress, 2);
                this.swordAngle = this.swingStartAngle + (this.windupAngle - this.swingStartAngle) * easeOut;
                
                if (this.swingTimer <= 0) {
                    this.swingState = 'swing';
                    this.swingTimer = this.currentAttack.swingTime;
                    this.swingStartAngle = this.swordAngle;
                }
                break;
                
            case 'swing':
                this.swingTimer -= dt;
                const swingProgress = 1 - (this.swingTimer / this.currentAttack.swingTime);
                const swingEase = swingProgress < 0.5 
                    ? 2 * swingProgress * swingProgress 
                    : 1 - Math.pow(-2 * swingProgress + 2, 2) / 2;
                this.swordAngle = this.windupAngle + (this.swingTargetAngle - this.windupAngle) * swingEase;
                
                if (this.swingTimer <= 0) {
                    this.swingState = 'followthrough';
                    this.swingTimer = this.currentAttack.followthroughTime;
                    
                    // Ground slam landing effect
                    if (this.attackType === 'groundSlam' && this.grounded) {
                        Render.shake(20);
                        Blood.spawn(this.x, this.y, 30, 10);
                    }
                }
                break;
                
            case 'followthrough':
                this.swingTimer -= dt;
                this.swordAngle += (this.swingTargetAngle - this.swordAngle) * 0.1;
                
                if (this.swingTimer <= 0) {
                    this.swingState = 'cooldown';
                    this.swingTimer = this.currentAttack.cooldownTime;
                }
                break;
                
            case 'cooldown':
                this.swingTimer -= dt;
                this.swordAngle += (this.targetSwordAngle - this.swordAngle) * 0.15;
                
                if (this.swingTimer <= 0) {
                    this.swingState = 'ready';
                    this.currentAttack = null;
                }
                break;
        }
    },
    
    isSwingActive() {
        return this.swingState === 'swing';
    },
    
    getCurrentDamage() {
        if (!this.currentAttack) return 25;
        return this.currentAttack.damage;
    },
    
    getCurrentKnockback() {
        if (!this.currentAttack) return 8;
        return this.currentAttack.knockback;
    },
    
    isLaunchAttack() {
        return this.currentAttack?.launch === true;
    },
    
    isAOE() {
        return this.currentAttack?.aoe === true;
    },
    
    getSwordHitbox() {
        const handPos = this.getHandPosition();
        const reach = this.currentAttack?.reach || 1;
        const swordLength = 60 * reach;
        return {
            x1: handPos.x,
            y1: handPos.y,
            x2: handPos.x + Math.sin(this.swordAngle) * swordLength,
            y2: handPos.y - Math.cos(this.swordAngle) * swordLength,
            aoe: this.isAOE(),
            aoeRadius: 80
        };
    },
    
    getHandPosition() {
        const shoulderY = this.y - 35;
        const armAngle = this.swordAngle * 0.5 + (this.facingRight ? 0.3 : -0.3);
        const armLength = 30;
        return {
            x: this.x + Math.sin(armAngle) * armLength,
            y: shoulderY + Math.cos(armAngle) * armLength
        };
    },
    
    addCombo() {
        this.comboCount++;
        this.comboTimer = 2000; // 2 second combo window
    },
    
    takeDamage(amount) {
        if (this.iframes > 0) return false;
        
        this.hp -= amount;
        this.iframes = 500;
        this.comboCount = 0; // Reset combo when hit
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
        
        // Wall grab indicator
        if (this.onWall) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            const wallX = this.wallDir < 0 ? 0 : Render.canvas.width - 10;
            ctx.fillRect(wallX, this.y - 60, 10, 70);
        }
        
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
        
        // Draw sword with trail during swing
        const hand = this.getHandPosition();
        const swingProgress = this.swingState === 'swing' ? (1 - this.swingTimer / this.currentAttack?.swingTime || 0) : 0;
        const reach = this.currentAttack?.reach || 1;
        Render.drawSword(hand.x, hand.y, this.swordAngle, 60 * reach, swingProgress);
        
        // Combo counter
        if (this.comboCount > 1) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.comboCount + ' COMBO', this.x, this.y - 90);
        }
    },
    
    getLimbPose() {
        const walk = Math.sin(this.walkCycle * 10);
        const breath = Math.sin(this.breathCycle) * 0.05;
        
        let armR = this.swordAngle * 0.6;
        let armL = -0.3 + breath;
        let legL = -0.2 + walk * 0.4;
        let legR = 0.2 - walk * 0.4;
        
        if (this.isDashing) {
            armL = -0.8;
            armR = 0.8;
            legL = -0.6;
            legR = 0.6;
        } else if (!this.grounded) {
            // Air pose
            armL = -0.5;
            legL = -0.4;
            legR = 0.4;
        } else if (this.onWall) {
            // Wall grab pose
            armL = -1.2;
            legL = -0.3;
            legR = 0.5;
        }
        
        return { armL, armR, legL, legR };
    }
};
