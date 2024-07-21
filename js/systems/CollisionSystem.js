import * as THREE from 'three';

export class CollisionSystem {
    checkCollision(obj1, obj2) {
        const box1 = new THREE.Box3().setFromObject(obj1);
        const box2 = new THREE.Box3().setFromObject(obj2);
        return box1.intersectsBox(box2);
    }

    update(player, enemies, particles, jewels) {
        // Check player-enemy collisions
        enemies.forEach(enemy => {
            if (this.checkCollision(player.object, enemy.object)) {
                // Handle player-enemy collision
            }
        });

        // Check particle-enemy collisions
        particles.forEach(particle => {
            enemies.forEach(enemy => {
                if (this.checkCollision(particle, enemy.object)) {
                    enemy.takeDamage(particle.userData.damage);
                }
            });
        });

        // Check player-jewel collisions
        jewels.forEach(jewel => {
            if (this.checkCollision(player.object, jewel)) {
                // Handle jewel pickup
            }
        });
    }
}