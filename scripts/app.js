/// <reference path="utilities.js">
/// <reference path="player-tracer.js">
/// <reference path="keyboard-state.js">
/// <reference path="game.js">

// @ts-check
/** @type {HTMLCanvasElement} */
// @ts-ignore we know canvas is indeed an HTMLCanvasElement
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

class Player {
	constructor() {
		this.radius = 16;
		this.maxBounceHeight = 300;
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
		const gradientStartOffset = this.radius * 0.4;

		ctx.save();
		let rg = ctx.createRadialGradient(
			this.x - gradientStartOffset,
			this.y - gradientStartOffset,
			3,
			this.x,
			this.y,
			this.radius
		);

		rg.addColorStop(0, "white");
		rg.addColorStop(0.2, "purple");
		rg.addColorStop(1, "black");

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		ctx.fillStyle = rg;
		ctx.fill();
		ctx.restore();
	}
}

let keyboardState = new KeyboardState();
keyboardState.registerEventListeners();

let game = new Game(keyboardState, ctx);
let player = new Player();
PlayerTracer.tracers.push(new PlayerTracer(player, game, ctx));

let lastTimestamp = 0;

/** @param {number} timestamp */
function gameLoop(timestamp) {
	const timeElapsed = timestamp - lastTimestamp;
	lastTimestamp = timestamp;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	let gameObjects = [game, ...PlayerTracer.tracers, player];

	gameObjects.forEach((o) => {
		o.update(timeElapsed);
		o.render();
	});

	PlayerTracer.manageTracers(player, game, ctx, timeElapsed);

	requestAnimationFrame(gameLoop);
}

window.onload = () => {
	requestAnimationFrame(gameLoop);
};
