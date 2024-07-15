let scene, camera, renderer, player, ground, enemies = [];
let playerBox;
let moveForward = false, moveBackward = false, strafeLeft = false, strafeRight = false, rotateLeft = false, rotateRight = false;
let jumping = false, jumpVelocity = 0, gravity = -9.8, jumpStrength = 5;
let particles = [];
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
const mouseSensitivity = 0.002; // Adjust this value to change mouse sensitivity
let isAttacking = false;


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

    // AABB box for player
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    playerBox = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(playerBox);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.getElementById('jumpButton').addEventListener('click', startJump);
    document.getElementById('attackButton').addEventListener('mousedown', startAttack);
    document.getElementById('attackButton').addEventListener('mouseup', stopAttack);
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
    const spread = Math.PI / 4; // 45 degree spread
    const speed = 10;
    const lifespan = 3; // seconds

    for (let i = 0; i < particleCount; i++) {
        const angle = (i / (particleCount - 1) - 0.5) * spread;
        const direction = new THREE.Vector3(
            Math.sin(angle),
            0.2,
            -Math.cos(angle)
        ).applyQuaternion(player.quaternion);

        const particle = createParticle();
        particle.position.copy(player.position);
        particle.velocity = direction.multiplyScalar(speed);
        particle.bounces = 5; // Increased number of bounces
        particle.lifespan = lifespan;
        particle.creation = currentTime / 1000;
        particle.damage = currentWeapon.damage;

        scene.add(particle);
        particles.push(particle);
    }
}

function createParticle() {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7
    });
    return new THREE.Mesh(geometry, material);
}

function updateParticles(deltaTime) {
    const currentTime = Date.now() / 1000;
    particles = particles.filter(particle => {
        particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
        particle.velocity.y += gravity * deltaTime;

        if (particle.position.y <= 0.1 && particle.bounces > 0) {
            particle.velocity.y = -particle.velocity.y * 0.8; // Increased bounciness
            particle.bounces--;
        }

        const age = currentTime - particle.creation;
        particle.material.opacity = 0.7 * (1 - age / particle.lifespan);

        // Check collision with enemies
        enemies.forEach(enemy => {
            if (checkCollision(particle, enemy)) {
                enemy.health -= particle.damage; // Use the particle's damage
                updateHealthBar(enemy);
                scene.remove(particle);
                return false;
            }
        });

        if (age > particle.lifespan) {
            scene.remove(particle);
            return false;
        }
        return true;
    });
}

function updateHealthBar(enemy) {
    const healthPercent = Math.max(enemy.health / 100, 0);
    enemy.healthBar.scale.x = healthPercent;
    enemy.healthBar.material.color.setHSL(healthPercent / 3, 1, 0.5);
    
    if (enemy.health <= 0) {
        scene.remove(enemy);
        enemies = enemies.filter(e => e !== enemy);
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
    enemies.forEach(enemy => {
        const direction = new THREE.Vector3()
            .subVectors(player.position, enemy.position)
            .normalize();
        enemy.position.add(direction.multiplyScalar(speed * deltaTime));
        enemy.lookAt(player.position);
    });
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

init();
animate(0);