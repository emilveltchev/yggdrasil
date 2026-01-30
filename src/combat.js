// Combat system - collision detection and damage

const Combat = {
    hitThisSwing: new Set(),
    
    update(player, enemies) {
        // Reset hit tracking when swing ends
        if (!player.isSwingActive()) {
            this.hitThisSwing.clear();
        }
        
        // Check player sword vs enemies
        if (player.isSwingActive()) {
            const swordHitbox = player.getSwordHitbox();
            const damage = player.getCurrentDamage();
            const knockback = player.getCurrentKnockback();
            const isLaunch = player.isLaunchAttack();
            const isAOE = player.isAOE();
            
            for (const enemy of enemies) {
                if (enemy.dead) continue;
                if (this.hitThisSwing.has(enemy)) continue;
                
                let hit = false;
                
                if (isAOE) {
                    // AOE attack - check distance from player
                    const dist = Math.abs(enemy.x - player.x);
                    if (dist < swordHitbox.aoeRadius && player.grounded) {
                        hit = true;
                    }
                } else {
                    // Normal sword hitbox
                    hit = this.swordHitsEnemy(swordHitbox, enemy);
                }
                
                if (hit) {
                    this.hitThisSwing.add(enemy);
                    
                    const knockbackDir = enemy.x > player.x ? 1 : -1;
                    
                    // Apply damage with attack properties
                    enemy.takeDamage(damage, knockbackDir * knockback / 8, isLaunch);
                    
                    // Hitstop on player
                    player.hitstopFrames = isLaunch ? 8 : 5;
                    
                    // Slow-mo effect for kills
                    if (enemy.hp <= 0) {
                        player.hitstopFrames = 12;
                    }
                }
            }
        }
    },
    
    swordHitsEnemy(sword, enemy) {
        const enemyCenterX = enemy.x;
        const enemyCenterY = enemy.y - 30 * enemy.scale;
        const enemyRadius = 25 * enemy.scale;
        
        return this.lineCircleIntersect(
            sword.x1, sword.y1, sword.x2, sword.y2,
            enemyCenterX, enemyCenterY, enemyRadius
        );
    },
    
    lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const fx = x1 - cx;
        const fy = y1 - cy;
        
        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - r * r;
        
        let discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) return false;
        
        discriminant = Math.sqrt(discriminant);
        
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);
        
        if (t1 >= 0 && t1 <= 1) return true;
        if (t2 >= 0 && t2 <= 1) return true;
        
        return false;
    }
};
