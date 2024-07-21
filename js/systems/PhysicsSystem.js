export class PhysicsSystem {
    constructor() {
        // This could be expanded with more complex physics simulations
    }

    update(deltaTime, gameObjects) {
        gameObjects.forEach(obj => {
            if (obj.update) {
                obj.update(deltaTime);
            }
        });
    }
}