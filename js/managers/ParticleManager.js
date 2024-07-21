import * as THREE from 'three';
import { 
    PARTICLE_SPEED, PARTICLE_DISTANCE, BOUNCE_FACTOR, MAX_BOUNCES, 
    PARTICLE_GRAVITY, PARTICLE_SIZE, PARTICLE_COLOR, GLOW_COLOR, 
    CLOUD_COLOR, GLOW_SIZE, PARTICLE_FLOOR 
} from '../utils/Constants.js';

export class ParticleManager {
    constructor(scene, camera, floatingTextSystem, gameStateManager) {
        this.scene = scene;
        this.camera = camera;
        this.floatingTextSystem = floatingTextSystem;
        this.gameStateManager = gameStateManager;
        this.particles = [];
        this.cloudTexture = null;
        this.loadCloudTexture();
        this.collisionCheckInterval = 100; // Check collisions every 100ms
        this.lastCollisionCheck = 0;
    }

    loadCloudTexture() {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('assets/newcloud.png', (texture) => {
            this.cloudTexture = texture;
            this.cloudTexture.minFilter = THREE.LinearFilter;
        });
    }

    createParticle(position, direction, damage) {
        const particle = new THREE.Group();

        // Create the main particle (bright white orb)
        const geometry = new THREE.SphereGeometry(PARTICLE_SIZE, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: PARTICLE_COLOR,
            transparent: true,
            opacity: 1
        });
        const core = new THREE.Mesh(geometry, material);
        particle.add(core);

        // Create the glow effect
        const glowGeometry = new THREE.SphereGeometry(PARTICLE_SIZE * GLOW_SIZE, 16, 16);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { type: "c", value: new THREE.Color(GLOW_COLOR) },
                viewVector: { type: "v3", value: this.camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                    vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
                    intensity = pow( dot(normalize(viewVector), actual_normal), 4.0 );
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4( glow, 0.5 );
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        particle.add(glowMesh);

        particle.position.copy(position);
        particle.userData = {
            velocity: direction.normalize().multiplyScalar(PARTICLE_SPEED),
            distanceTraveled: 0,
            maxDistance: PARTICLE_DISTANCE,
            bounces: 0,
            cloudParticles: [],
            hitEnemies: new Set(),
            damage: damage,
            uuid: THREE.MathUtils.generateUUID()
        };

        this.scene.add(particle);
        this.particles.push(particle);
    }

    createCloudParticle(position) {
        if (!this.cloudTexture) {
            console.warn("Cloud texture not loaded yet");
            return null;
        }

        const cloudMaterial = new THREE.SpriteMaterial({
            map: this.cloudTexture,
            color: CLOUD_COLOR,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            alphaTest: 0.1
        });

        const cloudParticle = new THREE.Sprite(cloudMaterial);
        cloudParticle.position.copy(position).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        ));
        
        const scale = PARTICLE_SIZE * (0.5 + Math.random() * 1.5);
        cloudParticle.scale.set(scale, scale, scale);

        return cloudParticle;
    }

    update(deltaTime) {
        if (!this.gameStateManager) {
            console.error("GameStateManager is not set in ParticleManager");
            return;
        }

        const enemies = this.gameStateManager.getEnemies();
        if (!enemies) {
            console.error("Unable to get enemies from GameStateManager");
            return;
        }
        
        const currentTime = performance.now();
        const shouldCheckCollisions = currentTime - this.lastCollisionCheck > this.collisionCheckInterval;
        
        if (shouldCheckCollisions) {
            this.lastCollisionCheck = currentTime;
        }
        
        this.particles = this.particles.filter(particle => {
            const oldPosition = particle.position.clone();
            const movement = particle.userData.velocity.clone().multiplyScalar(deltaTime);
            particle.position.add(movement);

            // Apply gravity
            particle.userData.velocity.y += PARTICLE_GRAVITY * deltaTime;

            // Check for ground collision and bounce
            if (particle.position.y <= PARTICLE_FLOOR && particle.userData.bounces < MAX_BOUNCES) {
                particle.position.y = PARTICLE_FLOOR;
                particle.userData.velocity.y = -particle.userData.velocity.y * BOUNCE_FACTOR;
                particle.userData.velocity.x *= 0.9;
                particle.userData.velocity.z *= 0.9;
                particle.userData.bounces++;
            }

            // Create new cloud particles
            if (Math.random() < 0.5 && this.cloudTexture) {
                const cloudParticle = this.createCloudParticle(particle.position);
                if (cloudParticle) {
                    this.scene.add(cloudParticle);
                    particle.userData.cloudParticles.push({
                        sprite: cloudParticle,
                        life: 1.0,
                        initialScale: cloudParticle.scale.x
                    });
                }
            }

            // Update existing cloud particles
            particle.userData.cloudParticles = particle.userData.cloudParticles.filter(cloudParticle => {
                cloudParticle.life -= deltaTime;
                if (cloudParticle.life <= 0) {
                    this.scene.remove(cloudParticle.sprite);
                    return false;
                }

                const lifeProgress = 1 - cloudParticle.life;
                cloudParticle.sprite.material.opacity = 0.4 * (1 - lifeProgress * lifeProgress);
                
                const scale = cloudParticle.initialScale * (1 + lifeProgress * 0.5);
                cloudParticle.sprite.scale.set(scale, scale, scale);

                cloudParticle.sprite.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime * 0.1));
                return true;
            });

            if (shouldCheckCollisions) {
                this.checkCollisions(particle, enemies);
            }

            // Calculate distance traveled and check for particle expiration
            particle.userData.distanceTraveled += oldPosition.distanceTo(particle.position);
            if (particle.userData.distanceTraveled >= particle.userData.maxDistance || particle.userData.bounces >= MAX_BOUNCES) {
                this.scene.remove(particle);
                particle.userData.cloudParticles.forEach(cp => this.scene.remove(cp.sprite));
                return false;
            }

            // Update glow effect
            if (particle.children.length > 1) {
                const glowMesh = particle.children[1];
                glowMesh.material.uniforms.viewVector.value = 
                    new THREE.Vector3().subVectors(this.camera.position, particle.position);
                glowMesh.material.uniforms.viewVector.value.normalize();
            }

            // Fade out the particle and glow
            const lifeProgress = particle.userData.distanceTraveled / particle.userData.maxDistance;
            particle.children[0].material.opacity = 1 - lifeProgress;
            if (particle.children.length > 1) {
                particle.children[1].material.opacity = 0.5 * (1 - lifeProgress);
            }

            return true;
        });
    }

    checkCollisions(particle, enemies) {
        enemies.forEach(enemy => {
            if (!enemy.isDefeated && !particle.userData.hitEnemies.has(enemy.id) && this.checkCollision(particle, enemy)) {
                this.handleCollision(particle, enemy);
            }
        });
    }

    checkCollision(particle, enemy) {
        const particlePos = particle.position;
        const enemyPos = enemy.getPosition();
        const distance = particlePos.distanceTo(enemyPos);
        const collisionThreshold = PARTICLE_SIZE + 1; // Adjust this value as needed
        return distance < collisionThreshold;
    }

    handleCollision(particle, enemy) {
        console.log(`Particle ${particle.userData.uuid} collided with enemy ${enemy.id}. Applying ${particle.userData.damage} damage.`);
        const enemyDefeated = enemy.takeDamage(particle.userData.damage, particle.userData.uuid);
        this.showDamageNumber(enemy.getPosition(), particle.userData.damage);
        particle.userData.hitEnemies.add(enemy.id);
        console.log(`Particle ${particle.userData.uuid} has now hit enemies: ${Array.from(particle.userData.hitEnemies)}`);
        
        if (enemyDefeated) {
            console.log(`Enemy ${enemy.id} defeated by particle ${particle.userData.uuid}!`);
            enemy.isDefeated = true;
        }
    }

    showDamageNumber(position, damage) {
        if (this.floatingTextSystem) {
            this.floatingTextSystem.createText(position, damage.toString());
        } else {
            console.error("FloatingTextSystem is not initialized in ParticleManager");
        }
    }
}