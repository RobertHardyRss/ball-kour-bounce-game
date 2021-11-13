/// <reference path="utilities.js">

// @ts-check
/** @type {HTMLCanvasElement} */
// @ts-ignore we know canvas is indeed an HTMLCanvasElement
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

class KeyboardState {
	constructor() {
		this.isAcceleratorDown = false;
		this.isBrakeDown = false;
	}

	registerEventListeners() {
		window.addEventListener("keydown", (e) => {
			if (e.key === "ArrowRight") this.isAcceleratorDown = true;
			if (e.key === "ArrowLeft") this.isBrakeDown = true;
			console.log("keydown", e.key);
		});

		window.addEventListener("keyup", (e) => {
			if (e.key === "ArrowRight") this.isAcceleratorDown = false;
			if (e.key === "ArrowLeft") this.isBrakeDown = false;
			console.log("keyup", e.key);
		});
	}
}

class Game {
	/** @param {KeyboardState} keyboardState */
	constructor(keyboardState) {
		this.keyboardState = keyboardState;
		this.scrollSpeed = 0;
		this.scrollAcceleration = 5;
		this.scrollAccelerationInterval = 100;
		this.lastAccelerationTime = 0;
		this.maxScrollSpeed = 100;

		this.score = 0;
		this.isOver = false;
	}

	/** @param {number} timeElapsed */
	update(timeElapsed) {
		this.lastAccelerationTime += timeElapsed;

		if (
			this.keyboardState.isAcceleratorDown &&
			this.scrollSpeed < this.maxScrollSpeed
		) {
			if (
				this.scrollSpeed === 0 ||
				this.lastAccelerationTime >= this.scrollAccelerationInterval
			) {
				this.scrollSpeed += this.scrollAcceleration;
				this.lastAccelerationTime = 0;
			}
		}

		if (this.keyboardState.isBrakeDown) {
			this.scrollSpeed = 0;
			this.lastAccelerationTime = 0;
		}

		if (
			!this.keyboardState.isAcceleratorDown &&
			!this.keyboardState.isBrakeDown &&
			this.scrollSpeed > 0
		) {
			if (this.lastAccelerationTime >= this.scrollAccelerationInterval) {
				this.lastAccelerationTime = 0;
				this.scrollSpeed -= this.scrollAcceleration;
			}
		}
	}
	render() {}
}

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
		ctx.save();
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.restore();
	}
}

class PlayerTracer {
	/**
	 * @param {Player} player
	 * @param {Game} game
	 */
	constructor(player, game) {
		this.x = player.x;
		this.y = player.y;

		this.game = game;

		this.radius = 5;
		this.opacity = 1;
		this.fadeRate = 0.2;
		this.fadeSpeed = 100;
		this.lastFade = 0;

		this.isVisible = true;
	}

	/** @param {number} timeElapsed	*/
	update(timeElapsed) {
		this.x -= this.game.scrollSpeed;

		this.lastFade += timeElapsed;
		if (this.lastFade >= this.fadeSpeed) {
			this.opacity -= this.fadeRate;
			this.lastFade = 0;
		}

		if (this.x + this.radius <= 0 || this.opacity <= 0)
			this.isVisible = false;
	}

	render() {
		ctx.save();
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		ctx.fillStyle = `hsla(0, 0%, 80%, ${this.opacity})`;
		ctx.fill();
		ctx.restore();
	}

	static lastPlayerTracer = 0;
	static playerTracerInterval = 500;
}

let keyboardState = new KeyboardState();
keyboardState.registerEventListeners();

let game = new Game(keyboardState);
let player = new Player();
let tracers = [new PlayerTracer(player, game)];

let lastTimestamp = 0;

/** @param {number} timestamp */
function gameLoop(timestamp) {
	const timeElapsed = timestamp - lastTimestamp;
	lastTimestamp = timestamp;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	let gameObjects = [...tracers, game, player];

	gameObjects.forEach((o) => {
		o.update(timeElapsed);
		o.render();
	});

	tracers = tracers.filter((t) => t.isVisible);
	PlayerTracer.lastPlayerTracer += timeElapsed;
	if (PlayerTracer.lastPlayerTracer >= PlayerTracer.playerTracerInterval) {
		tracers.push(new PlayerTracer(player, game));
	}

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
