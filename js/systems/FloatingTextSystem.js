import * as THREE from 'three';

export class FloatingTextSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.texts = [];
    }

    createText(position, text, color = 0xff0000) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = 'Bold 30px Arial';
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.fillText(text, 0, 30);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.copy(position);
        sprite.position.y += 1; // Offset upwards
        sprite.scale.set(2, 1, 1);

        this.scene.add(sprite);
        this.texts.push({ sprite, creationTime: Date.now() });
    }

    update() {
        const currentTime = Date.now();
        this.texts = this.texts.filter(textObj => {
            const age = currentTime - textObj.creationTime;
            if (age > 1000) { // Remove after 1 second
                this.scene.remove(textObj.sprite);
                return false;
            }
            
            // Move upwards and fade out
            textObj.sprite.position.y += 0.01;
            textObj.sprite.material.opacity = 1 - (age / 1000);
            
            // Always face the camera
            textObj.sprite.quaternion.copy(this.camera.quaternion);
            
            return true;
        });
    }
}