import * as THREE from 'three';
import { Player } from './components/Player.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { InputSystem } from './systems/InputSystem.js';
import { PhysicsSystem } from './systems/PhysicsSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { GameStateManager } from './managers/GameStateManager.js';
import { InventoryManager } from './managers/InventoryManager.js';
import { ParticleManager } from './managers/ParticleManager.js';
import { JewelManager } from './managers/JewelManager.js';
import { MapGenerator } from './systems/MapGenerator.js';
import { MapLoader } from './map/MapLoader.js';
import { MapRenderer } from './map/MapRenderer.js';
import { FloatingTextSystem } from './systems/FloatingTextSystem.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.mapLoader = new MapLoader();
        this.mapRenderer = new MapRenderer(this.scene);

        this.gameStateManager = new GameStateManager(this.scene, this.player, this.jewelManager);
        this.floatingTextSystem = new FloatingTextSystem(this.scene, this.camera);
        this.particleManager = new ParticleManager(this.scene, this.camera, this.floatingTextSystem, this.gameStateManager);

        this.setupScene();
        this.addDebugObjects();
        this.initializeGame();
        this.setupEventListeners();
    }

    setupScene() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);

        this.addDebugObjects();

        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(this.scene.position);
    }

    addDebugObjects() {
        // Add a grid helper
        const gridSize = Math.max(this.mapData.width, this.mapData.height);
        const gridHelper = new THREE.GridHelper(gridSize, gridSize);
        this.scene.add(gridHelper);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        console.log("Debug objects added to scene");
        console.log("Scene children after adding debug objects:", this.scene.children);
    }

    async loadMap(mapName) {
        try {
            const mapData = await this.mapLoader.loadMap(mapName);
            this.mapRenderer.renderMap(mapData);
            
            // Reposition player if necessary
            if (mapData.playerStart) {
                this.player.setPosition(mapData.playerStart.x, mapData.playerStart.y, mapData.playerStart.z);
            }

            console.log("Map loaded, player position:", this.player.getPosition());
        } catch (error) {
            console.error(`Failed to load map: ${mapName}`, error);
        }
    }

    renderMap() {
        // Clear existing map objects
        // (You'll need to implement this based on how you're managing game objects)
        this.clearMap();

        // Render terrain
        for (let y = 0; y < this.currentMap.height; y++) {
            for (let x = 0; x < this.currentMap.width; x++) {
                const terrainType = this.currentMap.terrain[y][x];
                this.createTerrainTile(x, y, terrainType);
            }
        }

        // Render objects
        for (const obj of this.currentMap.objects) {
            this.createMapObject(obj.type, obj.x, obj.y);
        }
    }

    createTerrainTile(x, y, type) {
        // Create a mesh for the terrain tile
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ color: this.getTerrainColor(type) });
        const tile = new THREE.Mesh(geometry, material);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x, 0, y);
        this.scene.add(tile);
    }

    createMapObject(type, x, y) {
        // Create a mesh for the map object
        let geometry, material;
        switch (type) {
            case 'tree':
                geometry = new THREE.ConeGeometry(0.5, 1, 8);
                material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                break;
            case 'rock':
                geometry = new THREE.SphereGeometry(0.5, 8, 8);
                material = new THREE.MeshBasicMaterial({ color: 0x888888 });
                break;
            case 'enemy':
                geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
                material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                break;
            default:
                console.warn(`Unknown object type: ${type}`);
                return;
        }
        const object = new THREE.Mesh(geometry, material);
        object.position.set(x, 0.5, y);
        this.scene.add(object);
    }

    getTerrainColor(type) {
        switch (type) {
            case 0: return 0x00ff00; // Grass
            case 1: return 0x0000ff; // Water
            case 2: return 0xffff00; // Sand
            default: return 0x888888; // Default gray
        }
    }

    clearMap() {
        // Remove all current map objects from the scene
        // This is a simple implementation; you might need a more sophisticated
        // approach depending on how you're managing game objects
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
    }

    async initializeGame() {
        // Initialize managers
        this.inventoryManager = new InventoryManager();
        this.jewelManager = new JewelManager(this.scene, null, this.inventoryManager); // We'll set player later
    
        // Initialize player
        this.player = new Player(this.scene, null, this.inventoryManager); // We'll set particleManager later
        this.player.setPosition(0, 1, 0); // Set initial position
        console.log("Player initialized:", this.player);
    
        // Initialize game state manager
        this.gameStateManager = new GameStateManager(this.scene, this.player, this.jewelManager);
        console.log("GameStateManager initialized:", this.gameStateManager);
    
        // Initialize floating text system
        this.floatingTextSystem = new FloatingTextSystem(this.scene, this.camera);
        console.log("FloatingTextSystem initialized:", this.floatingTextSystem);
    
        // Initialize particle manager
        this.particleManager = new ParticleManager(this.scene, this.camera, this.floatingTextSystem, this.gameStateManager);
        console.log("ParticleManager initialized:", this.particleManager);
    
        // Set particle manager for player and jewel manager
        this.player.setParticleManager(this.particleManager);
        this.jewelManager.setPlayer(this.player);
    
        // Initialize other systems
        this.renderSystem = new RenderSystem(this.scene, this.camera, this.renderer);
        this.physicsSystem = new PhysicsSystem();
        this.collisionSystem = new CollisionSystem();
        this.inputSystem = new InputSystem(this.player, this.camera, this.renderer);
    
        // Load initial map
        await this.loadMap("myFirstMap.json");
    
        // Ensure camera is positioned correctly after map load
        this.updateCameraPosition();
    
        console.log("Game initialization complete");
        console.log("Scene children after initialization:", this.scene.children);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(time, deltaTime) {
        this.inputSystem.update();
        this.player.update(deltaTime);
        this.updateCameraPosition();
        this.player.attack(time);
        this.gameStateManager.update(time, deltaTime);
        this.gameStateManager.updateEnemies(deltaTime);
        this.particleManager.update(deltaTime);
        this.floatingTextSystem.update();
        this.physicsSystem.update(deltaTime, [this.player, ...this.gameStateManager.enemies, ...this.gameStateManager.jewels]);
        this.collisionSystem.update(this.player, this.gameStateManager.enemies, this.particleManager.particles, this.gameStateManager.jewels);
    }

    updateCameraPosition() {
        const playerPosition = this.player.getPosition();
        const playerRotation = this.player.getRotation();
        
        // console.log("Player position:", playerPosition);
        // console.log("Player rotation:", playerRotation);

        if (this.isValidVector(playerPosition) && this.isValidQuaternion(playerRotation)) {
            const cameraOffset = new THREE.Vector3(0, 3, 8);
            this.camera.position.copy(playerPosition).add(cameraOffset.applyQuaternion(playerRotation));
            
            const targetY = playerPosition.y + (window.innerHeight / 3) * (this.camera.position.y - playerPosition.y) / window.innerHeight;
            const lookAtPoint = new THREE.Vector3(playerPosition.x, targetY, playerPosition.z);
            this.camera.lookAt(lookAtPoint);

            // console.log("Updated camera position:", this.camera.position);
        } else {
            console.error("Invalid player position or rotation");
            // Set a default camera position if player data is invalid
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        }
    }

    addDebugObjects() {
        // Add a grid helper
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        console.log("Debug objects added to scene");
    }

    isValidVector(vector) {
        return vector && !isNaN(vector.x) && !isNaN(vector.y) && !isNaN(vector.z);
    }

    isValidQuaternion(quaternion) {
        return quaternion && !isNaN(quaternion.x) && !isNaN(quaternion.y) && !isNaN(quaternion.z) && !isNaN(quaternion.w);
    }

    render() {
        this.renderSystem.render();
    }

    start() {
        console.log("Starting game loop");
        console.log("Initial scene children:", this.scene.children);

        let lastTime = 0;
        const animate = (time) => {
            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            this.update(time, deltaTime);
            this.updateCameraPosition();
            this.render();

            requestAnimationFrame(animate);
        };
        animate(0);
    }
}