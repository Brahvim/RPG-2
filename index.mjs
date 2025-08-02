/**
 * @typedef { () => boolean } SketchCbckMousePressed
 */

/** @type { HTMLDivElement } */ const s_divSketch = document.querySelector("div.sketch#sketch0");

// #region Variables.

// #region Sketch.
/** @type { HTMLCanvasElement } */ let sketchCanvas;
/** @type { p5.Renderer | undefined } */ let sketchRenderer;
/** @type { boolean } */ let sketchKeepAttemptingFullscreen = true;
/** @type { HTMLCanvasElement } */ let sketchElementCanvasParent = s_divSketch;

// #region Callback data.

/** @type { Array<SketchCbckMousePressed> } */ const sketchCbcksMousePressed = [];
/** @type { SketchCbckMousePressed } */ let sketchCbckMousePressedKeepAttemptingFullscreen;
/** @type { Set<SketchCbckMousePressed> } */ const sketchCbcksMousePressedStillAlive = new Set();

// #endregion

// #endregion

// #region RPG.
const rpgPlayer = {

	/** @type { p5.Vector | undefined }) */
	pos: undefined,
	speed: 3,

};

// #endregion

// #endregion

window.setup = function () {
	sketchRenderer = createCanvas(200, 200, WEBGL, s_divSketch);
	sketchCanvas = s_divSketch.querySelector("canvas");
	sketchCanvasResizeFull();

	sketchCbckMousePressedKeepAttemptingFullscreen = () =>
		sketchKeepAttemptingFullscreen && fullscreen(true);

	sketchCbcksMousePressed.push(sketchCbckMousePressedKeepAttemptingFullscreen);

	rpgSetup();
}

window.rpgSetup = function () {
	rpgPlayer.pos = createVector(20, 20, 0);
}

window.draw = function () {
	translate(-0.5 * width, -0.5 * height);
	background(

		50 * abs(
			sin(
				0.001 * millis()
			)
		)

	);
	fill(0);

	camera();
	perspective();

	rotateZ(rpgPlayer.pos.z);
	circle(rpgPlayer.pos.x, rpgPlayer.pos.y, 10);
}

window.mousePressed = function () {
	sketchCbcksMousePressedStillAlive.clear();

	for (const cbck of sketchCbcksMousePressed) {

		if (cbck()) {

			sketchCbcksMousePressedStillAlive.push(cbck);

		}

	}

	sketchCbcksMousePressed.filter(cbck => sketchCbcksMousePressedStillAlive.has(cbck));
}

window.windowResized = function () {
	sketchCanvasResizeFull();
}

window.sketchCanvasResizeFull = function () {
	sketchCanvas.style.width = `100%`;
	sketchCanvas.style.height = `100%`;
}

/**
 * @param { number } p_width In pixels!
 * @param { number } p_height In pixels!
*/
window.sketchCanvasResize = function (p_width, p_height) {
	sketchCanvas.style.width = `${p_width}px`;
	sketchCanvas.style.height = `${p_height}px`;
}

window.sketchResumeAttemptingFullscreen = function () {
	sketchKeepAttemptingFullscreen = true;
	sketchCbcksMousePressed.push(sketchCbckMousePressedKeepAttemptingFullscreen);
}

