export class InputSystem {
    constructor(player, camera, renderer) {
        this.player = player;
        this.camera = camera;
        this.renderer = renderer;
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;

        this.setupKeyboardEvents();
        this.setupMouseEvents();
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW': this.player.moveForward = true; break;
                case 'KeyS': this.player.moveBackward = true; break;
                case 'KeyA': this.player.strafeLeft = true; break;
                case 'KeyD': this.player.strafeRight = true; break;
                case 'Space': this.player.startJump(); break;
                case 'KeyI': this.player.toggleInventory(); break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW': this.player.moveForward = false; break;
                case 'KeyS': this.player.moveBackward = false; break;
                case 'KeyA': this.player.strafeLeft = false; break;
                case 'KeyD': this.player.strafeRight = false; break;
            }
        });
    }

    setupMouseEvents() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));

        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
        });

        const attackButton = document.getElementById('attackButton');
        if (attackButton) {
            attackButton.addEventListener('mousedown', () => this.player.startAttack());
            attackButton.addEventListener('mouseup', () => this.player.stopAttack());
        }
    }

    onMouseMove(event) {
        if (this.isPointerLocked) {
            let movementX = -(event.movementX || event.mozMovementX || event.webkitMovementX || 0);
            this.player.rotate(movementX * this.mouseSensitivity);
        }
    }

    onMouseDown(event) {
        if (event.button === 0) { // Left mouse button
            if (!this.isPointerLocked) {
                this.renderer.domElement.requestPointerLock();
            }
            this.player.startAttack();
        }
    }

    onMouseUp(event) {
        if (event.button === 0) { // Left mouse button
            this.player.stopAttack();
        }
    }

    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    }

    update() {
        // Any per-frame input processing can go here
    }
}