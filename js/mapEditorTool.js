import { MapEditor } from '../js/map/MapEditor.js';

export class MapEditorTool {
    constructor(canvasId, width, height) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.mapEditor = new MapEditor(width, height);
        this.tileSize = 40;
        this.setupEventListeners();
        this.currentLayer = 'terrain';
        this.currentTool = 'grass';
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        // Add event listeners for UI buttons (clear, save, load, etc.)
    }

    handleMouseDown(e) {
        this.isDrawing = true;
        this.draw(e);
    }

    handleMouseMove(e) {
        if (this.isDrawing) {
            this.draw(e);
        }
    }

    handleMouseUp() {
        this.isDrawing = false;
    }

    draw(e) {
        const { x, y } = this.getTileCoords(e);
        if (x >= 0 && x < this.mapEditor.width && y >= 0 && y < this.mapEditor.height) {
            if (this.currentLayer === 'terrain') {
                this.mapEditor.setTerrain(x, y, this.currentTool);
            } else if (this.currentLayer === 'objects') {
                if (this.currentTool === 'grass') {
                    this.mapEditor.removeObject(x, y);
                } else {
                    this.mapEditor.setObject(x, y, this.currentTool);
                }
            }
            this.redraw();
        }
    }

    getTileCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.tileSize);
        const y = Math.floor((e.clientY - rect.top) / this.tileSize);
        return { x, y };
    }

    redraw() {
        const mapData = this.mapEditor.getMapData();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw terrain
        for (let y = 0; y < mapData.height; y++) {
            for (let x = 0; x < mapData.width; x++) {
                this.ctx.fillStyle = this.getTerrainColor(mapData.terrain[y][x]);
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                
                // Draw forest tiles
                if (mapData.forestTiles[y][x]) {
                    this.drawForestTile(x, y);
                }
            }
        }
        
        // Draw objects
        for (let y = 0; y < mapData.height; y++) {
            for (let x = 0; x < mapData.width; x++) {
                if (mapData.objects[y][x]) {
                    this.ctx.fillStyle = this.getObjectColor(mapData.objects[y][x]);
                    this.ctx.beginPath();
                    this.ctx.arc(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, this.tileSize / 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        this.drawGrid();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#ccc';
        for (let x = 0; x <= this.canvas.width; x += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawForestTile(x, y) {
        // Draw a simple representation of grass blades
        this.ctx.strokeStyle = '#4CAF50';
        for (let i = 0; i < 3; i++) {
            const startX = x * this.tileSize + Math.random() * this.tileSize;
            const startY = y * this.tileSize + this.tileSize;
            const endX = startX;
            const endY = startY - this.tileSize / 3;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    getTerrainColor(type) {
        const colors = {
            grass: '#7CFC00',
            water: '#4169E1',
            sand: '#F4A460',
            forest: '#228B22'
        };
        return colors[type] || '#7CFC00';
    }

    getObjectColor(type) {
        const colors = {
            tree: '#006400',
            rock: '#A9A9A9',
            enemy: '#FF0000'
        };
        return colors[type] || '#000000';
    }

    setCurrentLayer(layer) {
        this.currentLayer = layer;
    }

    setCurrentTool(tool) {
        this.currentTool = tool;
    }

    clearMap() {
        this.mapEditor = new MapEditor(this.mapEditor.width, this.mapEditor.height);
        this.redraw();
    }

    saveMap(name) {
        const mapData = this.mapEditor.saveMap(name);
        const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`;
        a.click();
    }

    loadMap(mapData) {
        this.mapEditor.loadMap(mapData);
        this.redraw();
    }
}