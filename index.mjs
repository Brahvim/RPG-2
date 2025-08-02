import p5 from "p5";

/**
 * @typedef { () => boolean } SketchCbckMousePressed
 */

/** @type { HTMLCanvasElement } */
const s_divSketchParent = document.querySelector("div.sketch#sketch0");

new class Sketch extends p5 {

	// #region Fields.

	/** @type { p5.Renderer | undefined } */ sketchRenderer;
	/** @type { HTMLCanvasElement } */ sketchElementCanvasParent;
	/** @type { boolean } */ sketchKeepAttemptingFullscreen = true;

	// #region Callback data.

	/** @type { Array<SketchCbckMousePressed> } */ sketchCbcksMousePressed = [];
	/** @type { SketchCbckMousePressed } */ sketchCbckMousePressedKeepAttemptingFullscreen;
	/** @type { Set<SketchCbckMousePressed> } */ sketchCbcksMousePressedStillAlive = new Set();

	// #endregion

	// #endregion

	// #region Constructor.
	constructor() {
		super(p => p, s_divSketchParent);
		this.sketchElementCanvasParent = s_divSketchParent;
	}


	setup() {
		// this.sketchRenderer = super.createCanvas(super.windowWidth, super.windowHeight, super.WEBGL);
		this.sketchRenderer = super.createCanvas(200, 200, super.WEBGL);
		super.resizeCanvas(super.windowWidth, super.windowHeight);

		this.sketchCbckMousePressedKeepAttemptingFullscreen = () =>
			this.sketchKeepAttemptingFullscreen && super.fullscreen(true);

		this.sketchCbcksMousePressed.push(this.sketchCbckMousePressedKeepAttemptingFullscreen);
	}

	draw() {
		super.background(0);
	}

	mousePressed() {
		this.sketchCbcksMousePressedStillAlive.clear();

		for (const cbck of this.sketchCbcksMousePressed) {

			if (cbck()) {

				this.sketchCbcksMousePressedStillAlive.push(cbck);

			}

		}

		this.sketchCbcksMousePressed.filter(cbck => this.sketchCbcksMousePressedStillAlive.has(cbck));
	}

	sketchResumeAttemptingFullscreen() {
		this.sketchKeepAttemptingFullscreen = true;
		this.sketchCbcksMousePressed.push(this.sketchCbckMousePressedKeepAttemptingFullscreen);
	}

};
