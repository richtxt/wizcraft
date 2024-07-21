export class InventoryManager {
    constructor() {
        this.jewels = 0;
        this.maxStack = 20;
        this.isInventoryOpen = false;
        this.setupInventoryDisplay();
    }

    setupInventoryDisplay() {
        // Create inventory display elements if they don't exist
        if (!document.getElementById('inventoryDisplay')) {
            const inventoryDisplay = document.createElement('div');
            inventoryDisplay.id = 'inventoryDisplay';
            inventoryDisplay.style.display = 'none';
            inventoryDisplay.innerHTML = `
                <h2>Inventory</h2>
                <p>Jewels: <span id="jewelCount">0</span></p>
            `;
            document.body.appendChild(inventoryDisplay);
        }
    }

    toggleInventory() {
        this.isInventoryOpen = !this.isInventoryOpen;
        const inventoryDisplay = document.getElementById('inventoryDisplay');
        if (inventoryDisplay) {
            inventoryDisplay.style.display = this.isInventoryOpen ? 'block' : 'none';
        }
        this.updateDisplay();
    }

    addJewel() {
        if (this.jewels < this.maxStack) {
            this.jewels++;
            this.updateDisplay();
            return true;
        }
        return false;
    }

    useJewel() {
        if (this.jewels > 0) {
            this.jewels--;
            this.updateDisplay();
            return true;
        }
        return false;
    }

    updateDisplay() {
        const jewelCountElement = document.getElementById('jewelCount');
        if (jewelCountElement) {
            jewelCountElement.textContent = this.jewels;
        }
    }
}