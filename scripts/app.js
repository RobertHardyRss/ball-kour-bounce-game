// @ts-check
/** @type {HTMLCanvasElement} */
// @ts-ignore we know canvas is indeed an HTMLCanvasElement
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

/**  @param {number} t */
function parabolicEasing(t) {
	// given a parabolla with x intercepts of 0 and 4
	// and a y vertex of 4 we have a formula of:
	// y = -(x - 2)^2 + 4
	const x = t * 4 - 2;
	const y = x * x * -1 + 4;

	// translate y back into a percentage from 0 to 1+
	return y / 4;
}

class Player {
	constructor() {
		this.radius = 16;
		this.maxBounceHeight = 100;
		this.yLastBounce = 300;
		this.x = canvas.width * 0.25;
		this.y = this.yLastBounce;
		this.timeSinceBounce = 0;
		this.maxBounceTime = 1000;
	}

	/** @param {number} timeElapsed	*/
	update(timeElapsed) {
		this.timeSinceBounce += timeElapsed;
		const isMovingUp = this.timeSinceBounce <= this.maxBounceTime / 2;
		if (!isMovingUp && this.y >= canvas.height - this.radius) {
			this.yLastBounce = canvas.height - this.radius;
			this.timeSinceBounce = 0;
		}

		let ef = parabolicEasing(this.timeSinceBounce / this.maxBounceTime);
		this.y = this.yLastBounce - ef * this.maxBounceHeight;
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
let lastTimestamp = 0;

/** @param {number} timestamp */
function gameLoop(timestamp) {
	const timeElapsed = timestamp - lastTimestamp;
	lastTimestamp = timestamp;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	player.update(timeElapsed);
	player.render();

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
