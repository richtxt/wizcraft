export class MapEditor {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.terrain = Array(height).fill().map(() => Array(width).fill('grass'));
        this.objects = Array(height).fill().map(() => Array(width).fill(null));
        this.forestTiles = Array(height).fill().map(() => Array(width).fill(false));
        this.playerStart = { x: 0, y: 0, z: 0 };
    }

    setTerrain(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.terrain[y][x] = type;
            if (type === 'forest') {
                this.forestTiles[y][x] = true;
            } else {
                this.forestTiles[y][x] = false;
            }
        }
    }

    setObject(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.objects[y][x] = type;
        }
    }

    removeObject(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.objects[y][x] = null;
        }
    }

    setPlayerStart(x, y, z) {
        this.playerStart = { x, y, z };
    }

    loadMap(mapData) {
        this.width = mapData.width;
        this.height = mapData.height;
        this.terrain = mapData.terrain;
        this.forestTiles = mapData.forestTiles || Array(this.height).fill().map(() => Array(this.width).fill(false));
        this.objects = Array(this.height).fill().map(() => Array(this.width).fill(null));
        mapData.objects.forEach(obj => {
            this.objects[Math.floor(obj.y)][Math.floor(obj.x)] = obj.type;
        });
        this.playerStart = mapData.playerStart;
    }

    saveMap(name) {
        const mapData = {
            name,
            width: this.width,
            height: this.height,
            terrain: this.terrain,
            forestTiles: this.forestTiles,
            objects: this.objects.flat().map((type, index) => {
                if (type) {
                    return {
                        type,
                        x: index % this.width,
                        y: Math.floor(index / this.width)
                    };
                }
                return null;
            }).filter(Boolean),
            playerStart: this.playerStart
        };
        return mapData;
    }

    getMapData() {
        return {
            width: this.width,
            height: this.height,
            terrain: this.terrain,
            forestTiles: this.forestTiles,
            objects: this.objects,
            playerStart: this.playerStart
        };
    }
}