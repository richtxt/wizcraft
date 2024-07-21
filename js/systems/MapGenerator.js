import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ForestTile } from '../environment/ForestTile.js';

export class MapGenerator {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.chunkSize = 5;
        this.viewDistance = 3;
        this.chunks = new Map();
        this.treeModel = null;
        this.treeSpawnChance = 0.02;

        this.loadTreeModel();
    }

    loadTreeModel() {
        const loader = new GLTFLoader();
        loader.load('../assets/tree.glb', (gltf) => {
            this.treeModel = gltf.scene;
            console.log("Tree model loaded");
        });
    }

    update() {
        const playerChunkX = Math.floor(this.player.getPosition().x / this.chunkSize);
        const playerChunkZ = Math.floor(this.player.getPosition().z / this.chunkSize);

        for (let x = -this.viewDistance; x <= this.viewDistance; x++) {
            for (let z = -this.viewDistance; z <= this.viewDistance; z++) {
                const chunkX = playerChunkX + x;
                const chunkZ = playerChunkZ + z;
                const chunkKey = `${chunkX},${chunkZ}`;

                if (!this.chunks.has(chunkKey)) {
                    this.generateChunk(chunkX, chunkZ);
                }
            }
        }
    }

    generateChunk(chunkX, chunkZ) {
        const chunk = new THREE.Group();

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldZ = chunkZ * this.chunkSize + z;

                // Generate ForestTile
                const forestTile = new ForestTile(this.scene, new THREE.Vector3(worldX + 0.5, 0, worldZ + 0.5));
                chunk.add(forestTile.tile);
                forestTile.grassBlades.forEach(blade => chunk.add(blade));

                // Randomly add trees
                if (Math.random() < this.treeSpawnChance && this.treeModel) {
                    const tree = this.treeModel.clone();

                    // Randomize tree scale
                    const scale = 0.01 + Math.random() * 0.01;
                    tree.scale.set(scale, scale, scale);

                    // Randomize tree rotation
                    tree.rotation.y = Math.random() * Math.PI * 2;

                    // Position tree on the ground
                    tree.position.set(worldX + 0.5, 0, worldZ + 0.5);

                    // Adjust tree position based on its bounding box
                    const box = new THREE.Box3().setFromObject(tree);
                    const height = box.max.y - box.min.y;
                    tree.position.y = height / 2;

                    chunk.add(tree);
                }
            }
        }

        this.scene.add(chunk);
        this.chunks.set(`${chunkX},${chunkZ}`, chunk);
    }
}