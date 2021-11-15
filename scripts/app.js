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

class Obstacle {
	/**
	 * @param {Game} game
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} x
	 * @param {number} y
	 * @param {string} color
	 */
	constructor(game, ctx, x, y, color) {
		this.game = game;
		this.ctx = ctx;

		this.x = x;
		this.y = y;

		this.height = 32;
		this.width = 32;
		this.color = color;
		this.isVisible = true;
	}

	update() {
		this.x -= this.game.scrollSpeed;
		this.isVisible = this.x + this.width > 0;
	}

	render() {
		this.ctx.save();
		this.ctx.fillStyle = this.color;
		this.ctx.fillRect(this.x, this.y, this.width, this.height);
		this.ctx.restore();
	}
}

class SafePlatform extends Obstacle {
	constructor(game, ctx, x) {
		super(game, ctx, x, canvas.height - 32, "silver");
		this.width = canvas.width / 2;
	}

	update() {
		super.update();
	}

	render() {
		super.render();
	}
}

let keyboardState = new KeyboardState();
keyboardState.registerEventListeners();

let game = new Game(keyboardState, ctx);
let player = new Player();
PlayerTracer.tracers.push(new PlayerTracer(player, game, ctx));
let obstacles = [new SafePlatform(game, ctx, 0)];

let lastTimestamp = 0;

/** @param {number} timestamp */
function gameLoop(timestamp) {
	const timeElapsed = timestamp - lastTimestamp;
	lastTimestamp = timestamp;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	let gameObjects = [game, ...PlayerTracer.tracers, player, ...obstacles];

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
