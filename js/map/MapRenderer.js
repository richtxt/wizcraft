import * as THREE from 'three';
import { ForestTile } from '../environment/ForestTile.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class MapRenderer {
    constructor(scene) {
        this.scene = scene;
        this.mapObjects = new THREE.Group();
        this.scene.add(this.mapObjects);
        this.treeModel = null;
        this.loadTreeModel();
    }

    loadTreeModel() {
        const loader = new GLTFLoader();
        loader.load('assets/tree.glb', (gltf) => {
            this.treeModel = gltf.scene;
            console.log("Tree model loaded");
        });
    }

    renderMap(mapData) {
        console.log("Starting map render");
        this.clearMapObjects();

        // Render terrain and forest tiles
        for (let y = 0; y < mapData.height; y++) {
            for (let x = 0; x < mapData.width; x++) {
                const terrainType = mapData.terrain[y][x];
                const isForest = mapData.forestTiles[y][x];
                // Use (x - mapData.width / 2) and (y - mapData.height / 2) to center the map
                this.createTerrainTile(x - mapData.width / 2, y - mapData.height / 2, terrainType, isForest);
            }
        }

        // Render objects
        mapData.objects.forEach(obj => {
            this.createMapObject(obj.type, obj.x - mapData.width / 2, obj.y - mapData.height / 2);
        });

        console.log("Map render complete");
        console.log("Scene children after render:", this.scene.children);
    }

    clearMapObjects() {
        while (this.mapObjects.children.length > 0) {
            this.mapObjects.remove(this.mapObjects.children[0]);
        }
        console.log("Cleared map objects");
    }

    createTerrainTile(x, y, type, isForest) {
        if (isForest) {
            const forestTile = new ForestTile(this.scene, new THREE.Vector3(x, 0, y));
            this.mapObjects.add(forestTile.tile);
            forestTile.grassBlades.forEach(blade => this.mapObjects.add(blade));
        } else {
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshStandardMaterial({
                color: this.getTerrainColor(type),
                roughness: 0.8,
                metalness: 0.2
            });
            const tile = new THREE.Mesh(geometry, material);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(x, 0, y);
            this.mapObjects.add(tile);
        }
    }

    createMapObject(type, x, y) {
        if (type === 'tree' && this.treeModel) {
            const tree = this.treeModel.clone();
            const scale = 0.01 + Math.random() * 0.01;
            tree.scale.set(scale, scale, scale);
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.position.set(x, 0, y);
            const box = new THREE.Box3().setFromObject(tree);
            const height = box.max.y - box.min.y;
            tree.position.y = height / 2;
            this.mapObjects.add(tree);
        } else {
            let geometry, material;
            switch (type) {
                case 'rock':
                    geometry = new THREE.SphereGeometry(0.5, 8, 8);
                    material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, metalness: 0.2 });
                    break;
                case 'enemy':
                    geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
                    material = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5, metalness: 0.5 });
                    break;
                default:
                    console.warn(`Unknown object type: ${type}`);
                    return;
            }
            const object = new THREE.Mesh(geometry, material);
            object.position.set(x, 0.5, y);
            this.mapObjects.add(object);
        }
    }

    getTerrainColor(type) {
        switch (type) {
            case 'grass': return 0x7CFC00;
            case 'water': return 0x4169E1;
            case 'sand': return 0xF4A460;
            case 'forest': return 0x228B22;
            default: return 0x888888; // Default gray
        }
    }
}