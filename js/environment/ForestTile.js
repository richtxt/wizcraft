import * as THREE from 'three';

export class ForestTile {
    constructor(scene, position, size = 1) {
        this.scene = scene;
        this.position = position;
        this.size = size;
        this.grassBlades = [];
        
        this.createBaseTile();
        this.addGrassBlades();
        this.animateGrass();
    }

    createBaseTile() {
        const geometry = new THREE.PlaneGeometry(this.size, this.size);
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a3300,  // Dark green color
            roughness: 0.8,
            metalness: 0.2
        });
        this.tile = new THREE.Mesh(geometry, material);
        this.tile.rotation.x = -Math.PI / 2;  // Lay flat on the ground
        this.tile.position.copy(this.position);
        this.scene.add(this.tile);
    }

    addGrassBlades() {
        const bladeGeometry = new THREE.PlaneGeometry(0.1, 0.3);
        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            side: THREE.DoubleSide,
            alphaTest: 0.5
        });

        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.set(
                this.position.x + (Math.random() - 0.5) * this.size * 0.8,
                this.position.y,
                this.position.z + (Math.random() - 0.5) * this.size * 0.8
            );
            blade.rotation.y = Math.random() * Math.PI;
            this.scene.add(blade);
            this.grassBlades.push(blade);
        }
    }

    animateGrass() {
        this.grassBlades.forEach((blade, index) => {
            const initialRotation = blade.rotation.y;
            const animationSpeed = 0.5 + Math.random() * 0.5;
            
            function animate() {
                const time = Date.now() * 0.001;
                blade.rotation.y = initialRotation + Math.sin(time * animationSpeed) * 0.1;
                requestAnimationFrame(animate);
            }
            
            animate();
        });
    }
}