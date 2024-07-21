import { Game } from './game.js';

function startGame() {
    const game = new Game();
    game.start();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}