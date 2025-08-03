import p5 from "p5";

/** @type { HTMLCanvasElement } */
const s_divSketchParent = document.querySelector("div.sketch#sketch0");

/**
 * @typedef { () => boolean } SketchCbckWebEvent Called when an event occurs. Can return `true` if it wishes to be called next time said event occurs!
 */
new class Sketch extends p5 {

	// #region Fields.
	sketch = {

		cbcks: {

			keyPressed: {

				/**
				 * Cached here for future access.
				 * @type { Set<SketchCbckWebEvent> }
				 * */
				stillAlive: new Set(),

				/** @type { Array<SketchCbckWebEvent> } */
				active: [],

			},

			mousePressed: {

				/**
				 * Cached here for future access.
				 * @type { Set<SketchCbckWebEvent> }
				 * */
				stillAlive: new Set(),

				/** @type { Array<SketchCbckWebEvent> } */
				active: [],

			},

		},

		fullscreen: {

			/** @type { SketchCbckWebEvent } */
			cbckMousePressed: () => {

				return this.sketch.keepAttemptingFullscreen && this.fullscreen(true);

			},

			/** @type { () => void } */
			resumeAttemptingEveryClick: () => {

				this.sketch.keepAttemptingFullscreen = true;
				this.sketch.cbcks.mousePressed.active.push(this.sketch.cbckMousePressedKeepAttemptingFullscreen);

			},

		},

		/** @type { p5.Renderer } */
		renderer: undefined,

		/** @type { WebGL2RenderingContext | WebGLRenderingContext } */
		webGlCtx: undefined,

		/** @type { HTMLCanvasElement } */
		elementCanvasParent: undefined,

		/** @type { boolean } */
		keepAttemptingFullscreen: true,

	};

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

			/** @type { SketchCbckWebEvent } */
			cbckKeyPressed: () => {

				if (this.keyCode !== 69) {

					return false;

				}

				// alert(`${this.rpg.dialogueBox.idDialogue} >= ${this.rpg.dialogueBox.conversation.length - 1}`);

				if (this.rpg.dialogueBox.idDialogue >= this.rpg.dialogueBox.conversation.length - 1) {

					this.rpg.player.readInputs = this.rpg.player.readInputsImpl;
					this.rpg.npcs.collisionResponse = () => { };
					this.rpg.dialogueBox.draw = () => { };
					this.rpg.dialogueBox.active = false;

					return false;

				}

				++this.rpg.dialogueBox.idDialogue;
				return true;

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

				this.text(
					this.rpg.dialogueBox.conversation[this.rpg.dialogueBox.idDialogue],
					-rw / 2.25,
					-rh / 6
				);
				// #endregion

				this.sketch.webGlCtx.enable(WebGLRenderingContext.DEPTH_TEST);
				this.pop();

			},

			/** @type { () => void } */
			draw: () => { },

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

			this.rpg.npcs.collisionResponse = this.rpg.npcs.collisionResponseOverworld;
			this.rpg.player.readInputs = this.rpg.player.readInputsImpl;
			this.rpg.player.velPosAngle = this.createVector();
			this.rpg.player.posAngle = this.createVector();
			this.textFont(this.rpg.fontSonoRegular);

			this.rpg.npcCreate(
				this.createVector(100, 0),
				// All conversations:
				[

					// First conversation:
					[

						// First dialogue:
						"Ti's a beautiful day!",

					],

				],
			);
		},

		player: {

			/** @type { Set<number> } */
			idsNpcsTouched: new Set(),

			/** @type { () => void } */
			readInputsImpl: () => {

				// It is predictable - if not, as I think, *"faster"* - and also much cheaper, to respond to movements here,
				// than via some callback that adds functions into a/an set/array to respond to movements.

				if (this.keyIsDown(87)) {

					this.rpg.player.posAngle.y -= this.rpg.player.speed;

				}
				else if (this.keyIsDown(65)) {

					this.rpg.player.posAngle.x -= this.rpg.player.speed;

				}
				else if (this.keyIsDown(83)) {

					this.rpg.player.posAngle.y += this.rpg.player.speed;

				}
				else if (this.keyIsDown(68)) {

					this.rpg.player.posAngle.x += this.rpg.player.speed;

				}

				// this.rpg.player.posAngle.add(this.rpg.player.velPosAngle);

			},

			/** @type { () => void } */
			readInputs: () => { },

			/** @type { p5.Vector } */
			posAngle: undefined,

			/** @type { p5.Vector } */
			velPosAngle: undefined,

			/** @type { number } */
			size: 20,

			/** @type { number } */
			speed: 3,

		},

		npcs: {

			/**
			 * @type { () => void }
			 * @param { number } p_idNpcDetectedLast SoA index of the NPC touched last.
			 */
			collisionResponseOverworld: (p_idNpcDetectedLast) => {

				this.rpg.dialogueBox.active = true;
				this.rpg.player.readInputs = () => { };
				this.rpg.dialogueBox.draw = this.rpg.dialogueBox.drawImpl;
				this.sketch.cbcks.keyPressed.active.push(this.rpg.dialogueBox.cbckKeyPressed);
				this.rpg.dialogueBox.conversation = this.rpg.npcs.conversations[p_idNpcDetectedLast];

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

		this.rpg.player.readInputs();

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

			console.log(this.rpg.npcs.collisionResponse);
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
		this.sketch.renderer = this.createCanvas(window.innerWidth, window.innerHeight, this.WEBGL);
		// this.sketch.cbcks.mousePressed.active.push(this.sketch.fullscreen.cbckMousePressed);
		this.sketch.canvas = this.sketch.elementCanvasParent.querySelector("canvas");
		this.sketch.webGlCtx = this.sketch.renderer.GL;
		this.textFont(this.rpg.fontSonoRegular);
		this.rpg.setup();
	}

	preload() {
		this.loadFont("/Sono-Regular.ttf", (p_font) => {

			this.rpg.fontSonoRegular = p_font;

		});
	}

	constructor() {
		super(p => p, s_divSketchParent);
		this.sketch.elementCanvasParent = s_divSketchParent;
	}

	keyPressed() {
		this.sketch.cbcks.keyPressed.stillAlive.clear();

		for (const cbck of this.sketch.cbcks.keyPressed.active) {

			if (cbck()) {

				this.sketch.cbcks.keyPressed.stillAlive.add(cbck);

			}

		}

		this.sketch.cbcks.keyPressed.active
			= this.sketch.cbcks.keyPressed.active.filter(cbck =>
				this.sketch.cbcks.keyPressed.stillAlive.has(cbck));
	}

	mousePressed() {
		this.sketch.cbcks.mousePressed.stillAlive.clear();

		for (const cbck of this.sketch.cbcks.mousePressed.active) {

			if (cbck()) {

				this.sketch.cbcks.mousePressed.stillAlive.add(cbck);

			}

		}

		this.sketch.cbcks.mousePressed.active
			= this.sketch.cbcks.mousePressed.active.filter(cbck =>
				this.sketch.cbcks.mousePressed.stillAlive.has(cbck));
	}

	windowResized() {
		this.resizeCanvas(window.innerWidth, window.innerHeight);
	}

};
