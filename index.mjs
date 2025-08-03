import p5 from "p5";

/**
 * @typedef { () => boolean } SketchCbckMousePressed
 */

/** @type { HTMLCanvasElement } */
const s_divSketchParent = document.querySelector("div.sketch#sketch0");

new class Sketch extends p5 {

	// #region Fields.

	// #region Sketch.

	/** @type { p5.Renderer | undefined } */ sketchRenderer;
	/** @type { HTMLCanvasElement } */ sketchElementCanvasParent;
	/** @type { boolean } */ sketchKeepAttemptingFullscreen = true;
	/** @type { WebGL2RenderingContext | WebGLRenderingContext } */ sketchWebGlCtx;

	// #region Callback data.

	/** @type { Array<SketchCbckMousePressed> } */ sketchCbcksMousePressed = [];
	/** @type { Set<SketchCbckMousePressed> } */ sketchCbcksMousePressedStillAlive = new Set();
	/** @type { SketchCbckMousePressed } */ sketchCbckMousePressedKeepAttemptingFullscreen = () => {

		return this.sketchKeepAttemptingFullscreen && super.fullscreen(true);

	};

	// #endregion

	// #endregion

	// #region RPG.

	/** @type { p5.Font } */ rpgFontSonoRegular = undefined;

	rpgDialogueBox = {

		/** @type { () => void } */ drawImpl: () => {

			super.push();
			this.sketchWebGlCtx.disable(WebGLRenderingContext.DEPTH_TEST);

			super.translate(
				-0.25 * super.width
				// * -0.1
				// * super.abs(
				// 	super.sin(
				// 		0.001 * super.millis()
				// 	)
				// )
				,
				0
			);
			super.rect(0, 0, super.width / 3, 80);
			super.text("WEEEEEEEEEEEEEEEE!");

			this.sketchWebGlCtx.enable(WebGLRenderingContext.DEPTH_TEST);
			super.pop();

		},
		/** @type { () => void } */ draw: () => { },

	};

	rpgPlayer = {

		/** @type { p5.Vector | undefined } */ velPosAngle: undefined,
		/** @type { p5.Vector | undefined } */ posAngle: undefined,
		/** @type { Set<number> } */ idsNpcsTouched: new Set(),
		/** @type { () => void } */ readInputsImpl: () => {

			// It is predictable - if not, as I think, *"faster"* - and also much cheaper, to respond to movements here,
			// than via some callback that adds functions into a/an set/array to respond to movements.

			if (super.keyIsDown("w") || super.keyIsDown("W")) {

				this.rpgPlayer.posAngle.y -= this.rpgPlayer.speed;

			}
			else if (super.keyIsDown("a") || super.keyIsDown("A")) {

				this.rpgPlayer.posAngle.x -= this.rpgPlayer.speed;

			}
			else if (super.keyIsDown("s") || super.keyIsDown("S")) {

				this.rpgPlayer.posAngle.y += this.rpgPlayer.speed;

			}
			else if (super.keyIsDown("d") || super.keyIsDown("D")) {

				this.rpgPlayer.posAngle.x += this.rpgPlayer.speed;

			}

			this.rpgPlayer.posAngle.add(this.rpgPlayer.velPosAngle);

		},
		/** @type { () => void } */ readInputs: () => { },
		/** @type { number } */ speed: 3,
		/** @type { number } */ size: 20,

	};

	rpgNpcs = {

		/** @type { number[] } */ idsConversation: [],
		/** @type { string[][] } */ conversations: [],
		/** @type { p5.Vector[] } */ posAngles: [],
		/** @type { number[] } */ idsDialogue: [],

	};

	// #endregion

	// #region Constructor.
	constructor() {
		super(p => p, s_divSketchParent);
		this.sketchElementCanvasParent = s_divSketchParent;
	}

	// #region RPG methods.

	rpgSetup() {
		super.loadFont("/Sono-Regular.ttf", (p_font) => {

			this.rpgFontSonoRegular = p_font;
			super.textFont(this.rpgFontSonoRegular);

		});

		this.rpgPlayer.velPosAngle = super.createVector();
		this.rpgPlayer.posAngle = super.createVector();

		this.rpgNpcCreate(
			super.createVector(40, -40),
			[

				[

					"Ti's a beautiful day!",

				],

			],
		);
	}

	/**
	 * @param { p5.Vector } p_pos
	 * @param { string[] } p_conversations
	 */
	rpgNpcCreate(p_pos, p_conversations) {
		this.rpgNpcs.idsDialogue.push(0);
		this.rpgNpcs.posAngles.push(p_pos);
		this.rpgNpcs.idsConversation.push(0);
		this.rpgNpcs.conversations.push(p_conversations);
	}

	// #endregion

	setup() {
		this.sketchRenderer = super.createCanvas(window.innerWidth, window.innerHeight, super.WEBGL);
		this.sketchCbcksMousePressed.push(this.sketchCbckMousePressedKeepAttemptingFullscreen);

		this.sketchCanvas = this.sketchElementCanvasParent.querySelector("canvas");
		this.sketchWebGlCtx = this.sketchRenderer.GL;

		// this.sketchCanvasResizeFull();
		this.rpgSetup();
	}

	draw() {
		super.background(0);
		// super.translate(
		// 	-0.5 * super.width,
		// 	-0.5 * super.height,
		// );

		// Ain't these the defaults?!:
		// super.perspective(
		// 	2 * super.atan(super.height / 2 / 800),
		// 	super.width / super.height,
		// 	80,
		// 	8_000
		// );

		// // Heck, my values work exactly LIKE the defaults!
		// super.perspective(
		// 	// 70,
		// 	// super.width / super.height,
		// 	// 0.01,
		// 	// 10_000
		// ); // (Okay, their FOV IS different and I can't find it for some reason.)

		super.camera(
			0, 0, super.width / 4,
			0, 0, 0,
			0, 1, 0
		);

		this.rpgPlayer.readInputs();

		// #region Player render.

		super.push();
		super.rotateZ(this.rpgPlayer.posAngle.z);
		super.noStroke();
		super.fill(255);
		super.square(
			this.rpgPlayer.posAngle.x,
			this.rpgPlayer.posAngle.y,
			this.rpgPlayer.size,
		);
		super.pop();

		// #endregion

		// #region Player-NPC collision.

		this.rpgPlayer.idsNpcsTouched.clear();

		for (let i = 0; i < this.rpgNpcs.posAngles.length; i++) {

			const p = this.rpgNpcs.posAngles[i];

			const nLeft = p.x - (20 * 0.5);
			const nRight = p.x + (20 * 0.5);
			const nAbove = p.y - (20 * 0.5);
			const nBelow = p.y + (20 * 0.5);

			const pLeft = this.rpgPlayer.posAngle.x - (this.rpgPlayer.size * 0.5);
			const pRight = this.rpgPlayer.posAngle.x + (this.rpgPlayer.size * 0.5);
			const pAbove = this.rpgPlayer.posAngle.y - (this.rpgPlayer.size * 0.5);
			const pBelow = this.rpgPlayer.posAngle.y + (this.rpgPlayer.size * 0.5);

			const overlapping = !(
				pRight < nLeft
				|| pLeft > nRight
				|| pBelow < nAbove
				|| pAbove > nBelow
			);

			if (overlapping) {

				this.rpgPlayer.idsNpcsTouched.add(i);

			}

		}

		if (this.rpgPlayer.idsNpcsTouched.size !== 0) {

			this.rpgPlayer.readInputs = () => { };
			this.rpgDialogueBox.draw = this.rpgDialogueBox.drawImpl;

		} else {

			this.rpgPlayer.readInputs = this.rpgPlayer.readInputsImpl;

		}

		// #endregion

		this.rpgDialogueBox.draw();

		// #region NPC rendering.
		super.push();
		super.fill(255);
		super.noStroke();

		for (const p of this.rpgNpcs.posAngles) {

			super.push();

			super.rotateZ(p.z);
			super.square(p.x, p.y, 20);

			super.pop();


		}

		super.pop();
		// #endregion
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

	windowResized() {
		super.resizeCanvas(window.innerWidth, window.innerHeight);
		// this.sketchCanvasResize(super.windowWidth, super.windowHeight);
	}

	sketchCanvasResizeFull() {
		this.sketchCanvas.style.width = `100%`;
		this.sketchCanvas.style.height = `100%`;
	}

	sketchResumeAttemptingFullscreen() {
		this.sketchKeepAttemptingFullscreen = true;
		this.sketchCbcksMousePressed.push(this.sketchCbckMousePressedKeepAttemptingFullscreen);
	}

	/**
	 * @param { number } p_width In pixels!
	 * @param { number } p_height In pixels!
	*/
	sketchCanvasResize(p_width, p_height) {
		this.sketchCanvas.style.width = `${p_width}px`;
		this.sketchCanvas.style.height = `${p_height}px`;
	}

};
