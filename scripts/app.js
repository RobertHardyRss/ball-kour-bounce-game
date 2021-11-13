/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

class Player {
	constructor() {
		this.x = canvas.width * 0.25;
		this.y = 0;
		this.speed = 10;
		this.radius = 16;
	}

	update() {
		this.y = this.y + this.speed;
	}

	render() {
		ctx.save();
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.restore();
	}
}

let player = new Player();

function gameLoop() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	player.update();
	player.render();

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
