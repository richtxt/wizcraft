export class RenderSystem {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
    }

    render() {
        if (this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            // console.log("Scene rendered");
        } else {
            console.error("Cannot render: scene or camera is undefined");
        }
    }
}