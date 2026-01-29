// Combat system - collision detection and damage

const Combat = {
    // Track which enemies have been hit this swing (prevent multi-hit)
    hitThisSwing: new Set(),
    
    update(player, enemies) {
        // Reset hit tracking when swing ends
        if (!player.isSwingActive()) {
            this.hitThisSwing.clear();
        }
        
        // Check player sword vs enemies
        if (player.isSwingActive()) {
            const swordHitbox = player.getSwordHitbox();
            
            for (const enemy of enemies) {
                if (enemy.dead) continue;
                if (this.hitThisSwing.has(enemy)) continue;
                
                // Check if sword line intersects enemy hitbox
                if (this.swordHitsEnemy(swordHitbox, enemy)) {
                    this.hitThisSwing.add(enemy);
                    
                    // Calculate knockback direction
                    const knockbackDir = enemy.x > player.x ? 1 : -1;
                    
                    // Deal damage
                    enemy.takeDamage(25, knockbackDir);
                    
                    // Hitstop on player too
                    player.hitstopFrames = 4;
                }
            }
        }
    },
    
    swordHitsEnemy(sword, enemy) {
        // Enemy hitbox is a circle around their center
        const enemyCenterX = enemy.x;
        const enemyCenterY = enemy.y - 30; // Center of body
        const enemyRadius = 25;
        
        // Check if line segment (sword) intersects circle (enemy)
        return this.lineCircleIntersect(
            sword.x1, sword.y1, sword.x2, sword.y2,
            enemyCenterX, enemyCenterY, enemyRadius
        );
    },
    
    lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
        // Vector from line start to circle center
        const dx = x2 - x1;
        const dy = y2 - y1;
        const fx = x1 - cx;
        const fy = y1 - cy;
        
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - r * r;
        
        let discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return false;
        }
        
        discriminant = Math.sqrt(discriminant);
        
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);
        
        // Check if intersection is within line segment
        if (t1 >= 0 && t1 <= 1) return true;
        if (t2 >= 0 && t2 <= 1) return true;
        
        return false;
    },
    
    // Check if point is inside rectangle
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
};
