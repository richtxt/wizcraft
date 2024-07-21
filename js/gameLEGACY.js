import * as THREE from 'three';
let scene, camera, renderer, player, ground, enemies = [];
let playerBox;
let moveForward = false, moveBackward = false, strafeLeft = false, strafeRight = false, rotateLeft = false, rotateRight = false;
let jumping = false, jumpVelocity = 0, gravity = -9.8, jumpStrength = 5;
let particles = [];
let jewels = [];
let lastSpawnTime = 0;
const spawnInterval = 3000; // spawn every 3 seconds
let lastAttackTime = 0;
let attackCooldown = 1000; // 1000 milliseconds (1 second) between attacks by default
let currentWeapon = {
    name: "Default Blaster",
    cooldown: 1000,
    damage: 10,
    particleCount: 3
};
let mouseY = 0;
let mouseX = 0;
let targetRotation = 0;
let isPointerLocked = false;
let cloudTexture;
const mouseSensitivity = 0.002; // Adjust this value to change mouse sensitivity
let isAttacking = false;
const PARTICLE_SPEED = 15; // Increased speed for a flatter initial trajectory
const PARTICLE_DISTANCE = 10;
const BOUNCE_FACTOR = 0.5; // Reduced for lower bounces
const MAX_BOUNCES = 5;
const PARTICLE_GRAVITY = -25; // Increased gravity for quicker falling
const PARTICLE_SIZE = 0.2; // Increased core particle size
const PARTICLE_COLOR = 0xffffff; // Bright white for the core
const GLOW_COLOR = 0x87CEFA; // Light sky blue color
const CLOUD_COLOR = 0xADD8E6; // A slightly different shade of light blue for variation
const GLOW_SIZE = 4; // Larger glow
const PARTICLE_FLOOR = 0.2; // Slightly higher minimum height above the ground
const JEWEL_DROP_CHANCE = 0.3;
const JEWEL_PICKUP_DISTANCE = 2;
const JEWEL_FLOAT_SPEED = 0.003;
const JEWEL_ROTATE_SPEED = 1;


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Player
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(geometry, material);
    player.position.y = 0.5;
    scene.add(player);

    // Add a visual indicator for player direction
    const indicatorGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.z = -0.5;  // Place it at the front of the player
    player.add(indicator);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    scene.add(ground);

    // Initial camera position
    updateCameraPosition();
    loadCloudTexture();

    // AABB box for player
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    playerBox = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(playerBox);
}

function setupEventListeners() {
    document.getElementById('jumpButton')?.addEventListener('click', startJump);
    document.getElementById('attackButton')?.addEventListener('mousedown', startAttack);
    document.getElementById('attackButton')?.addEventListener('mouseup', stopAttack);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });
}

function onMouseMove(event) {
    if (isPointerLocked) {
        // Add minus sign to reverse the direction
        let movementX = -(event.movementX || event.mozMovementX || event.webkitMovementX || 0);
        
        player.rotation.y += movementX * mouseSensitivity;

        // Normalize the rotation
        player.rotation.y = player.rotation.y % (Math.PI * 2);
        if (player.rotation.y < 0) {
            player.rotation.y += Math.PI * 2;
        }
    }
}

function onMouseDown(event) {
    if (event.button === 0) { // Left mouse button
        if (!isPointerLocked) {
            renderer.domElement.requestPointerLock();
        }
        startAttack();
    }
}

function onMouseUp(event) {
    if (event.button === 0) { // Left mouse button
        stopAttack();
    }
}

function onPointerLockChange() {
    isPointerLocked = document.pointerLockElement === renderer.domElement;
}

function initializeInventory() {
    updateInventoryDisplay();
    setupInventoryListeners();
}

function spawnEnemy() {
    const enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 25; // Half of the ground size
    enemy.position.set(
        Math.cos(angle) * radius,
        1, // Half of the enemy height
        Math.sin(angle) * radius
    );
    
    enemy.health = 100; // Full health

    // Health bar
    const healthBarGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
    const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
    healthBar.position.y = 1.2; // Slightly above the enemy
    enemy.add(healthBar);
    enemy.healthBar = healthBar;

    scene.add(enemy);
    enemies.push(enemy);
}

function updateCameraPosition() {
    const cameraOffset = new THREE.Vector3(0, 3, 8);
    camera.position.copy(player.position).add(cameraOffset.applyQuaternion(player.quaternion));
    
    const targetY = player.position.y + (window.innerHeight / 3) * (camera.position.y - player.position.y) / window.innerHeight;
    
    const lookAtPoint = new THREE.Vector3(player.position.x, targetY, player.position.z);
    camera.lookAt(lookAtPoint);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            strafeLeft = true;
            break;
        case 'KeyD':
            strafeRight = true;
            break;
        case 'Space':
            startJump();
            break;
        case 'ControlLeft':
            case 'ControlRight':
                startAttack();
                break;
        }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            strafeLeft = false;
            break;
        case 'KeyD':
            strafeRight = false;
            break;
        case 'ControlLeft':
            case 'ControlRight':
                stopAttack();
                break;
        }
}

function startJump() {
    if (!jumping) {
        jumping = true;
        jumpVelocity = jumpStrength;
    }
}

function startAttack() {
    isAttacking = true;
}

function stopAttack() {
    isAttacking = false;
}

function attack(time) {
    if (!isAttacking) return;
    const currentTime = Date.now();
    if (currentTime - lastAttackTime < attackCooldown) return;

    lastAttackTime = currentTime;

    const particleCount = currentWeapon.particleCount;
    const spread = Math.PI / 6; // Reduced spread for tighter grouping

    for (let i = 0; i < particleCount; i++) {
        const angle = (i / (particleCount - 1) - 0.5) * spread;
        const direction = new THREE.Vector3(
            Math.sin(angle),
            0.05, // Significantly reduced upward component for lower trajectory
            -Math.cos(angle)
        ).applyQuaternion(player.quaternion);

        const particle = createParticle();
        particle.position.copy(player.position);
        particle.position.y += 0.2; // Start particles only slightly above player center
        particle.userData.velocity = direction.normalize().multiplyScalar(PARTICLE_SPEED);
        particle.userData.damage = currentWeapon.damage;

        scene.add(particle);
        particles.push(particle);
    }
}

function loadCloudTexture() {
    const textureLoader = new THREE.TextureLoader();
    cloudTexture = textureLoader.load('assets/newcloud.png'); // Make sure this is a PNG with transparency
    cloudTexture.minFilter = THREE.LinearFilter; // This can help with image quality
}

function useJewel() {
    if (inventory.useJewel()) {
        // Upgrade attack
        attackCooldown *= 0.95; // Reduce cooldown by 5%
        console.log('Attack upgraded! New cooldown:', attackCooldown);
    }
}

class Jewel extends THREE.Group {
    constructor(position) {
        super();

        // Create emerald shape
        const emeraldShape = new THREE.Shape();
        emeraldShape.moveTo(0, 1);
        emeraldShape.lineTo(0.5, 0.5);
        emeraldShape.lineTo(0.5, -0.5);
        emeraldShape.lineTo(0, -1);
        emeraldShape.lineTo(-0.5, -0.5);
        emeraldShape.lineTo(-0.5, 0.5);
        emeraldShape.lineTo(0, 1);

        const extrudeSettings = {
            steps: 2,
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 3
        };

        const geometry = new THREE.ExtrudeGeometry(emeraldShape, extrudeSettings);

        // Gold material with improved settings
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.1,
            emissive: 0x996515,
            emissiveIntensity: 0.2
        });

        const emerald = new THREE.Mesh(geometry, material);
        emerald.scale.set(0.15, 0.15, 0.15); // Reduced size
        emerald.rotation.x = -Math.PI / 2; // Lay flat on the ground

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0xFFD700) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    gl_FragColor = vec4(glowColor, 1.0) * intensity;
                }
            `,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.y = 0.05; // Slightly above the ground

        // Point light for local illumination
        const light = new THREE.PointLight(0xFFD700, 1, 1);
        light.position.set(0, 0.1, 0);

        this.add(emerald, glowMesh, light);
        this.position.copy(position);
        this.position.y = 0.05; // Slightly above the ground
    }

    update(deltaTime) {
        // Subtle pulsing of the glow
        const glowMesh = this.children[1];
        glowMesh.material.uniforms.glowColor.value.setHSL(0.1, 1, 0.5 + 0.3 * Math.sin(Date.now() * 0.003));
    }
}

function createJewel(position) {
    const jewel = new Jewel(position);
    scene.add(jewel);
    jewels.push(jewel);
    console.log("Jewel created. Total jewels:", jewels.length);
    return jewel;
}

function tryDropJewel(position) {
    if (Math.random() < JEWEL_DROP_CHANCE) {
        createJewel(position);
        return true;
    }
    return false;
}

function updateJewels(deltaTime) {
    for (let i = jewels.length - 1; i >= 0; i--) {
        const jewel = jewels[i];
        jewel.update(deltaTime);

        // Check if player is close to the jewel
        if (player.position.distanceTo(jewel.position) < JEWEL_PICKUP_DISTANCE) {
            if (inventory.addJewel()) {
                console.log("Jewel collected!");
                scene.remove(jewel);
                jewels.splice(i, 1);
            }
        }
    }
}

function createCloudParticle(position) {
    const cloudMaterial = new THREE.SpriteMaterial({
        map: cloudTexture,
        color: CLOUD_COLOR,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        alphaTest: 0.1 // Add this line
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

function createParticle() {
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
            viewVector: { type: "v3", value: camera.position }
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

    // Add properties to the particle group
    particle.userData = {
        velocity: new THREE.Vector3(),
        distanceTraveled: 0,
        maxDistance: PARTICLE_DISTANCE,
        bounces: 0,
        cloudParticles: []
    };

    return particle;
}

function updateParticles(deltaTime) {
    particles = particles.filter(particle => {
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
        if (Math.random() < 0.5) {  // Increased probability for denser clouds
            const cloudParticle = createCloudParticle(particle.position);
            scene.add(cloudParticle);
            particle.userData.cloudParticles.push({
                sprite: cloudParticle,
                life: 1.0,
                initialScale: cloudParticle.scale.x
            });
        }

        // Update existing cloud particles
        particle.userData.cloudParticles = particle.userData.cloudParticles.filter(cloudParticle => {
            cloudParticle.life -= deltaTime;
            if (cloudParticle.life <= 0) {
                scene.remove(cloudParticle.sprite);
                return false;
            }

            const lifeProgress = 1 - cloudParticle.life;
            cloudParticle.sprite.material.opacity = 0.4 * (1 - lifeProgress * lifeProgress); // Quadratic fade-out
            
            const scale = cloudParticle.initialScale * (1 + lifeProgress * 0.5); // Grow slightly over time
            cloudParticle.sprite.scale.set(scale, scale, scale);

            cloudParticle.sprite.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime * 0.1));
            return true;
        });

        // Calculate actual distance traveled
        particle.userData.distanceTraveled += oldPosition.distanceTo(particle.position);

        // Check if particle has traveled its maximum distance
        if (particle.userData.distanceTraveled >= particle.userData.maxDistance || particle.userData.bounces >= MAX_BOUNCES) {
            scene.remove(particle);
            particle.userData.cloudParticles.forEach(cp => scene.remove(cp.sprite));
            return false;
        }

        // Update glow effect
        if (particle.children.length > 1) {
            const glowMesh = particle.children[1];
            glowMesh.material.uniforms.viewVector.value = 
                new THREE.Vector3().subVectors(camera.position, particle.position);
            glowMesh.material.uniforms.viewVector.value.normalize();
        }

        // Fade out the particle and glow
        const lifeProgress = particle.userData.distanceTraveled / particle.userData.maxDistance;
        particle.children[0].material.opacity = 1 - lifeProgress;
        if (particle.children.length > 1) {
            particle.children[1].material.opacity = 0.5 * (1 - lifeProgress);
        }

        // Check collision with enemies
        enemies.forEach(enemy => {
            if (checkCollision(particle, enemy)) {
                // Apply damage to enemy but don't remove the particle
                enemy.health -= particle.userData.damage;
                updateHealthBar(enemy);
            }
        });

        return true;
    });
}

function updateHealthBar(enemy) {
    const healthPercent = Math.max(enemy.health / 100, 0);
    enemy.healthBar.scale.x = healthPercent;
    enemy.healthBar.material.color.setHSL(healthPercent / 3, 1, 0.5);
    
    if (enemy.health <= 0) {
        console.log("Enemy health reached zero!");
        // The actual removal of the enemy is handled in updateEnemies
    }
}

function updatePlayer(deltaTime) {
    const speed = 5;
    const oldPosition = player.position.clone();

    // Movement
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(player.quaternion);

    if (moveForward) player.position.add(forward.multiplyScalar(speed * deltaTime));
    if (moveBackward) player.position.sub(forward.multiplyScalar(speed * deltaTime));
    if (strafeLeft) player.position.sub(right.multiplyScalar(speed * deltaTime));
    if (strafeRight) player.position.add(right.multiplyScalar(speed * deltaTime));

    // Apply jump physics
    if (jumping) {
        player.position.y += jumpVelocity * deltaTime;
        jumpVelocity += gravity * deltaTime;

        if (player.position.y <= 0.5) {
            player.position.y = 0.5;
            jumping = false;
            jumpVelocity = 0;
        }
    }

    // Check collisions with enemies
    for (let i = 0; i < enemies.length; i++) {
        if (checkCollision(player, enemies[i])) {
            player.position.copy(oldPosition);
            break;
        }
    }

    // Update camera
    updateCameraPosition();

    // Update AABB box for player
    playerBox.position.copy(player.position);
    playerBox.rotation.copy(player.rotation);
}

function updateEnemies(deltaTime) {
    const speed = 1; // Slow movement speed
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move enemy towards player
        const direction = new THREE.Vector3()
            .subVectors(player.position, enemy.position)
            .normalize();
        enemy.position.add(direction.multiplyScalar(speed * deltaTime));
        enemy.lookAt(player.position);
        
        // Check if enemy is dead
        if (enemy.health <= 0) {
            console.log("Enemy defeated!");
            scene.remove(enemy);
            enemies.splice(i, 1);
        
            tryDropJewel(enemy.position.clone());
        }
    }
}

function updateInventoryDisplay() {
    const jewelCountElement = document.getElementById('jewelCount');
    if (jewelCountElement) {
        jewelCountElement.textContent = inventory.jewels;
    }
}

const inventory = {
    jewels: 0,
    maxStack: 20,
    addJewel: function() {
        if (this.jewels < this.maxStack) {
            this.jewels++;
            updateInventoryDisplay();
            return true;
        }
        return false;
    },
    useJewel: function() {
        if (this.jewels > 0) {
            this.jewels--;
            updateInventoryDisplay();
            // Increase attack rate
            attackCooldown *= 0.95; // Reduce cooldown by 5%
            console.log('Attack rate increased! New cooldown:', attackCooldown);
            return true;
        }
        return false;
    }
};

function setupInventoryListeners() {
    const inventoryButton = document.getElementById('inventoryButton');
    const closeInventoryButton = document.getElementById('closeInventory');
    const jewelStack = document.getElementById('jewelStack');

    if (inventoryButton) {
        inventoryButton.addEventListener('click', toggleInventory);
    }

    if (closeInventoryButton) {
        closeInventoryButton.addEventListener('click', toggleInventory);
    }

    if (jewelStack) {
        jewelStack.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            inventory.useJewel();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'i' || event.key === 'I') {
            toggleInventory();
        }
    });
}

function toggleInventory() {
    const inventoryDisplay = document.getElementById('inventoryDisplay');
    if (inventoryDisplay) {
        inventoryDisplay.style.display = inventoryDisplay.style.display === 'none' ? 'block' : 'none';
        updateInventoryDisplay();
    }
}

function checkCollision(obj1, obj2) {
    const box1 = new THREE.Box3().setFromObject(obj1);
    const box2 = new THREE.Box3().setFromObject(obj2);
    return box1.intersectsBox(box2);
}

let lastTime = 0;

function animate(time) {
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    // Spawn enemies periodically
    if (time - lastSpawnTime > spawnInterval) {
        spawnEnemy();
        lastSpawnTime = time;
    }

    requestAnimationFrame(animate);
    updatePlayer(deltaTime);
    updateEnemies(deltaTime);
    updateParticles(deltaTime);
    updateJewels(deltaTime);
    attack(time);
    
    renderer.render(scene, camera);
}

function changeWeapon(newWeapon) {
    currentWeapon = newWeapon;
    attackCooldown = currentWeapon.cooldown;
}

function pickupWeapon(weaponType) {
    switch(weaponType) {
        case 'fastBlaster':
            changeWeapon({
                name: "Fast Blaster",
                cooldown: 500, // 0.5 seconds
                damage: 5,
                particleCount: 2
            });
            break;
        case 'heavyCannon':
            changeWeapon({
                name: "Heavy Cannon",
                cooldown: 2000, // 2 seconds
                damage: 30,
                particleCount: 1
            });
            break;
        // Add more weapon types as needed
    }
}

function startGame() {
    init();
    setupEventListeners();
    initializeInventory();  // Move this here
    animate(0);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}