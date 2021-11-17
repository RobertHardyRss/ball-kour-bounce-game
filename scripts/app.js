// @ts-check
/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

function parabollicEasing(pt) {
	let x = pt * 4 - 2;
	let y = x * x * -1 + 4;
	return y / 4;
}

class Player {
	constructor() {
		this.maxBounceHeight = canvas.height / 2;
		this.yOfLastBounce = 0;
		this.x = canvas.width * 0.25;
		this.y = 0;
		//this.speed = 10;
		this.bounceTime = 2000;
		this.timeSinceLastBounce = 0;
		this.radius = 16;
	}

	update(elapsedTime) {
		this.timeSinceLastBounce += elapsedTime;
		const isMovingDown = this.timeSinceLastBounce > this.bounceTime / 2;

		let ef = parabollicEasing(this.timeSinceLastBounce / this.bounceTime);
		this.y = this.y - ef * this.maxBounceHeight;

		if (this.y + this.radius >= canvas.height) {
			this.timeSinceLastBounce = 0;
			this.yOfLastBounce = this.y;
		}

		// if (
		// 	!isMovingDown &&
		// 	this.y <= this.yOfLastBounce - this.maxBounceHeight
		// ) {
		// 	this.speed *= -1;
		// }
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
let currentTime = 0;

function gameLoop(timestamp) {
	let timeElapsed = timestamp - currentTime;
	currentTime = timestamp;
	// console.log(timeElapsed, timestamp);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	player.update(timeElapsed);
	player.render();

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
