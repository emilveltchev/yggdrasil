// Input handling - keyboard and mouse

const Input = {
    keys: {},
    mouse: { x: 0, y: 0, down: false, clicked: false },
    
    init(canvas) {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            // Prevent scrolling with arrow keys/space
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse position
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        // Mouse clicks
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.mouse.clicked = true;
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.down = false;
            }
        });
    },
    
    // Call at end of frame to reset single-frame states
    endFrame() {
        this.mouse.clicked = false;
    },
    
    // Movement helpers
    get moveX() {
        let x = 0;
        if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
        if (this.keys['d'] || this.keys['arrowright']) x += 1;
        return x;
    },
    
    get moveY() {
        let y = 0;
        if (this.keys['w'] || this.keys['arrowup']) y -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) y += 1;
        return y;
    },
    
    get dash() {
        return this.keys[' '];
    }
};
