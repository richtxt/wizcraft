import * as THREE from 'three';
import { PARTICLE_SIZE, PARTICLE_COLOR, GLOW_COLOR, GLOW_SIZE } from '../utils/Constants.js';

export class Particle extends THREE.Group {
    constructor(scene, position, velocity, damage) {
        super();
        this.scene = scene;
        this.position.copy(position);
        this.userData.velocity = velocity;
        this.userData.damage = damage;
        this.userData.distanceTraveled = 0;
        this.userData.maxDistance = 10;
        this.userData.bounces = 0;
        this.userData.cloudParticles = [];

        this.createParticleMesh();
        this.createGlowEffect();
    }

    createParticleMesh() {
        const geometry = new THREE.SphereGeometry(PARTICLE_SIZE, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: PARTICLE_COLOR,
            transparent: true,
            opacity: 1
        });
        const core = new THREE.Mesh(geometry, material);
        this.add(core);
    }

    createGlowEffect() {
        const glowGeometry = new THREE.SphereGeometry(PARTICLE_SIZE * GLOW_SIZE, 16, 16);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { type: "c", value: new THREE.Color(GLOW_COLOR) },
                viewVector: { type: "v3", value: new THREE.Vector3() }
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

        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.add(this.glowMesh);
    }

    update(deltaTime, cameraPosition) {
        // Update particle position and other properties
        // This method will be called by ParticleManager
    }
}