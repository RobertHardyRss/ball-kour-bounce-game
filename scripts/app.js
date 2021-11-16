// @ts-check
/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

class Player {
	constructor() {
		this.maxBounceHeight = canvas.height / 2;
		this.yOfLastBounce = 0;
		this.x = canvas.width * 0.25;
		this.y = 0;
		this.speed = 10;
		this.radius = 16;
	}

	update() {
		const isMovingDown = this.speed > 0;

		this.y = this.y + this.speed;

		if (this.y + this.radius >= canvas.height) {
			this.speed *= -1;
			this.yOfLastBounce = this.y;
		}

		if (
			!isMovingDown &&
			this.y <= this.yOfLastBounce + this.maxBounceHeight
		) {
			this.speed *= -1;
		}
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
