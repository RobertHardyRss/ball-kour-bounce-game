// @ts-check
/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

const PLAYER_WIDTH = 32;

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
		this.xDirection = -1;
		this.registerEventHandlers();
	}

	registerEventHandlers() {
		window.addEventListener("keydown", (e) => {
			switch (e.key) {
				case "s":
				case "ArrowDown":
					this.isBraking = true;
					break;
				case "a":
				case "ArrowLeft":
					this.isAccelerating = true;
					this.xDirection = 1;
					break;
				case "d":
				case "ArrowRight":
					this.isAccelerating = true;
					this.xDirection = -1;
					break;
			}
		});

		window.addEventListener("keyup", (e) => {
			switch (e.key) {
				case "s":
				case "ArrowDown":
					this.isBraking = false;
					break;
				case "a":
				case "ArrowLeft":
					this.isAccelerating = false;
					this.xDirection = 1;
					break;
				case "d":
				case "ArrowRight":
					this.isAccelerating = false;
					this.xDirection = -1;
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
		this.prevY = 0;

		this.bounceTime = 2000;
		this.timeSinceLastBounce = 0;
		this.radius = PLAYER_WIDTH / 2;

		this.leftSide = this.x - this.radius / 2;
		this.rightSide = this.x + this.radius / 2;
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
			let isInside =
				this.rightSide >= p.x && this.leftSide <= p.x + p.width;
			let isPlatformBelowMe =
				isInside && (this.y < p.y || this.prevY < p.y);

			if (
				isMovingDown &&
				isPlatformBelowMe &&
				this.y + this.radius >= p.y
			) {
				this.timeSinceLastBounce = 0;
				this.yOfLastBounce = p.y;

				let event = new CustomEvent("bkb-bounce", { detail: p });
				document.dispatchEvent(event);
			}
		});

		this.prevY = this.y;
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
		this.maxSpeed = 50;
		this.accelerationRate = 2;
		this.accelerationInterval = 100;
		this.timeSinceLastAcceleration = 0;

		this.score = 0;
		this.scoreX = canvas.width - 150;
		this.scoreY = 95;

		this.wireUpListeners();

		this.bgImage = new Image();
		this.bgImage.src = "/images/waves_glow.png";

		// w / 600 = 2048 / 1152

		this.imageHeight = canvas.height;
		this.imageWidth =
			(canvas.height * this.bgImage.width) / this.bgImage.height;
		this.imageX = 0;
	}

	/**
	 * @param {number} elapsedTime
	 */
	update(elapsedTime) {
		this.timeSinceLastAcceleration += elapsedTime;
		let absSpeed = Math.abs(this.speed);

		if (
			this.kb.isAccelerating &&
			absSpeed < this.maxSpeed &&
			this.timeSinceLastAcceleration >= this.accelerationInterval
		) {
			absSpeed += this.accelerationRate;
			this.timeSinceLastAcceleration = 0;
		}

		if (this.kb.isBraking) {
			absSpeed = 0;
			this.timeSinceLastAcceleration = 0;
		}

		if (
			!this.kb.isAccelerating &&
			!this.kb.isBraking &&
			this.timeSinceLastAcceleration >= this.accelerationInterval * 5 &&
			absSpeed > 0
		) {
			// decelerating
			absSpeed -= this.accelerationRate;
			this.timeSinceLastAcceleration = 0;
		}

		this.speed = absSpeed * this.kb.xDirection;
		this.imageX += this.speed;
		if (this.imageX <= this.imageWidth * -1) this.imageX = 0;
	}

	render() {
		this.renderBackground();

		ctx.save();
		ctx.fillStyle = "pink";
		ctx.strokeStyle = "purple";
		ctx.font = "90px fantasy";

		ctx.fillText(`${this.score}`, this.scoreX, this.scoreY);
		ctx.strokeText(`${this.score}`, this.scoreX, this.scoreY);
		ctx.restore();
	}

	renderBackground() {
		ctx.save();

		ctx.drawImage(
			this.bgImage,
			this.imageX - this.imageWidth,
			0,
			this.imageWidth,
			this.imageHeight
		);
		ctx.drawImage(
			this.bgImage,
			this.imageX,
			0,
			this.imageWidth,
			this.imageHeight
		);
		ctx.drawImage(
			this.bgImage,
			this.imageX + this.imageWidth,
			0,
			this.imageWidth,
			this.imageHeight
		);
		ctx.fillStyle = "hsla(120, 100%, 50%, 0.2)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
	}

	wireUpListeners() {
		document.addEventListener("bkb-bounce", (e) => {
			// @ts-ignore
			let p = e.detail;

			if (p.isScorable && !p.isScored) {
				this.score++;
				p.isScored = true;
			}
		});
	}
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
		this.x += this.g.speed;

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
		this.x += this.game.speed;
		this.isVisible = this.x + this.width > 0 && this.x < canvas.width;
	}

	render() {
		if (!this.isVisible) return;

		ctx.save();
		ctx.fillStyle = "hsla(0, 0%, 20%, 1)";
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.restore();
	}
}

class ScorePlatform {
	/**
	 * @param {Game} g
	 */
	constructor(g) {
		this.game = g;
		this.width = PLAYER_WIDTH * 2;
		this.height = canvas.height;

		this.x = 0;
		this.y = canvas.height - 100;

		this.isVisible = true;

		this.isScored = false;
		this.isScorable = true;
	}

	/**
	 * @param {number} elapsedTime
	 */
	update(elapsedTime) {
		this.x += this.game.speed;
		this.isVisible = this.x + this.width > 0 && this.x < canvas.width;
	}

	render() {
		if (!this.isVisible) return;
		ctx.save();
		ctx.fillStyle = "hsla(120, 100%, 50%, 1)";
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.restore();
	}
}

class PlatformManager {
	constructor(platforms, game) {
		this.platforms = platforms;
		this.game = game;

		this.minSpacer = 1 * PLAYER_WIDTH;
		let maxSpacer = 10 * PLAYER_WIDTH;
		this.spacerMultiplier = maxSpacer - this.minSpacer;
	}

	update() {
		let lastPlatform = platforms[platforms.length - 1];
		let furthest = lastPlatform.x + lastPlatform.width;

		while (furthest <= canvas.width * 2) {
			let spacer = Math.floor(
				Math.random() * this.spacerMultiplier + this.minSpacer
			);
			const nextPlatformType = Math.random();

			let p;
			if (nextPlatformType <= 0.1) {
				p = new SafePlatform(this.game);
			} else {
				p = new ScorePlatform(this.game);
			}
			p.x = furthest + spacer;
			this.platforms.push(p);
			furthest += spacer + p.width;
		}
	}
}

let kb = new KeyboardState();
let game = new Game(kb);

let platforms = [new SafePlatform(game)];
let platformManager = new PlatformManager(platforms, game);
let player = new Player(platforms);
let tracers = [new Tracer(player, game)];

let currentTime = 0;

/**
 * @param {number} timestamp
 */
function gameLoop(timestamp) {
	let timeElapsed = timestamp - currentTime;
	currentTime = timestamp;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	tracers.push(new Tracer(player, game));
	platformManager.update();
	let gameObjects = [game, ...tracers, player, ...platforms];

	gameObjects.forEach((o) => {
		o.update(timeElapsed);
		o.render();
	});

	tracers = tracers.filter((t) => t.isVisible);

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
