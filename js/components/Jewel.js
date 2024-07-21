import * as THREE from 'three';
import { JEWEL_FLOAT_SPEED } from '../utils/Constants.js';

export class Jewel extends THREE.Group {
    constructor(position) {
        super();
        this.createJewelMesh();
        this.createGlowEffect();
        this.createPointLight();
        this.position.copy(position);
        this.position.y = 0.05;
    }

    createJewelMesh() {
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
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.1,
            emissive: 0x996515,
            emissiveIntensity: 0.2
        });

        const emerald = new THREE.Mesh(geometry, material);
        emerald.scale.set(0.15, 0.15, 0.15);
        emerald.rotation.x = -Math.PI / 2;
        this.add(emerald);
    }

    createGlowEffect() {
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

        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.position.y = 0.05;
        this.add(this.glowMesh);
    }

    createPointLight() {
        const light = new THREE.PointLight(0xFFD700, 1, 1);
        light.position.set(0, 0.1, 0);
        this.add(light);
    }

    update(deltaTime) {
        const glowIntensity = 0.5 + 0.3 * Math.sin(Date.now() * JEWEL_FLOAT_SPEED);
        this.glowMesh.material.uniforms.glowColor.value.setHSL(0.1, 1, glowIntensity);
    }
}