import p5 from "p5";

/** @type { HTMLCanvasElement } */
const s_divSketchParent = document.querySelector("div.sketch#sketch0");

/** @typedef { (...args: any[]) => boolean } SketchCbckWebEvent Called when an event occurs. Can return `true` if it wishes to be called next time said event occurs! */
class SketchCbckWebEventManager {

	/** @type { SketchCbckWebEvent[] } */
	active = [];

	/**
	* Cached here for future access.
	* @type { Set<SketchCbckWebEvent> }
	*/
	pactive = new Set();

	remove(...p_callbacks) {
		for (const cbck of p_callbacks) {

			const id = this.active.indexOf(cbck);

			if (id != -1) {

				this.active.splice(id, 1);

			}

		}
	}

	handleEvent(...p_eventArgs) {
		if (this.active.length ? this.active : "") {

			console.log(this.active);

		}

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
	rpg = {

		/**
		 * @param { p5.Vector } p_pos
		 * @param { string[] } p_conversations
		 */
		npcCreate: (p_pos, p_conversations) => {

			this.rpg.npcs.idsDialogue.push(0);
			this.rpg.npcs.posAngles.push(p_pos);
			this.rpg.npcs.idsConversation.push(0);
			this.rpg.npcs.conversations.push(p_conversations);

		},

		/** @type { p5.Font } */
		fontSonoRegular: undefined,

		dialogueBox: {

			dialogueIsConvoLast: () => this.rpg.dialogueBox.idDialogue >= this.rpg.dialogueBox.conversation.length - 1,

			/** @type { SketchCbckWebEvent } */
			cbckKeyPressed: () => {

				if (this.keyCode !== 69) {

					return false;

				}

				if (this.rpg.dialogueBox.dialogueExitCheck()) {

					++this.rpg.dialogueBox.idDialogue;
					return true;

				}
				else {

					this.rpg.dialogueBox.idDialogue = 0;

				}

				return false;
			},

			/** @type { () => void } */
			drawImpl: () => {

				this.push();
				this.translate(0, this.height / 8);
				const fade = 255 * this.rpg.dialogueBox.fade;
				this.sketch.webGlCtx.disable(WebGLRenderingContext.DEPTH_TEST);

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
				this.textSize(this.rpg.dialogueBox.textSize);
				this.fill(255, fade);
				this.noStroke();

				const text = this.rpg.dialogueBox.conversation[this.rpg.dialogueBox.idDialogue];
				const tw = -rw / 2.25;
				const th = -rh / 6;

				this.text(text, tw, th);
				// #endregion

				this.sketch.webGlCtx.enable(WebGLRenderingContext.DEPTH_TEST);
				this.pop();

			},

			/** @type { () => void } */
			draw: () => { },

			dialogueExitCheck: () => {

				if (!this.rpg.dialogueBox.dialogueIsConvoLast()) {

					return true;

				}

				this.sketch.cbcks.touchEnded.remove(this.rpg.player.touchControlsEndedResponseDialogueAdvance);
				this.sketch.cbcks.keyPressed.remove(this.rpg.dialogueBox.cbckKeyPressed);
				this.rpg.player.resumeAllMovementControls();
				this.rpg.npcs.collisionResponse = () => { };
				this.rpg.dialogueBox.draw = () => { };
				this.rpg.dialogueBox.active = false;

				return false;

			},

			/** @type { string[] } */
			conversation: [""],

			/** @type { boolean } */
			active: false,

			/** @type { number } */
			idDialogue: 0,

			/** @type { number } */
			textSize: 12,

			/** @type { number } */
			fade: 0.5,

		},

		setup: () => {

			this.sketch.cbcks.touchEnded.active.push(this.rpg.player.touchControlsEndedResponseFindDeltas);
			this.rpg.npcs.collisionResponse = this.rpg.npcs.collisionResponseOverworld;
			this.rpg.player.latestTouch = this.createVector();
			this.rpg.player.velPosAngle = this.createVector();
			this.rpg.player.posAngle = this.createVector();
			this.rpg.player.resumeAllMovementControls();
			this.textFont(this.rpg.fontSonoRegular);


			this.rpg.npcCreate(
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

			this.rpg.npcCreate(
				this.createVector(-50, -50),
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

		player: {

			touchControlsEndedResponseDialogueAdvance: () => {

				const deltas = this.rpg.player.latestTouch;

				if (deltas.z > 10) {

					return true;

				}

				if (this.rpg.dialogueBox.dialogueExitCheck()) {

					++this.rpg.dialogueBox.idDialogue;
					return true;

				}

				this.sketch.cbcks.touchEnded.remove(this.rpg.player.touchControlsEndedResponseDialogueAdvance);
				this.sketch.cbcks.touchEnded.active.push(this.rpg.player.touchControlsEndedResponseMovement);
				return true;

			},

			touchControlsEndedResponseFindDeltas: () => {

				// this.rpg.player.latestTouch.x -= this.touches[0];
				// this.rpg.player.latestTouch.y -= this.touches[0];
				// this.rpg.player.latestTouch.z = this.rpg.player.latestTouch.x + this.rpg.player.latestTouch.y;

				return true;

			},

			touchControlsEndedResponseMovement: () => {

				const deltas = this.rpg.player.latestTouch;

				if (deltas.z < 40) {

					return true;

				}

				if (this.abs(deltas.x) > this.abs(deltas.y)) {

					this.rpg.player.posAngle.x += (deltas.x > 0 ? 1 : -1) * this.rpg.player.speed;

				} else {

					this.rpg.player.posAngle.y += (deltas.y > 0 ? 1 : -1) * this.rpg.player.speed;

				}

				return true;

			},

			touchControlsStartedResponse: () => {

				this.rpg.player.latestTouch.x = this.touches[0].x;
				this.rpg.player.latestTouch.y = this.touches[0].y;

			},

			keyboardControlsImpl: () => {

				// It is predictable - if not, as I think, *"faster"* - and also much cheaper, to respond to movements here,
				// than via some callback that adds functions into a/an set/array to respond to movements.

				if (this.keyIsDown(87)) {

					this.rpg.player.posAngle.y -= this.rpg.player.speed;

				}
				if (this.keyIsDown(65)) {

					this.rpg.player.posAngle.x -= this.rpg.player.speed;

				}
				if (this.keyIsDown(83)) {

					this.rpg.player.posAngle.y += this.rpg.player.speed;

				}
				if (this.keyIsDown(68)) {

					this.rpg.player.posAngle.x += this.rpg.player.speed;

				}

			},

			/** To be called in `Sketch::draw()`. */
			keyboardMovementControls: () => { },

			resumeAllMovementControls: () => {

				this.rpg.player.keyboardMovementControls = this.rpg.player.keyboardControlsImpl;
				this.sketch.cbcks.touchStarted.active.push(this.rpg.player.touchControlsEndedResponseMovement);

			},

			pauseAllMovementControls: () => {

				this.rpg.player.keyboardMovementControls = () => { };
				this.sketch.cbcks.touchStarted.remove(this.rpg.player.touchControlsEndedResponseMovement);

			},

			/** @type { p5.Vector } */
			latestTouch: undefined,

			/** @type { Set<number> } */
			idsNpcsTouched: new Set(),

			/** @type { p5.Vector } */
			velPosAngle: undefined,

			/** @type { p5.Vector } */
			posAngle: undefined,

			speed: 3,

			size: 20,

		},

		npcs: {

			/**
			 * @type { () => void }
			 * @param { number } p_idNpcDetectedLast SoA index of the NPC touched last.
			 */
			collisionResponseOverworld: (p_idNpcDetectedLast) => {

				this.rpg.dialogueBox.active = true;
				this.rpg.player.pauseAllMovementControls();
				this.rpg.npcs.collisionResponse = () => { };
				this.rpg.dialogueBox.draw = this.rpg.dialogueBox.drawImpl;
				this.sketch.cbcks.keyPressed.active.push(this.rpg.dialogueBox.cbckKeyPressed);
				this.sketch.cbcks.touchEnded.active.push(this.rpg.player.touchControlsEndedResponseDialogueAdvance);

				const convosAllNpcLast = this.rpg.npcs.conversations[p_idNpcDetectedLast];
				const idConvoCurrent = this.rpg.npcs.idsConversation[p_idNpcDetectedLast];
				this.rpg.dialogueBox.conversation = convosAllNpcLast[idConvoCurrent];

			},

			/** @type { () => void } */
			collisionResponse: () => { },

			/** @type { number[] } */
			idsConversation: [],

			/** @type { string[][] } */
			conversations: [],

			/** @type { p5.Vector[] } */
			posAngles: [],

			/** @type { number[] } */
			idsDialogue: [],

		},

	};

	sketch = {

		cbcks: {

			keyTyped: new SketchCbckWebEventManager(),
			keyPressed: new SketchCbckWebEventManager(),
			keyReleased: new SketchCbckWebEventManager(),

			touchEnded: new SketchCbckWebEventManager(),
			touchMoved: new SketchCbckWebEventManager(),
			touchStarted: new SketchCbckWebEventManager(),

			windowResized: new SketchCbckWebEventManager(),

			mouseMoved: new SketchCbckWebEventManager(),
			mouseWheel: new SketchCbckWebEventManager(),
			mousePressed: new SketchCbckWebEventManager(),
			mouseClicked: new SketchCbckWebEventManager(),
			mouseDragged: new SketchCbckWebEventManager(),
			mouseReleased: new SketchCbckWebEventManager(),
			doubleClicked: new SketchCbckWebEventManager(),

		},

		/**
		 * @type { {
		*
		* x: number,
		* y: number,
		* id: number,
		*
		* }[]
		* }
		*/
		ptouches: [],

		window: {

			oriLock: screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || screen.orientation.lock,

			cbckFullscreen: () => {

				this.fullscreen(true);
				return true;

			},

			cbckResizeCanvas: () => {

				this.resizeCanvas(window.innerWidth, window.innerHeight);
				return true;

			},

			pauseAttemptingResizeEveryResize: () => {

				this.sketch.cbcks.windowResized.remove(this.sketch.window.cbckResizeCanvas);

			},

			resumeAttemptingResizeEveryResize: () => {

				this.sketch.cbcks.windowResized.active.push(this.sketch.window.cbckResizeCanvas);

			},

			pauseAttemptingFullscreenEveryPress: () => {

				this.sketch.cbcks.touchStarted.remove(this.sketch.window.cbckFullscreen);
				this.sketch.cbcks.mousePressed.remove(this.sketch.window.cbckFullscreen);

			},

			resumeAttemptingFullscreenEveryPress: () => {

				this.sketch.cbcks.touchStarted.active.push(this.sketch.window.cbckFullscreen);
				this.sketch.cbcks.mousePressed.active.push(this.sketch.window.cbckFullscreen);

			},

		},

		/** @type { p5.Renderer } */ renderer: undefined,

		/** @type { HTMLCanvasElement } */ canvas: undefined,

		/** @type { HTMLDivElement } */ elementCanvasParent: undefined,

		/** @type { WebGL2RenderingContext | WebGLRenderingContext } */ webGlCtx: undefined,

	};
	// #endregion

	draw() {
		this.background(0);

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
		this.rpg.player.keyboardMovementControls();

		// #region Player render.
		this.push();
		this.rotateZ(this.rpg.player.posAngle.z);
		this.noStroke();
		this.fill(255);
		this.square(
			this.rpg.player.posAngle.x,
			this.rpg.player.posAngle.y,
			this.rpg.player.size,
		);
		this.pop();
		// #endregion

		// #region Check collisions.
		this.rpg.player.idsNpcsTouched.clear();
		let idNpcDetectedLast = 0;

		for (let i = 0; i < this.rpg.npcs.posAngles.length; i++) {

			const p = this.rpg.npcs.posAngles[i];

			const nLeft = p.x - (20 * 0.5);
			const nRight = p.x + (20 * 0.5);
			const nAbove = p.y - (20 * 0.5);
			const nBelow = p.y + (20 * 0.5);

			const pLeft = this.rpg.player.posAngle.x - (this.rpg.player.size * 0.5);
			const pRight = this.rpg.player.posAngle.x + (this.rpg.player.size * 0.5);
			const pAbove = this.rpg.player.posAngle.y - (this.rpg.player.size * 0.5);
			const pBelow = this.rpg.player.posAngle.y + (this.rpg.player.size * 0.5);

			const overlapping = !(
				pRight < nLeft
				|| pLeft > nRight
				|| pBelow < nAbove
				|| pAbove > nBelow
			);

			if (overlapping) {

				this.rpg.player.idsNpcsTouched.add(i);
				idNpcDetectedLast = i;

			}

		}

		if (this.rpg.player.idsNpcsTouched.size !== 0) {

			this.rpg.npcs.collisionResponse(idNpcDetectedLast);

		}
		else {

			this.rpg.npcs.collisionResponse = this.rpg.npcs.collisionResponseOverworld;

		}
		// #endregion

		// #region NPC rendering.
		this.push();
		this.fill(255);
		this.noStroke();

		for (const p of this.rpg.npcs.posAngles) {

			this.push();

			this.rotateZ(p.z);
			this.square(p.x, p.y, 20);

			this.pop();


		}

		this.pop();
		// #endregion

		this.rpg.dialogueBox.draw();
	}

	setup() {


		if (typeof (oriLock) === Screen && oriLock) {

			oriLock("landscape-primary");

		}

		this.sketch.renderer = this.createCanvas(window.innerWidth, window.innerHeight, this.WEBGL);
		this.sketch.canvas = this.sketch.elementCanvasParent.querySelector("canvas");
		this.sketch.window.resumeAttemptingFullscreenEveryPress();
		this.sketch.window.resumeAttemptingResizeEveryResize();
		this.sketch.webGlCtx = this.sketch.renderer.GL;
		this.textFont(this.rpg.fontSonoRegular);
		this.rpg.dialogueBox.fade = 1;
		this.rpg.setup();
	}

	preload() {
		this.loadFont("/Sono-Regular.ttf", (p_font) => {

			this.rpg.fontSonoRegular = p_font;

		});
	}

	constructor() {
		super(p => p, s_divSketchParent);

		for (const [cbck, man] of Object.entries(this.sketch.cbcks)) {

			this[cbck] = man.handleEvent.bind(man);

		}

		this.sketch.elementCanvasParent = s_divSketchParent;
	}

};
