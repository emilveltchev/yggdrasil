// Main game loop and state management

const Game = {
    canvas: null,
    ctx: null,
    groundY: 550,
    
    // Game state
    state: 'title', // title, playing, levelComplete, gameOver, victory
    currentLevel: 1,
    enemies: [],
    
    // Timing
    lastTime: 0,
    deltaTime: 0,
    
    // Level transition
    transitionTimer: 0,
    transitionText: '',
    
    init() {
        const debug = document.getElementById('debug');
        debug.textContent = 'Initializing...';
        
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        
        debug.textContent = 'Canvas: ' + (this.canvas ? 'OK' : 'FAIL');
        
        Render.init(this.canvas);
        Input.init(this.canvas);
        
        debug.textContent = 'Render/Input: OK';
        
        // Start game loop
        this.lastTime = performance.now();
        this.frameCount = 0;
        requestAnimationFrame((t) => this.loop(t));
        
        // Start at title
        this.state = 'title';
        debug.textContent = 'Game started - click to play';
    },
    
    loop(timestamp) {
        try {
            // Calculate delta time
            this.deltaTime = Math.min(timestamp - this.lastTime, 50); // Cap at 50ms
            this.lastTime = timestamp;
            
            // Update frame counter
            this.frameCount++;
            if (this.frameCount % 60 === 0) {
                const aliveEnemies = this.enemies.filter(e => !e.dead).length;
                document.getElementById('debug').textContent = 
                    'v4 | ' + this.state + 
                    ' | Enemies: ' + aliveEnemies +
                    ' | Combo: ' + Player.comboCount;
            }
            
            // Update
            this.update(this.deltaTime);
            
            // Render
            this.render();
            
            // End frame
            Input.endFrame();
            
            // Next frame
            requestAnimationFrame((t) => this.loop(t));
        } catch(e) {
            console.error('Game loop error:', e);
            document.getElementById('debug').textContent = 'ERROR: ' + e.message;
        }
    },
    
    update(dt) {
        switch (this.state) {
            case 'title':
                if (Input.mouse.clicked || Input.keys[' ']) {
                    this.startGame();
                }
                break;
                
            case 'playing':
                this.updatePlaying(dt);
                break;
                
            case 'levelComplete':
                this.transitionTimer -= dt;
                if (this.transitionTimer <= 0) {
                    this.nextLevel();
                }
                break;
                
            case 'gameOver':
                if (Input.mouse.clicked || Input.keys[' ']) {
                    this.startGame();
                }
                break;
                
            case 'victory':
                if (Input.mouse.clicked || Input.keys[' ']) {
                    this.state = 'title';
                }
                break;
        }
    },
    
    updatePlaying(dt) {
        // Update player
        Player.update(dt, this.groundY, Render.canvas.width);
        
        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(dt, Player, this.groundY, Render.canvas.width);
        }
        
        // Combat checks
        Combat.update(Player, this.enemies);
        
        // Update blood
        Blood.update(this.groundY);
        
        // Update projectiles
        Projectiles.update(dt, Player, this.groundY);
        
        // Update screen shake
        Render.updateShake();
        
        // Check for player death
        if (Player.hp <= 0) {
            this.state = 'gameOver';
        }
        
        // Check for level complete (all enemies dead)
        const allDead = this.enemies.every(e => e.dead && e.deathTimer <= 0);
        if (allDead && this.enemies.length > 0) {
            this.levelComplete();
        }
        
        // Update UI
        document.getElementById('hp').textContent = `HP: ${Math.max(0, Player.hp)}`;
        document.getElementById('level').textContent = `Level: ${this.currentLevel}`;
    },
    
    render() {
        Render.clear();
        Render.applyShake();
        
        switch (this.state) {
            case 'title':
                this.renderTitle();
                break;
                
            case 'playing':
            case 'levelComplete':
                this.renderPlaying();
                break;
                
            case 'gameOver':
                this.renderPlaying();
                this.renderGameOver();
                break;
                
            case 'victory':
                this.renderVictory();
                break;
        }
        
        Render.removeShake();
    },
    
    renderTitle() {
        const ctx = Render.ctx;
        const cx = Render.canvas.width / 2;
        const cy = Render.canvas.height / 2;
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YGGDRASIL', cx, cy - 50);
        
        // Subtitle
        ctx.font = '24px Arial';
        ctx.fillStyle = '#888888';
        ctx.fillText('A stick figure sword fighting game', cx, cy + 10);
        
        // Instructions
        ctx.font = '20px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText('WASD to move • Mouse to aim • Click to swing • Space to dash', cx, cy + 60);
        
        // Start prompt
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Click or press SPACE to start', cx, cy + 120);
        
        // Draw a stick figure
        Render.drawStickFigure({
            x: cx,
            y: cy + 250,
            color: '#ffffff',
            scale: 1.5,
            limbs: { armL: -0.3, armR: 0.8, legL: -0.2, legR: 0.2 }
        });
        Render.drawSword(cx + 50, cy + 200, 0.5, 80, 0);
    },
    
    renderPlaying() {
        // Draw ground
        Render.drawGround(this.groundY);
        
        // Draw blood (behind characters)
        Blood.draw(Render.ctx);
        
        // Draw projectiles
        Projectiles.draw(Render.ctx);
        
        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw();
        }
        
        // Draw player
        Player.draw();
        
        // Level complete overlay
        if (this.state === 'levelComplete') {
            const ctx = Render.ctx;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, Render.canvas.width, Render.canvas.height);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.transitionText, Render.canvas.width / 2, Render.canvas.height / 2);
        }
    },
    
    renderGameOver() {
        const ctx = Render.ctx;
        
        ctx.fillStyle = 'rgba(100, 0, 0, 0.7)';
        ctx.fillRect(0, 0, Render.canvas.width, Render.canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YOU DIED', Render.canvas.width / 2, Render.canvas.height / 2 - 30);
        
        ctx.font = '24px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Reached Level ${this.currentLevel}`, Render.canvas.width / 2, Render.canvas.height / 2 + 20);
        ctx.fillText('Click or press SPACE to retry', Render.canvas.width / 2, Render.canvas.height / 2 + 70);
    },
    
    renderVictory() {
        const ctx = Render.ctx;
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, Render.canvas.width, Render.canvas.height);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY', Render.canvas.width / 2, Render.canvas.height / 2 - 50);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Arial';
        ctx.fillText('You have conquered Yggdrasil', Render.canvas.width / 2, Render.canvas.height / 2 + 10);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#888888';
        ctx.fillText('Click to return to title', Render.canvas.width / 2, Render.canvas.height / 2 + 70);
    },
    
    startGame() {
        this.currentLevel = 1;
        Blood.clear();
        Projectiles.clear();
        
        // Initialize player
        Player.init(200, this.groundY);
        
        // Spawn enemies for level 1
        this.enemies = Levels.spawnEnemies(this.currentLevel, this.groundY);
        
        // Go directly to playing
        this.state = 'playing';
    },
    
    levelComplete() {
        if (this.currentLevel >= Levels.maxLevel) {
            this.state = 'victory';
            return;
        }
        
        this.state = 'levelComplete';
        this.transitionText = `Level ${this.currentLevel} Complete!`;
        this.transitionTimer = 2000;
    },
    
    nextLevel() {
        this.currentLevel++;
        
        // Heal player a bit between levels
        Player.hp = Math.min(Player.maxHP, Player.hp + 20);
        
        // Reset player position
        Player.x = 200;
        Player.swingState = 'ready';
        
        // Spawn new enemies
        this.enemies = Levels.spawnEnemies(this.currentLevel, this.groundY);
        
        // Go to playing state
        this.state = 'playing';
    }
};

// Start the game when page loads
window.addEventListener('load', () => {
    console.log('Window loaded, starting game...');
    try {
        Game.init();
        console.log('Game initialized successfully');
    } catch(e) {
        console.error('Game init error:', e);
        alert('Game error: ' + e.message);
    }
});
