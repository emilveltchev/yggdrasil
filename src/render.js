// Rendering utilities for stick figures

const Render = {
    ctx: null,
    canvas: null,
    screenShake: { x: 0, y: 0, intensity: 0, decay: 0.9 },
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        // 16:9 aspect ratio, fit to window
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 40;
        const aspect = 16/9;
        
        let width = maxWidth;
        let height = width / aspect;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspect;
        }
        
        this.canvas.width = 1280;
        this.canvas.height = 720;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    },
    
    clear() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    // Screen shake
    shake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    },
    
    updateShake() {
        if (this.screenShake.intensity > 0.5) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= this.screenShake.decay;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }
    },
    
    applyShake() {
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
    },
    
    removeShake() {
        this.ctx.restore();
    },
    
    // Draw a stick figure
    // figure: { x, y, color, scale, limbs: { armL, armR, legL, legR }, headTilt, noHead }
    drawStickFigure(figure) {
        const ctx = this.ctx;
        const { x, y, color = '#ffffff', scale = 1, limbs = {}, headTilt = 0, noHead = false } = figure;
        
        const s = scale;
        const headRadius = 15 * s;
        const bodyLength = 40 * s;
        const limbLength = 30 * s;
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 4 * s;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Body positions
        const headY = y - bodyLength - headRadius;
        const shoulderY = y - bodyLength + 5 * s;
        const hipY = y;
        
        // Default limb angles (radians from vertical)
        const armL = limbs.armL ?? -0.3;
        const armR = limbs.armR ?? 0.3;
        const legL = limbs.legL ?? -0.2;
        const legR = limbs.legR ?? 0.2;
        
        // Head (unless decapitated)
        if (!noHead) {
            ctx.beginPath();
            ctx.arc(x, headY + headTilt * 3, headRadius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Neck stump
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(x, headY + headRadius, 6 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color;
        }
        
        // Body
        ctx.beginPath();
        ctx.moveTo(x, headY + headRadius);
        ctx.lineTo(x, hipY);
        ctx.stroke();
        
        // Left arm
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        const armLEndX = x + Math.sin(armL) * limbLength;
        const armLEndY = shoulderY + Math.cos(armL) * limbLength;
        ctx.lineTo(armLEndX, armLEndY);
        ctx.stroke();
        
        // Right arm
        ctx.beginPath();
        ctx.moveTo(x, shoulderY);
        const armREndX = x + Math.sin(armR) * limbLength;
        const armREndY = shoulderY + Math.cos(armR) * limbLength;
        ctx.lineTo(armREndX, armREndY);
        ctx.stroke();
        
        // Left leg
        ctx.beginPath();
        ctx.moveTo(x, hipY);
        ctx.lineTo(x + Math.sin(legL) * limbLength, hipY + Math.cos(legL) * limbLength);
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(x, hipY);
        ctx.lineTo(x + Math.sin(legR) * limbLength, hipY + Math.cos(legR) * limbLength);
        ctx.stroke();
        
        // Return arm end position (for sword attachment)
        return {
            rightHandX: armREndX,
            rightHandY: armREndY,
            leftHandX: armLEndX,
            leftHandY: armLEndY
        };
    },
    
    // Draw sword
    drawSword(x, y, angle, length = 60, swingProgress = 0) {
        const ctx = this.ctx;
        
        // Sword colors
        const bladeColor = '#cccccc';
        const hiltColor = '#8B4513';
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Motion blur effect during swing
        if (swingProgress > 0 && swingProgress < 1) {
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                ctx.strokeStyle = bladeColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -length + i * 5);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        
        // Hilt
        ctx.strokeStyle = hiltColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-10, 5);
        ctx.lineTo(10, 5);
        ctx.stroke();
        
        // Blade
        ctx.strokeStyle = bladeColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(0, -length);
        ctx.stroke();
        
        // Blade edge highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(2, -length + 5);
        ctx.stroke();
        
        // Tip
        ctx.beginPath();
        ctx.moveTo(0, -length);
        ctx.lineTo(-3, -length + 8);
        ctx.moveTo(0, -length);
        ctx.lineTo(3, -length + 8);
        ctx.stroke();
        
        ctx.restore();
        
        // Return tip position for hitbox
        return {
            tipX: x + Math.sin(angle) * -length,
            tipY: y + Math.cos(angle) * -length
        };
    },
    
    // Draw ground
    drawGround(groundY) {
        const ctx = this.ctx;
        
        // Ground line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(this.canvas.width, groundY);
        ctx.stroke();
        
        // Ground fill
        ctx.fillStyle = '#111';
        ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);
    },
    
    // Draw HP bar
    drawHPBar(x, y, hp, maxHP, width = 50, height = 6) {
        const ctx = this.ctx;
        const ratio = Math.max(0, hp / maxHP);
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x - width/2, y, width, height);
        
        // Health
        ctx.fillStyle = ratio > 0.3 ? '#4a4' : '#a44';
        ctx.fillRect(x - width/2, y, width * ratio, height);
        
        // Border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - width/2, y, width, height);
    }
};
