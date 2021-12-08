// @ts-check
/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;
const PLAYER_WIDTH = 32;

/** @param {number} pt */
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
	/** @param {Array<SafePlatform>} [platforms] */
	constructor(platforms) {
		this.platforms = platforms;
		this.maxBounceHeight = canvas.height / 2;
		this.yOfLastBounce = 0;
		this.x = canvas.width * 0.25;
		this.y = canvas.height / 2;
		this.prevY = 0;

		this.bounceTime = 2000;
		this.timeSinceLastBounce = 0;
		this.radius = PLAYER_WIDTH / 2;

		this.leftSide = this.x - this.radius;
		this.rightSide = this.x + this.radius;
		this.gradientStartOffset = this.radius * 0.4;
	}

	/** @param {number} elapsedTime */
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
		let rg = ctx.createRadialGradient(
			this.x - this.gradientStartOffset,
			this.y - this.gradientStartOffset,
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

class Game {
	/** @param {KeyboardState} kb */
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

		this.#wireUpListeners();

		this.bgImage = new Image();
		this.bgImage.src = "/images/waves_glow.png";

		this.imageHeight = canvas.height;
		this.imageWidth =
			(canvas.height * this.bgImage.width) / this.bgImage.height;
		this.imageX = 0;
	}

	/** @param {number} elapsedTime	 */
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

		// parallax by moving at 10% of speed
		this.imageX -= this.speed * 0.1;
		if (this.imageX + this.imageWidth <= 0) {
			this.imageX = 0;
		}
	}

	render() {
		this.#renderBackgroundImage();
		this.#renderScore();
	}

	#renderScore() {
		ctx.save();
		ctx.fillStyle = "pink";
		ctx.strokeStyle = "purple";
		ctx.font = "90px fantasy";

		ctx.fillText(`${this.score}`, this.scoreX, this.scoreY);
		ctx.strokeText(`${this.score}`, this.scoreX, this.scoreY);
		ctx.restore();
	}

	#renderBackgroundImage() {
		ctx.save();
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

		ctx.fillStyle = "hsla(120, 0%, 0%, 0.5)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
	}

	#wireUpListeners() {
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
	 * @param {number} c
	 */
	constructor(p, g, c) {
		this.p = p;
		this.g = g;
		this.color = c;

		this.x = p.x;
		this.y = p.y;

		this.isVisible = true;
		this.opacity = 0.8;

		this.fadeRate = 0.05;
		this.fadeInterval = 50;
		this.timeSinceFade = 0;
	}

	/** @param {number} timeElapsed */
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

		ctx.fillStyle = `hsla(${this.color}, 100%, 50%, ${this.opacity})`;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.p.radius / 2, 0, Math.PI * 2, true);
		ctx.fill();

		ctx.restore();
	}

	static lastPlayerTracer = 0;
	static playerTracerInterval = 50;
	static color = 0;
	/** @type {Array<Tracer>} */
	static tracers = [];
	static manageTracers(player, game, timeElapsed) {
		Tracer.tracers = Tracer.tracers.filter((t) => t.isVisible);
		Tracer.lastPlayerTracer += timeElapsed;
		if (Tracer.lastPlayerTracer >= Tracer.playerTracerInterval) {
			Tracer.tracers.push(new Tracer(player, game, this.color));
			Tracer.lastPlayerTracer = 0;
			this.color += 5;
			if (this.color > 360) this.color = 0;
		}
	}
}

class Platform {
	/** @param {Game} g	 */
	constructor(g) {
		this.game = g;
		this.width = 0;
		this.height = 0;
		this.x = 0;
		this.y = 0;
		this.isVisible = true;
		this.fillColor = "hsla(0, 0%, 20%, 1)";
		this.isScorable = false;
		this.isScored = false;
	}

	update() {
		this.x -= this.game.speed;
		this.isVisible = this.x + this.width > 0 && this.x < canvas.width;
	}

	render() {
		if (!this.isVisible) return;
		ctx.save();
		ctx.fillStyle = this.fillColor;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.restore();
	}
}

class SafePlatform extends Platform {
	/** @param {Game} g	 */
	constructor(g) {
		super(game);
		this.width = 400;
		this.height = 32;
		this.x = 0;
		this.y = canvas.height - this.height * 1.5;
		this.fillColor = "hsla(0, 0%, 20%, 1)";
	}
}

class ScorePlatform extends Platform {
	/** @param {Game} g */
	constructor(g) {
		super(g);
		this.width = PLAYER_WIDTH * 3;
		this.height = PLAYER_WIDTH;
		this.x = 0;
		this.y = canvas.height - 100 - Math.random() * 100;
		this.isVisible = true;
		this.isScorable = true;
		this.fillColor = "green";
	}

	update() {
		this.fillColor = this.isScored ? "purple" : "lime";
		super.update();
	}
}

class PlatformManager {
	/**
	 * @param {Platform[]} platforms
	 * @param {Game} game
	 */
	constructor(platforms, game) {
		this.platforms = platforms;
		this.game = game;
		this.spacerMin = PLAYER_WIDTH;
		this.spacerMultiplier = PLAYER_WIDTH * 12 - PLAYER_WIDTH;
	}

	update() {
		let lastPlatform = platforms[platforms.length - 1];
		let furthestX = lastPlatform.x + lastPlatform.width;

		while (furthestX < canvas.width * 2) {
			let spacer = Math.floor(
				Math.random() * this.spacerMultiplier + this.spacerMin
			);
			let nextPlatformType = Math.random();

			let p;

			if (nextPlatformType < 0.1) {
				p = new SafePlatform(this.game);
			} else {
				p = new ScorePlatform(this.game);
			}

			p.x = furthestX + spacer;
			this.platforms.push(p);
			furthestX += spacer + p.width;
		}
	}
}

let kb = new KeyboardState();
let game = new Game(kb);

let platforms = [new SafePlatform(game)];
let pm = new PlatformManager(platforms, game);
let player = new Player(platforms);
let currentTime = 0;

/** @param {number} timestamp */
function gameLoop(timestamp) {
	let timeElapsed = timestamp - currentTime;
	currentTime = timestamp;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	Tracer.manageTracers(player, game, timeElapsed);
	pm.update();
	let gameObjects = [game, ...Tracer.tracers, player, ...platforms];

	gameObjects.forEach((o) => {
		o.update(timeElapsed);
		o.render();
	});

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
