import p5 from "p5";

const GL = WebGLRenderingContext;

/** @type { HTMLCanvasElement } */
const s_divSketchParent = document.querySelector("div.sketch#sketch0");

/**
 * @typedef { (...args: any[]) => boolean } SketchCbck
 * Called when an event occurs. Can return `true` if it wishes to be called next time said event occurs!
 */

/** ...Manages `SketchCbck`s! */
class SketchCbckManager {

	/** @type { Set<SketchCbck> } */ pactive = new Set();

	/** @type { SketchCbck[] } */ active = [];

	add(...p_callbacks) {
		for (const cbck of p_callbacks) {

			this.active.push(cbck);

		}
	}

	remove(...p_callbacks) {
		for (const cbck of p_callbacks) {

			const id = this.active.indexOf(cbck);

			if (id != -1) {

				this.active.splice(id, 1);

			}

		}
	}

	handleEvent(...p_eventArgs) {
		this.pactive.clear();

		for (const cbck of this.active) {

			if (!cbck(p_eventArgs)) {

				this.pactive.add(cbck);

			}

		}

		this.active = this.active.filter(cbck => !this.pactive.has(cbck));
	}

};

new class Sketch extends p5 {

	// #region Fields.
	dialogueBox = {

		convoIsLast: () => this.dialogueBox.idDialogue >= this.dialogueBox.convo.length - 1,

		/** @type { SketchCbck } */ cbckTouchStartedForConvo: () => {

			return this.dialogueBox.convoShouldExit();

		},

		/** @type { SketchCbck } */ cbckKeyPressedForConvo: () => {

			if (this.keyCode != 69) {

				return true;

			}

			return this.dialogueBox.convoShouldExit();

		},

		convoShouldExit: () => {

			if (!this.dialogueBox.convoIsLast()) {

				this.dialogueBox.cursor = 0;
				this.dialogueBox.idDialogue++;
				this.dialogueBox.buffer = "";

				return true;

			}

			this.cbcks.touchEnded.remove(this.dialogueBox.cbckTouchStartedForConvo);
			this.cbcks.keyPressed.remove(this.dialogueBox.cbckKeyPressedForConvo);
			this.player.resumeAllMovementControls();
			this.npcs.collisionResponse = () => { };
			this.dialogueBox.draw = () => { };
			this.dialogueBox.active = false;
			this.dialogueBox.idDialogue = 0;
			this.dialogueBox.cursor = 0;
			this.dialogueBox.buffer = "";

			return false;

		},

		drawImpl: () => {

			this.push();
			this.translate(0, this.height / 8);
			const fade = 255 * this.dialogueBox.fade;

			this.gl.disable(GL.DEPTH_TEST);
			const rr = 20;
			const rh = 80;
			const rw = this.width / 3;

			// #region Rectangle.
			this.push();

			this.rectMode(this.CENTER);
			this.fill(127, fade);
			this.noStroke();

			this.rect(0, 0, rw, rh, rr, rr, rr, rr);

			this.pop();
			// #endregion

			// #region Text.
			this.textSize(this.dialogueBox.textSize);
			this.fill(255, fade);
			this.noStroke();

			const dialogue = this.dialogueBox.convo[this.dialogueBox.idDialogue];
			const cursor = this.dialogueBox.cursor;
			this.dialogueBox.cursor++;

			if (cursor < dialogue.length) {

				this.dialogueBox.buffer += dialogue.charAt(cursor);

			}

			const text = this.dialogueBox.buffer;
			const tw = -rw / 2.25;
			const th = -rh / 6;

			this.text(text, tw, th);
			// #endregion

			this.pop();
			this.gl.enable(GL.DEPTH_TEST);

		},

		draw: () => { },

		idDialogue: 0,

		active: false,

		textSize: 12,

		buffer: "",

		convo: [""],

		cursor: 0,

		fade: 0.8,

	};

	player = {

		/** @param { p5.Vector } p_swipe */
		onSwipe: (p_swipe) => {

			if (this.abs(p_swipe.x) > this.abs(p_swipe.y)) {

				if (p_swipe.x > 0) {

					console.log("Right.");
					this.player.posAngle.x += this.player.speed;

				}
				else {

					console.log("Left.");
					this.player.posAngle.x -= this.player.speed;

				}

			}
			else {

				if (p_swipe.y > 0) {

					console.log("Down.");
					this.player.posAngle.y += this.player.speed;

				}
				else {

					console.log("Up.");
					this.player.posAngle.y -= this.player.speed;

				}

			}

		},

		// #region Other stuff.
		// #region Pause/Resume controls.
		resumeAllMovementControls: () => {

			this.player.keyboardMovementControls = this.player.keyboardControlsImpl;

		},

		pauseAllMovementControls: () => {

			this.player.keyboardMovementControls = () => { };

		},
		// #endregion

		// #region Keyboard controls.
		keyboardMovementControls: () => { }, // Called in `Sketch::draw()`!

		keyboardControlsImpl: () => {

			// It is predictable - if not, as I think, *"faster"* - and also much cheaper, to respond to movements here,
			// than via some callback that adds functions into a/an set/array to respond to movements.

			if (this.keyIsDown(87)) {

				this.player.posAngle.y -= this.player.speed;

			}
			if (this.keyIsDown(65)) {

				this.player.posAngle.x -= this.player.speed;

			}
			if (this.keyIsDown(83)) {

				this.player.posAngle.y += this.player.speed;

			}
			if (this.keyIsDown(68)) {

				this.player.posAngle.x += this.player.speed;

			}

			if (this.touches.length > 0) {

				const t = this.touches[0];



			}

		},
		// #endregion
		// #endregion

		/** @type { p5.Vector } `z` is touch ID! */
		touchStart: this.createVector(),

		/** @type { p5.Vector } */
		swipeBase: this.createVector(),

		/** @type { p5.Vector } */
		posAngle: this.createVector(),

		/** @type { Set<number> } */
		idsNpcsTouched: new Set(),

		isTouching: false,

		speed: 3,

		size: 20,

	};

	window = {

		/** @type { (orientation: string) => Promise<void> } */
		orientationLock: (() => {

			const method = (
				screen.mozLockOrientation
				||
				screen.msLockOrientation
				||
				screen.orientation.lock
				||
				screen.lockOrientation
			);

			return typeof (method) === Screen ? method : () => { };

		})(),

		cbckFullscreen: () => {

			this.fullscreen(true);
			return true;

		},

		cbckResizeCanvas: () => {

			this.resizeCanvas(window.innerWidth, window.innerHeight);
			return true;

		},

		pauseAttemptingResizeEveryResize: () => {

			this.cbcks.windowResized.remove(this.window.cbckResizeCanvas);

		},

		resumeAttemptingResizeEveryResize: () => {

			this.cbcks.windowResized.add(this.window.cbckResizeCanvas);

		},

		pauseAttemptingFullscreenEveryPress: () => {

			this.cbcks.touchStarted.remove(this.window.cbckFullscreen);
			this.cbcks.mousePressed.remove(this.window.cbckFullscreen);

		},

		resumeAttemptingFullscreenEveryPress: () => {

			this.cbcks.touchStarted.add(this.window.cbckFullscreen);
			this.cbcks.mousePressed.add(this.window.cbckFullscreen);

		},

	};

	sketch = {

		/** @type { p5.Renderer } */ renderer: undefined,
		/** @type { HTMLElement } */ elementCanvasParent: undefined,
		/** @type { HTMLCanvasElement } */ elementCanvas: undefined,
		/** @type { { x: number, y: number, id: number, }[] } */ ptouches: [],

	};

	cbcks = {

		windowResized: new SketchCbckManager(),		// Window callback.
		keyReleased: new SketchCbckManager(),		// Keyboard callback.
		keyPressed: new SketchCbckManager(),		// Keyboard callback.
		keyTyped: new SketchCbckManager(),			// Keyboard callback.
		touchEnded: new SketchCbckManager(),		// Touch callback.
		touchMoved: new SketchCbckManager(),		// Touch callback.
		touchStarted: new SketchCbckManager(),		// Touch callback.
		mouseMoved: new SketchCbckManager(),		// Mouse callback.
		mouseWheel: new SketchCbckManager(),		// Mouse callback.
		mouseClicked: new SketchCbckManager(),		// Mouse callback.
		mouseDragged: new SketchCbckManager(),		// Mouse callback.
		mousePressed: new SketchCbckManager(),		// Mouse callback.
		mouseReleased: new SketchCbckManager(),		// Mouse callback.
		doubleClicked: new SketchCbckManager(),		// Mouse callback.

	};

	npcs = {

		/**
		 * @type { () => void }
		 * @param { number } p_idNpcDetectedLast SoA index of the NPC touched last.
		 */
		collisionResponseOverworld: (p_idNpcDetectedLast) => {

			// this.dialogueBox.cursor = 0;
			// this.dialogueBox.buffer = "";
			// this.dialogueBox.active = true;
			this.dialogueBox.draw = this.dialogueBox.drawImpl;

			this.npcs.collisionResponse = () => { };
			this.player.pauseAllMovementControls();

			const convosAllNpcLast = this.npcs.conversations[p_idNpcDetectedLast];
			const idConvoCurrent = this.npcs.idsConversation[p_idNpcDetectedLast];
			this.dialogueBox.convo = convosAllNpcLast[idConvoCurrent];

			this.cbcks.keyPressed.add(this.dialogueBox.cbckKeyPressedForConvo);
			this.cbcks.touchStarted.add(this.dialogueBox.cbckTouchStartedForConvo);

		},

		/**
		 * @param { p5.Vector } p_posAngle
		 * @param { string[] } p_conversations
		 */
		create: (p_posAngle, p_conversations) => {

			this.npcs.idsDialogue.push(0);
			this.npcs.posAngles.push(p_posAngle);
			this.npcs.idsConversation.push(0);
			this.npcs.conversations.push(p_conversations);

		},

		/** @type { p5.Vector[] } */
		posAngles: [],

		/** @type { () => void } */
		collisionResponse: () => { },

		/** @type { string[][] } */
		conversations: [],

		/** @type { number[] } */
		idsConversation: [],

		/** @type { number[] } */
		idsDialogue: [],

	};

	rpg = {

		/** @type { p5.Font } */
		fontSonoRegular: undefined,

		setup: () => {

			this.npcs.collisionResponse = this.npcs.collisionResponseOverworld;
			this.player.resumeAllMovementControls();
			this.textFont(this.rpg.fontSonoRegular);

			this.npcs.create(
				this.createVector(100, 0),
				// All conversations:
				[

					// First conversation:
					[

						// First dialogue:
						"Ti's a beautiful day!",
						"Is it not for you?",

					],

				],
			);

			this.npcs.create(
				this.createVector(0, -50),
				// All conversations:
				[

					// First conversation:
					[

						// First dialogue:
						"This world needs a few more things!",

					],

				],
			);

		},

	};

	/** @type { WebGL2RenderingContext | WebGLRenderingContext } */
	gl = undefined;
	// #endregion

	draw() {
		// No longer works!
		// this.push();
		//
		// this.translate(this.width * -0.5, this.height * -0.5);
		// this.noStroke();
		// this.noSmooth();
		// this.fill(0, 12);
		// this.rect(0, 0, this.width, this.height);
		//
		// this.pop();
		this.background(0);

		this.push();
		// #region Camera!
		// Heck, my values work exactly LIKE the defaults!
		this.perspective(
			70,
			this.width / this.height,
			0.01,
			10_000
		); // (Okay, their FOV IS different and I can't find it for some reason.)

		this.camera(
			0, 0, this.width / 4,
			0, 0, 0,
			0, 1, 0
		);

		this.sketch.ptouches = this.touches;
		this.player.keyboardMovementControls();

		// #region Player render.
		this.push();
		this.rotateZ(this.player.posAngle.z);
		this.noStroke();
		this.fill(255);
		this.square(
			this.player.posAngle.x,
			this.player.posAngle.y,
			this.player.size,
		);
		this.pop();
		// #endregion

		// #region Check collisions.
		this.player.idsNpcsTouched.clear();
		let idNpcDetectedLast = 0;

		for (let i = 0; i < this.npcs.posAngles.length; i++) {

			const p = this.npcs.posAngles[i];

			const nLeft = p.x - (20 * 0.5);
			const nRight = p.x + (20 * 0.5);
			const nAbove = p.y - (20 * 0.5);
			const nBelow = p.y + (20 * 0.5);

			const pLeft = this.player.posAngle.x - (this.player.size * 0.5);
			const pRight = this.player.posAngle.x + (this.player.size * 0.5);
			const pAbove = this.player.posAngle.y - (this.player.size * 0.5);
			const pBelow = this.player.posAngle.y + (this.player.size * 0.5);

			const overlapping = !(
				pRight < nLeft
				|| pLeft > nRight
				|| pBelow < nAbove
				|| pAbove > nBelow
			);

			if (overlapping) {

				this.player.idsNpcsTouched.add(i);
				idNpcDetectedLast = i;

			}

		}

		if (this.player.idsNpcsTouched.size != 0) {

			this.npcs.collisionResponse(idNpcDetectedLast);

		}
		else {

			this.npcs.collisionResponse = this.npcs.collisionResponseOverworld;

		}
		// #endregion

		// #region NPC rendering.
		this.push();
		this.fill(255);
		this.noStroke();

		for (const p of this.npcs.posAngles) {

			this.push();

			this.rotateZ(p.z);
			this.square(p.x, p.y, 20);

			this.pop();


		}

		this.pop();
		// #endregion

		this.dialogueBox.draw();
		// #endregion
		this.pop();

		// #region 2D rendering.
		// Aids off-3D rendering!:
		this.translate(this.width * -0.5, this.height * -0.5);

		// Touch debugging:
		if (this.touches.length != 0) {

			this.push();

			this.fill(255);
			this.noStroke();
			const t = this.touches[0];
			this.circle(t.x, t.y, 25);

			this.pop();

		}
		// #endregion
	}

	setup() {
		this.sketch.renderer = this.createCanvas(window.innerWidth, window.innerHeight, this.WEBGL);
		this.sketch.elementCanvas = this.sketch.elementCanvasParent.querySelector("canvas");
		this.window.resumeAttemptingFullscreenEveryPress();
		this.window.orientationLock("landscape-primary");
		this.window.resumeAttemptingResizeEveryResize();
		this.textFont(this.rpg.fontSonoRegular);
		this.gl = this.sketch.renderer.GL;
		this.rpg.setup();
	}

	preload() {
		this.loadFont("/Sono-Regular.ttf", (p_font) => {

			this.rpg.fontSonoRegular = p_font;

		});
	}

	constructor() {
		super(p => p, s_divSketchParent);

		for (const [cbck, man] of Object.entries(this.cbcks)) {

			this[cbck] = man.handleEvent.bind(man);

		}

		this.sketch.elementCanvasParent = s_divSketchParent;
	}

};
