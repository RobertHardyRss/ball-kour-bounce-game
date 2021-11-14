/// <reference path="keyboard-state.js">
// @ts-check

class Game {
	/**
	 * @param {KeyboardState} keyboardState
	 * @param {CanvasRenderingContext2D} [ctx]
	 */
	constructor(keyboardState, ctx) {
		this.keyboardState = keyboardState;
		this.ctx = ctx;

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
		this.ctx.drawImage(
			this.image,
			this.imageX,
			0,
			this.image.width,
			this.image.height
		);
		this.ctx.drawImage(
			this.image,
			this.imageX + this.image.width,
			0,
			this.image.width,
			this.image.height
		);
	}
}
