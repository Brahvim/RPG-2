import p5 from "p5";

const NULLFN = () => { };
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
	/** @returns { number } */ distSq2d = (x1, y1, x2, y2) => this.sq(x2 - x1) + this.sq(y2 - y1);

	/** @type { WebGL2RenderingContext | WebGLRenderingContext } */ gl = undefined;

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
			this.npcs.collisionResponse = NULLFN;
			this.dialogueBox.draw = NULLFN;
			this.dialogueBox.active = false;
			this.dialogueBox.idDialogue = 0;
			this.dialogueBox.cursor = 0;
			this.dialogueBox.buffer = "";

			return false;

		},

		drawImpl: () => {

			this.push();

			this.translate(this.width / 2, this.height * 0.8);
			const rh = this.height * this.displayDensity() * 0.12;
			const fade = 255 * this.dialogueBox.fade;
			const rw = this.width * 0.5;
			const rr = 20; // Just 4% of width!
			this.scale(1.5);

			// #region Rectangle.
			this.push();

			this.rectMode(this.CENTER);
			this.fill(127, fade);
			this.curveDetail(6);
			this.noStroke();

			this.rect(0, 0, rw, rh, rr, rr, rr, rr);

			this.pop();
			// #endregion

			// #region Text.
			const dialogue = this.dialogueBox.convo[this.dialogueBox.idDialogue];
			const cursor = this.dialogueBox.cursor;
			this.dialogueBox.cursor++;

			if (cursor < dialogue.length) {

				this.dialogueBox.buffer += dialogue.charAt(cursor);

			}

			const text = this.dialogueBox.buffer;
			const tw = -rw / 2.25;
			const th = -rh / 8;

			this.push();

			this.textSize(rw * 0.04);
			this.fill(255, fade);
			this.noStroke();
			this.text(text, tw, th);

			this.pop();
			// #endregion

			this.pop();

		},

		draw: NULLFN,

		idDialogue: 0,

		active: false,

		textSize: 12,

		buffer: "",

		convo: [""],

		cursor: 0,

		fade: 0.8,

	};

	player = {

		// #region Other stuff.
		// #region Pause/Resume controls.
		resumeAllMovementControls: () => {

			this.player.movementControls = this.player.movementControlsImpl;
			this.cbcks.touchStarted.add(this.stick.cbckTouchStarted);
			this.cbcks.touchStarted.add(this.dpad.cbckTouchStarted);

		},

		pauseAllMovementControls: () => {

			this.cbcks.touchStarted.remove(this.stick.cbckTouchStarted);
			this.cbcks.touchStarted.remove(this.dpad.cbckTouchStarted);
			this.player.movementControls = NULLFN;

		},
		// #endregion

		// #region Keyboard controls.
		movementControlsImpl: () => {

			// It is predictable - if not, as I think, *"faster"* - and also much cheaper, to respond to movements here,
			// than via some callback that adds functions into a `Set` / an array to respond to movements.

			const dt = this.deltaTime * 0.1; // Actually perfy, 'cause it also saves an access.

			if (this.keyIsDown(87)) {

				this.player.posAngle.y -= this.player.speed * dt;

			}
			if (this.keyIsDown(65)) {

				this.player.posAngle.x -= this.player.speed * dt;

			}
			if (this.keyIsDown(83)) {

				this.player.posAngle.y += this.player.speed * dt;

			}
			if (this.keyIsDown(68)) {

				this.player.posAngle.x += this.player.speed * dt;

			}

			if (this.stick.draw == this.stick.drawImpl) { // Control if stick is rendering.

				// Aaaaaaaand this is why I hate square roots.
				const nx = this.stick.normalized.x;
				const ny = this.stick.normalized.y;

				this.player.posAngle.x += nx ? nx : 0;
				this.player.posAngle.y += ny ? ny : 0;

			}

		},

		movementControls: NULLFN, // Called in `Sketch::draw()`!
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

			return typeof (method) === Screen ? method : NULLFN;

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

	stick = {

		/** @type { p5.Vector } */ normalized: this.createVector(0, 0, 0),
		/** @type { p5.Vector } */ base: this.createVector(0, 0, 45),
		/** @type { p5.Vector } */ top: this.createVector(0, 0, 20),

		/** @type { SketchCbck } */	cbckTouchStarted: () => {

			// All three of these exist for cosmetic reasons:
			this.stick.base.x = this.touches[0].x;
			this.stick.base.y = this.touches[0].y;
			this.stick.draw = this.stick.drawImpl;
			return true;

		},

		/** @type { SketchCbck } */	cbckTouchMoved: () => {

			// #region Touches magic!
			const ty = this.touches[0].y;
			const tx = this.touches[0].x;

			const dx = tx - this.stick.base.x;
			const dy = ty - this.stick.base.y;
			// const mag = this.createVector(dx, dy).mag(); // A performance test for mobile! A FAILED test!
			// const mag = this.sqrt(this.sq(dx) + this.sq(dy)); // Even `p5::abs()` CAN'T save this from negative numbers.
			// const mag = Math.sqrt(this.sq(dx) + this.sq(dy)); // Direct-access speed number up?
			const mag = Math.pow(this.sq(dx) + this.sq(dy), 0.5); // Apparently this can be faster for math'tical reasons.

			this.stick.normalized.z = mag;
			this.stick.normalized.x = dx / mag;
			this.stick.normalized.y = dy / mag;
			// #endregion

			return true;

		},

		/** @type {	SketchCbck } */ cbckTouchEnded: () => {

			this.stick.draw = NULLFN;
			return true;

		},

		drawImpl: () => {

			// #region Base rendering.
			this.push();

			this.strokeWeight(8);
			this.curveDetail(1);
			this.stroke(192);
			this.noFill();
			this.circle(
				this.stick.base.x,
				this.stick.base.y,
				this.stick.base.z * 2
			);

			this.pop();
			// #endregion

			// #region Touches magic! // Now in `this::stick::cbckTouchMoved()`.
			// const ty = this.touches[0].y;
			// const tx = this.touches[0].x;

			// const dx = tx - this.stick.base.x;
			// const dy = ty - this.stick.base.y;
			// // const mag = this.createVector(dx, dy).mag(); // A performance test for mobile! A FAILED test!
			// // const mag = this.sqrt(this.sq(dx) + this.sq(dy)); // Even `p5::abs()` CAN'T save this from negative numbers.
			// // const mag = Math.sqrt(this.sq(dx) + this.sq(dy)); // Direct-access speed number up?
			// const mag = Math.pow(this.sq(dx) + this.sq(dy), 0.5); // Apparently this can be faster for math'tical reasons.

			// this.stick.normalized.z = mag;
			// this.stick.normalized.x = dx / mag;
			// this.stick.normalized.y = dy / mag;
			// #endregion

			// #region Top rendering.
			this.push();

			this.fill(64);
			this.noStroke();
			this.curveDetail(1);
			const ty = this.touches[0].y;
			const tx = this.touches[0].x;
			const size = this.stick.base.z * 0.6775; // Derived off of the visual precision of `base.z = 150` and `top.z = 80` .

			if (this.stick.normalized.z < size) {

				this.circle(tx, ty, this.stick.top.z);

			}
			else { // Render top circle RIGHT behind edges if the swipe isn't inside.

				this.translate(
					this.stick.base.x + (this.stick.normalized.x * size),
					this.stick.base.y + (this.stick.normalized.y * size)
				);
				this.circle(0, 0, this.stick.top.z);

			}

			this.pop();
			// #endregion

		},

		draw: NULLFN,

	};

	dpad = {

		/** @type { p5.Vector } */ base: this.createVector(0, 0, 50),
		/** @type { p5.Vector } */ gap: 0.9,

		/** @type { SketchCbck } */	cbckTouchStarted: () => {

			// All three of these exist for cosmetic reasons:
			this.dpad.base.x = this.touches[0].x;
			this.dpad.base.y = this.touches[0].y;
			this.dpad.draw = this.dpad.drawImpl;
			return true;

		},

		/** @type { SketchCbck } */	cbckTouchMoved: () => {

			const dt = this.deltaTime * 0.1;
			const base = this.dpad.base;
			const gap = this.dpad.gap;

			// Approximate size of arrow hitbox relative to base.z
			const w = base.z * 0.6;
			const h = base.z * 0.9;

			/** Takes D-pad button center. */
			const dpadButtonTouched = (x, y) => {

				const pt = this.touches[0];

				const top = y - h / 2;
				const left = x - w / 2;
				const right = x + w / 2;
				const bottom = y + h / 2;

				return !(pt.x < left || pt.x > right || pt.y < top || pt.y > bottom);

			};

			if (dpadButtonTouched(
				base.x,
				base.y - gap
			)) { // W

				this.player.posAngle.y -= this.player.speed * dt;

			}
			if (dpadButtonTouched(
				base.x - gap,
				base.y
			)) { // A

				this.player.posAngle.x -= this.player.speed * dt;

			}
			if (dpadButtonTouched(
				base.x,
				base.y + gap
			)) { // S

				this.player.posAngle.y += this.player.speed * dt;

			}
			if (dpadButtonTouched(
				base.x + gap,
				base.y
			)) { // D

				this.player.posAngle.x += this.player.speed * dt;

			}

			return true;

		},

		/** @type {	SketchCbck } */ cbckTouchEnded: () => {

			this.dpad.draw = NULLFN;
			return true;

		},

		drawImpl: () => {

			this.push();

			this.translate(this.dpad.base.x, this.dpad.base.y);

			const arrow = () => {

				this.beginShape(this.TESS);

				this.vertex(-0.5, 0.35);
				this.vertex(0.5, 0.35);
				this.vertex(0.5, -0.35);
				// this.edge(true);
				this.vertex(0, -0.85);
				// this.edge(false);
				this.vertex(-0.5, -0.35);

				this.endShape(this.CLOSE);

			};

			this.scale(this.dpad.base.z);
			this.fill(127, 127);
			this.noStroke();

			this.push(); // W.
			this.translate(0, -this.dpad.gap);
			this.rotateZ(0);
			arrow();
			this.pop();

			this.push(); // A.
			this.translate(-this.dpad.gap, 0);
			this.rotateZ(-this.HALF_PI);
			arrow();
			this.pop();

			this.push(); // S.
			this.translate(0, this.dpad.gap);
			this.rotateZ(this.PI);
			arrow();
			this.pop();

			this.push(); // D.
			this.translate(this.dpad.gap, 0);
			this.rotateZ(this.HALF_PI);
			arrow();
			this.pop();

			this.pop();

		},

		draw: NULLFN,

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

			this.npcs.collisionResponse = NULLFN;
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

		/** @type { () => void 	} 	*/	collisionResponse: NULLFN,
		/** @type { number[] 	}	*/	idsConversation: [],
		/** @type { string[][] 	} 	*/	conversations: [],
		/** @type { number[] 	}	*/	idsDialogue: [],
		/** @type { p5.Vector[] } 	*/	posAngles: [],

	};

	rpg = {

		/** @type { p5.Font } */
		fontSonoRegular: undefined,

		setup: () => {

			this.npcs.collisionResponse = this.npcs.collisionResponseOverworld;

			this.cbcks.touchStarted.add(this.dpad.cbckTouchStarted);
			this.cbcks.touchMoved.add(this.dpad.cbckTouchMoved);
			this.cbcks.touchEnded.add(this.dpad.cbckTouchEnded);

			this.cbcks.touchStarted.add(this.stick.cbckTouchStarted);
			this.cbcks.touchMoved.add(this.stick.cbckTouchMoved);
			this.cbcks.touchEnded.add(this.stick.cbckTouchEnded);

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
	// #endregion

	draw() {
		this.sketch.ptouches = this.touches;
		this.player.movementControls();

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

		// this.push();
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

		// #endregion
		// this.pop();

		// #region 2D rendering.
		this.resetMatrix();
		this.ortho(0, this.width, -this.height, 0, -1000, 1000); // Ortho for HUD

		this.dialogueBox.draw();
		// this.stick.draw();
		this.dpad.draw();
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
		this.frameRate(1000);
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
