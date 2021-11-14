/// <reference path="utilities.js">
/// <reference path="player-tracer.js.js">

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
			// console.log("keydown", e.key);
		});

		window.addEventListener("keyup", (e) => {
			if (e.key === "ArrowRight") this.isAcceleratorDown = false;
			if (e.key === "ArrowLeft") this.isBrakeDown = false;
			// console.log("keyup", e.key);
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

		/** @type {HTMLImageElement} */
		// @ts-ignore
		this.image = document.getElementById("background-01");
		this.imageX = 0;
		// console.log(this.image.width, this.image.height);
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

		this.imageX -= this.scrollSpeed;
		if (this.imageX <= this.image.width * -1) this.imageX = 0;
	}
	render() {
		ctx.drawImage(
			this.image,
			this.imageX,
			0,
			this.image.width,
			this.image.height
		);
		ctx.drawImage(
			this.image,
			this.imageX + this.image.width,
			0,
			this.image.width,
			this.image.height
		);
	}
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

let game = new Game(keyboardState);
let player = new Player();
PlayerTracer.tracers.push(new PlayerTracer(player, game, ctx));

let lastTimestamp = 0;

/** @param {number} timestamp */
function gameLoop(timestamp) {
	const timeElapsed = timestamp - lastTimestamp;
	lastTimestamp = timestamp;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	let gameObjects = [...PlayerTracer.tracers, game, player];

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
