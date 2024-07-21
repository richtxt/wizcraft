import { Jewel } from '../components/Jewel.js';
import { JEWEL_DROP_CHANCE, JEWEL_PICKUP_DISTANCE } from '../utils/Constants.js';

export class JewelManager {
    constructor(scene, player, inventoryManager) {
        this.scene = scene;
        this.player = player;
        this.inventoryManager = inventoryManager;
        this.jewels = [];
    }

    createJewel(position) {
        const jewel = new Jewel(position);
        this.scene.add(jewel);
        this.jewels.push(jewel);
        console.log("Jewel created. Total jewels:", this.jewels.length);
        return jewel;
    }

    tryDropJewel(position) {
        if (Math.random() < JEWEL_DROP_CHANCE) {
            this.createJewel(position);
            return true;
        }
        return false;
    }

    setPlayer(player) {
        this.player = player;
    }

    update(deltaTime) {
        for (let i = this.jewels.length - 1; i >= 0; i--) {
            const jewel = this.jewels[i];
            jewel.update(deltaTime);

            // Check if player is close to the jewel
            if (this.player.getPosition().distanceTo(jewel.position) < JEWEL_PICKUP_DISTANCE) {
                if (this.inventoryManager.addJewel()) {
                    console.log("Jewel collected!");
                    this.scene.remove(jewel);
                    this.jewels.splice(i, 1);
                }
            }
        }
    }
}