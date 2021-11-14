// @ts-check

class PlayerTracer {
	/**
	 * @param {Player} player
	 * @param {Game} game
	 * @param {CanvasRenderingContext2D} ctx
	 */
	constructor(player, game, ctx) {
		this.x = player.x;
		this.y = player.y;

		this.game = game;
		this.ctx = ctx;

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
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		this.ctx.fillStyle = `hsla(0, 0%, 80%, ${this.opacity})`;
		this.ctx.fill();
		this.ctx.restore();
	}

	static lastPlayerTracer = 0;
	static playerTracerInterval = 500;
    /** @type {Array<PlayerTracer>} */
    static tracers = [];
    static manageTracers(player, game, ctx, timeElapsed) {
        PlayerTracer.tracers = PlayerTracer.tracers.filter((t) => t.isVisible);
        PlayerTracer.lastPlayerTracer += timeElapsed;
        if (PlayerTracer.lastPlayerTracer >= PlayerTracer.playerTracerInterval) {
            PlayerTracer.tracers.push(new PlayerTracer(player, game, ctx));
        }
    
    }
}
