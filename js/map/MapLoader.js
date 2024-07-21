export class MapLoader {
    async loadMap(mapName) {
        try {
            const response = await fetch(`/maps/${mapName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const mapData = await response.json();
            
            // If the loaded map doesn't have forestTiles, initialize them
            if (!mapData.forestTiles) {
                mapData.forestTiles = Array(mapData.height).fill().map(() => Array(mapData.width).fill(false));
            }
            
            return mapData;
        } catch (error) {
            console.error(`Error loading map ${mapName}:`, error);
            throw error;
        }
    }
}