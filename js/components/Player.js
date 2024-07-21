import * as THREE from 'three';
import { GRAVITY, JUMP_STRENGTH, PLAYER_SPEED, PLAYER_SIZE, ATTACK_COOLDOWN } from '../utils/Constants.js';

export class Player {
    constructor(scene, particleManager, inventoryManager) {
        this.scene = scene;
        this.particleManager = particleManager;
        this.inventoryManager = inventoryManager;

        // Create player mesh
        const geometry = new THREE.BoxGeometry(PLAYER_SIZE, PLAYER_SIZE * 2, PLAYER_SIZE);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.object = new THREE.Mesh(geometry, material);
        this.object.position.set(0, PLAYER_SIZE, 0);
        this.object.type = 'Player';
        this.scene.add(this.object);

        // Movement properties
        this.moveForward = false;
        this.moveBackward = false;
        this.strafeLeft = false;
        this.strafeRight = false;
        this.velocity = new THREE.Vector3();
        this.isJumping = false;
        this.jumpVelocity = 0;

        // Attacking properties
        this.isAttacking = false;
        this.lastAttackTime = 0;
        this.currentWeapon = {
            name: "Default Blaster",
            cooldown: ATTACK_COOLDOWN,
            damage: 10,
            particleCount: 3
        };

        // Map properties
        this.lastChunkX = null;
        this.lastChunkZ = null;
        this.onChunkChange = null; // Initialize as null, will be set by Game class

        this.createDirectionIndicator();
    }

    createDirectionIndicator() {
        const indicatorGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        this.directionIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.directionIndicator.position.set(0, 0, -PLAYER_SIZE / 2);
        this.object.add(this.directionIndicator);
    }

    update(deltaTime) {
        // Handle horizontal movement
        const moveSpeed = PLAYER_SPEED * deltaTime;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.object.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.object.quaternion);

        const movement = new THREE.Vector3();

        if (this.moveForward) movement.add(forward);
        if (this.moveBackward) movement.sub(forward);
        if (this.strafeLeft) movement.sub(right);
        if (this.strafeRight) movement.add(right);

        if (movement.lengthSq() > 0) {
            movement.normalize().multiplyScalar(moveSpeed);
            this.object.position.add(movement);
        }

        // Handle vertical movement (jumping and gravity)
        if (this.isJumping) {
            this.velocity.y += GRAVITY * deltaTime;
            this.object.position.y += this.velocity.y * deltaTime;

            // Check for landing
            if (this.object.position.y <= PLAYER_SIZE) {
                this.object.position.y = PLAYER_SIZE;
                this.isJumping = false;
                this.velocity.y = 0;
            }
        } else if (this.object.position.y > PLAYER_SIZE) {
            // Apply gravity if player is above ground level
            this.velocity.y += GRAVITY * deltaTime;
            this.object.position.y += this.velocity.y * deltaTime;

            if (this.object.position.y <= PLAYER_SIZE) {
                this.object.position.y = PLAYER_SIZE;
                this.velocity.y = 0;
            }
        }

        // Ensure player doesn't go below ground
        if (this.object.position.y < PLAYER_SIZE) {
            this.object.position.y = PLAYER_SIZE;
        }

        this.checkChunkChange();
    }

    checkChunkChange() {
        const currentChunkX = Math.floor(this.object.position.x / 10);
        const currentChunkZ = Math.floor(this.object.position.z / 10);

        if (currentChunkX !== this.lastChunkX || currentChunkZ !== this.lastChunkZ) {
            this.lastChunkX = currentChunkX;
            this.lastChunkZ = currentChunkZ;
            if (this.onChunkChange) {
                this.onChunkChange(currentChunkX, currentChunkZ);
            }
        }
    }

    startJump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocity.y = JUMP_STRENGTH;
        }
    }

    attack(time) {
        if (!this.isAttacking) return;
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime < this.currentWeapon.cooldown) return;

        this.lastAttackTime = currentTime;

        const particleCount = this.currentWeapon.particleCount;
        const spread = Math.PI / 6; // Reduced spread for tighter grouping

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / (particleCount - 1) - 0.5) * spread;
            const direction = new THREE.Vector3(
                Math.sin(angle),
                0.05, // Slightly reduced upward component for lower trajectory
                -Math.cos(angle)
            ).applyQuaternion(this.object.quaternion);

            const particlePosition = this.object.position.clone();
            particlePosition.y += 0.2; // Start particles slightly above player center

            const damage = 10; // Ensure this is set to 10
            this.particleManager.createParticle(particlePosition, direction, damage);
        }
    }

    startAttack() {
        this.isAttacking = true;
    }

    stopAttack() {
        this.isAttacking = false;
    }

    rotate(angle) {
        this.object.rotation.y += angle;
    }

    getPosition() {
        return this.object.position;
    }

    setPosition(x, y, z) {
        this.object.position.set(x, y + PLAYER_SIZE, z);
        // console.log("Player position set to:", this.object.position);
    }

    setParticleManager(particleManager) {
        this.particleManager = particleManager;
    }

    getRotation() {
        return this.object.quaternion;
    }

    setRotation(x, y, z) {
        this.object.rotation.set(x, y, z);
    }

    toggleInventory() {
        if (this.inventoryManager) {
            this.inventoryManager.toggleInventory();
        }
    }
}