// Level definitions and management

const Levels = {
    current: 1,
    maxLevel: 10,
    
    // Level definitions - each level specifies enemies to spawn
    definitions: {
        1: {
            name: "First Blood",
            enemies: [
                { type: 'red', x: 800 },
                { type: 'red', x: 900 }
            ]
        },
        2: {
            name: "Learning to Dance",
            enemies: [
                { type: 'red', x: 700 },
                { type: 'red', x: 850 },
                { type: 'red', x: 1000 }
            ]
        },
        3: {
            name: "Quick and Dead",
            enemies: [
                { type: 'red', x: 600 },
                { type: 'red', x: 750 },
                { type: 'orange', x: 900 },
                { type: 'red', x: 1050 }
            ]
        },
        4: {
            name: "The Swarm",
            enemies: [
                { type: 'red', x: 500 },
                { type: 'orange', x: 650 },
                { type: 'red', x: 800 },
                { type: 'orange', x: 950 },
                { type: 'red', x: 1100 }
            ]
        },
        5: {
            name: "The Tank",
            enemies: [
                { type: 'red', x: 600 },
                { type: 'purple', x: 800 },
                { type: 'red', x: 1000 }
            ]
        },
        6: {
            name: "No Mercy",
            enemies: [
                { type: 'orange', x: 500 },
                { type: 'red', x: 650 },
                { type: 'purple', x: 800 },
                { type: 'red', x: 950 },
                { type: 'orange', x: 1100 }
            ]
        },
        7: {
            name: "Ranged Threat",
            enemies: [
                { type: 'green', x: 900 },
                { type: 'red', x: 600 },
                { type: 'red', x: 700 },
                { type: 'green', x: 1100 }
            ]
        },
        8: {
            name: "Chaos",
            enemies: [
                { type: 'red', x: 500 },
                { type: 'orange', x: 600 },
                { type: 'purple', x: 750 },
                { type: 'green', x: 900 },
                { type: 'red', x: 1000 },
                { type: 'orange', x: 1100 }
            ]
        },
        9: {
            name: "The Gauntlet",
            enemies: [
                { type: 'red', x: 450 },
                { type: 'red', x: 550 },
                { type: 'orange', x: 650 },
                { type: 'orange', x: 750 },
                { type: 'purple', x: 850 },
                { type: 'green', x: 1000 },
                { type: 'red', x: 1100 },
                { type: 'red', x: 1200 }
            ]
        },
        10: {
            name: "BOSS: The Giant",
            enemies: [
                // Boss is a special big enemy
                { type: 'boss', x: 900 }
            ],
            boss: true
        }
    },
    
    getLevel(num) {
        return this.definitions[num] || this.definitions[1];
    },
    
    spawnEnemies(levelNum, groundY) {
        const level = this.getLevel(levelNum);
        const enemies = [];
        
        for (const def of level.enemies) {
            if (def.type === 'boss') {
                // Create boss enemy (bigger, more HP)
                const boss = new Enemy(def.x, groundY, 'purple');
                boss.hp = 200;
                boss.maxHP = 200;
                boss.damage = 25;
                boss.attackDuration = 1000;
                boss.scale = 1.5;
                boss.isBoss = true;
                enemies.push(boss);
            } else {
                enemies.push(new Enemy(def.x, groundY, def.type));
            }
        }
        
        return enemies;
    },
    
    getLevelName(num) {
        const level = this.getLevel(num);
        return level.name || `Level ${num}`;
    }
};
