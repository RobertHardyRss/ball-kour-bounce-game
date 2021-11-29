// @ts-check
/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

/**
 * @param {number} pt
 */
function parabollicEasing(pt) {
	let x = pt * 4 - 2;
	let y = x * x * -1 + 4;
	return y / 4;
}

class KeyboardState {
	constructor() {
		this.isAccelerating = false;
		this.isBraking = false;
		this.registerEventHandlers();
	}

	registerEventHandlers() {
		window.addEventListener("keydown", (e) => {
			switch (e.key) {
				case "a":
				case "ArrowLeft":
					this.isBraking = true;
					break;
				case "d":
				case "ArrowRight":
					this.isAccelerating = true;
					break;
			}
		});

		window.addEventListener("keyup", (e) => {
			switch (e.key) {
				case "a":
				case "ArrowLeft":
					this.isBraking = false;
					break;
				case "d":
				case "ArrowRight":
					this.isAccelerating = false;
					break;
			}
		});
	}
}

class Player {
	/**
	 * @param {Array<SafePlatform>} [platforms]
	 */
	constructor(platforms) {
		this.platforms = platforms;
		this.maxBounceHeight = canvas.height / 2;
		this.yOfLastBounce = 0;
		this.x = canvas.width * 0.25;
		this.y = 0;
		this.bounceTime = 2000;
		this.timeSinceLastBounce = 0;
		this.radius = 16;
	}

	/**
	 * @param {number} elapsedTime
	 */
	update(elapsedTime) {
		this.timeSinceLastBounce += elapsedTime;
		const isMovingDown = this.timeSinceLastBounce > this.bounceTime / 2;

		let ef = parabollicEasing(this.timeSinceLastBounce / this.bounceTime);
		this.y = this.yOfLastBounce - ef * this.maxBounceHeight;

		this.platforms.forEach((p) => {
			let isPlatformBelowMe = this.x >= p.x && this.x <= p.x + p.width;
			
			if (isMovingDown && this.y + this.radius >= p.y) {
				this.timeSinceLastBounce = 0;
				this.yOfLastBounce = this.y;
			}
		});
	}

	render() {
		ctx.save();
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		ctx.fill();
		ctx.restore();
	}
}

class Game {
	/**
	 * @param {KeyboardState} kb
	 */
	constructor(kb) {
		this.kb = kb;
		this.speed = 0;
		this.maxSpeed = 100;
		this.accelerationRate = 5;
		this.accelerationInterval = 100;
		this.timeSinceLastAcceleration = 0;
	}

	/**
	 * @param {number} elapsedTime
	 */
	update(elapsedTime) {
		this.timeSinceLastAcceleration += elapsedTime;

		if (
			this.kb.isAccelerating &&
			this.speed < this.maxSpeed &&
			this.timeSinceLastAcceleration >= this.accelerationInterval
		) {
			this.speed += this.accelerationRate;
			this.timeSinceLastAcceleration = 0;
		}

		if (this.kb.isBraking) {
			this.speed = 0;
			this.timeSinceLastAcceleration = 0;
		}

		if (
			!this.kb.isAccelerating &&
			!this.kb.isBraking &&
			this.timeSinceLastAcceleration >= this.accelerationInterval &&
			this.speed > 0
		) {
			// decelarating
			this.speed -= this.accelerationRate;
			this.timeSinceLastAcceleration = 0;
		}
	}

	render() {}
}

class Tracer {
	/**
	 * @param {Player} p
	 * @param {Game} g
	 */
	constructor(p, g) {
		this.p = p;
		this.g = g;

		this.x = p.x;
		this.y = p.y;

		this.isVisible = true;
		this.opacity = 1;

		this.fadeRate = 0.1;
		this.fadeInterval = 100;
		this.timeSinceFade = 0;
	}

	/**
	 * @param {number} timeElapsed
	 */
	update(timeElapsed) {
		this.timeSinceFade += timeElapsed;
		this.x -= this.g.speed;

		if (this.timeSinceFade >= this.fadeInterval) {
			this.opacity -= this.fadeRate;
			this.timeSinceFade = 0;
		}

		this.isVisible = this.opacity > 0;
	}

	render() {
		ctx.save();

		ctx.fillStyle = `hsla(0, 0%, 50%, ${this.opacity})`;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.p.radius / 2, 0, Math.PI * 2, true);
		ctx.fill();

		ctx.restore();
	}
}

class SafePlatform {
	/**
	 * @param {Game} g
	 */
	constructor(g) {
		this.game = g;
		this.width = 400;
		this.height = 32;

		this.x = 0;
		this.y = canvas.height - this.height * 1.5;

		this.isVisible = true;
	}

	/**
	 * @param {number} elapsedTime
	 */
	update(elapsedTime) {
		this.x -= this.game.speed;
		this.isVisible = this.x + this.width > 0;
	}

	render() {
		ctx.save();
		ctx.fillStyle = "hsla(0, 0%, 20%, 1)";
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.restore();
	}
}

let kb = new KeyboardState();
let game = new Game(kb);
let platforms = [new SafePlatform(game)];
let player = new Player(platforms);
let tracers = [new Tracer(player, game)];

let currentTime = 0;

/**
 * @param {number} timestamp
 */
function gameLoop(timestamp) {
	let timeElapsed = timestamp - currentTime;
	currentTime = timestamp;
	// console.log(timeElapsed, timestamp);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	game.update(timeElapsed);
	game.render();

	tracers.push(new Tracer(player, game));

	tracers.forEach((t) => {
		t.update(timeElapsed);
		t.render();
	});

	player.update(timeElapsed);
	player.render();

	platforms.forEach((p) => {
		p.update(timeElapsed);
		p.render();
	});

	tracers = tracers.filter((t) => t.isVisible);

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
