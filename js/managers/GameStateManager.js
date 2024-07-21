import * as THREE from 'three';
import { SPAWN_INTERVAL, JEWEL_DROP_CHANCE } from '../utils/Constants.js';
import { Enemy } from '../components/Enemy.js';
import { Jewel } from '../components/Jewel.js';

export class GameStateManager {
    constructor(scene, player, jewelManager) {
        this.scene = scene;
        this.player = player;
        this.jewelManager = jewelManager;
        this.enemies = [];
        this.jewels = [];
        this.particles = [];
        this.lastSpawnTime = 0;
    }

    setPlayer(player) {
        this.player = player;
    }

    update(time, deltaTime) {
        this.updateEnemies(deltaTime);
        this.jewelManager.update(deltaTime);
        this.spawnEnemies(time);
    }

    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.isDefeated) {
                console.log("Removing defeated enemy");
                this.scene.remove(enemy.object);
                this.enemies.splice(i, 1);
                this.jewelManager.tryDropJewel(enemy.getPosition());
            } else {
                enemy.update(deltaTime, this.player.getPosition());
            }
        }
    }

    updateJewels(deltaTime) {
        this.jewels.forEach(jewel => jewel.update(deltaTime));
    }

    spawnEnemies(time) {
        if (time - this.lastSpawnTime > SPAWN_INTERVAL) {
            this.spawnEnemy();
            this.lastSpawnTime = time;
        }
    }

    spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 25;
        const position = new THREE.Vector3(
            Math.cos(angle) * radius,
            1, // Set to 1 to ensure enemy spawns on the ground
            Math.sin(angle) * radius
        );
        const enemy = new Enemy(this.scene, position);
        this.enemies.push(enemy);
    }

    tryDropJewel(position) {
        if (Math.random() < JEWEL_DROP_CHANCE) {
            const jewel = new Jewel(position);
            this.scene.add(jewel);
            this.jewels.push(jewel);
        }
    }

    getEnemies() {
        return this.enemies;
    }
}