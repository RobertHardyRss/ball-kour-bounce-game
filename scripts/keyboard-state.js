// @ts-check

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
