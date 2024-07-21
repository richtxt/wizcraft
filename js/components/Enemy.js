import * as THREE from 'three';
let enemyIdCounter = 0; // Define enemyIdCounter here

export class Enemy {
    constructor(scene, position) {
        this.id = enemyIdCounter++;
        this.scene = scene;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.isDefeated = false;
        this.hitByParticles = new Set(); // Set to keep track of particles that have hit this enemy

        // Create enemy mesh
        this.object = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 1),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.object.position.copy(position);
        scene.add(this.object);

        this.createHealthBar();
    }

    createHealthBar() {
        const healthBarGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBar.position.y = 1.2; // Position above the enemy
        this.object.add(this.healthBar);
    }

    update(deltaTime, playerPosition) {
        if (playerPosition && playerPosition.isVector3) {
            const speed = 1;
            const direction = new THREE.Vector3()
                .subVectors(playerPosition, this.object.position)
                .normalize();
            this.object.position.add(direction.multiplyScalar(speed * deltaTime));
            this.object.lookAt(playerPosition);
        }
        const currentTime = performance.now() / 1000;
        if (this.isInvulnerable && currentTime - this.lastHitTime > this.invulnerabilityDuration) {
            this.isInvulnerable = false;
        }
    }

    takeDamage(amount, particleUUID) {
        if (this.isDefeated) {
            console.log(`Damage not applied to enemy ${this.id}. Already defeated.`);
            return false;
        }

        if (this.hitByParticles.has(particleUUID)) {
            console.log(`Damage not applied to enemy ${this.id}. Already hit by particle ${particleUUID}.`);
            return false;
        }

        this.hitByParticles.add(particleUUID); // Record that this enemy has been hit by this particle

        this.health = Math.max(0, this.health - amount);
        console.log(`Enemy ${this.id} took ${amount} damage from particle ${particleUUID}. Health: ${this.health}/${this.maxHealth}`);
        this.updateHealthBar();

        if (this.health <= 0) {
            console.log(`Enemy ${this.id} defeated!`);
            this.isDefeated = true;
            return true;
        }
        return false;
    }
    
    updateHealthBar() {
        const healthPercentage = this.health / this.maxHealth;
        this.healthBar.scale.x = healthPercentage;
        // Change color from green to red as health decreases
        this.healthBar.material.color.setRGB(1 - healthPercentage, healthPercentage, 0);
    }

    getPosition() {
        return this.object.position;
    }
}