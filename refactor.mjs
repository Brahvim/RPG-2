import p5 from "p5";

const NULLFN = () => { };

// #region Phone detection.

// This test comes from [ http://detectmobilebrowsers.com/ ]!
// Thank you, [ https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser ]!

const userAgentRead = () => (

	navigator.userAgent
	||
	navigator.vendor
	||
	window.opera

);

const onPhone = (p_userAgent) => (

	/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i
		.test(p_userAgent)
	||
	/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i
		.test(p_userAgent.substr(0, 4))

);

let s_phone = onPhone(userAgentRead());

// #endregion

const GL = WebGLRenderingContext;

/** @type { HTMLCanvasElement } */ const DIV_SKETCH_PARENT = document.querySelector("div.sketch#sketch0");

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

// #region Fields.
/** @returns { number } */ const distSq2d = (x1, y1, x2, y2) => sketch.sq(x2 - x1) + sketch.sq(y2 - y1);

const dialogueBox = {

	convoIsLast: () => dialogueBox.idDialogue >= dialogueBox.convo.length - 1,

		/** @type { SketchCbck } */ cbckTouchStartedForConvo() {

		return dialogueBox.convoShouldExit();

	},

		/** @type { SketchCbck } */ cbckKeyPressedForConvo() {

		if (sketch.keyCode != 69) {

			return true;

		}

		return dialogueBox.convoShouldExit();

	},

	convoShouldExit() {

		if (!dialogueBox.convoIsLast()) {

			dialogueBox.cursor = 0;
			dialogueBox.idDialogue++;
			dialogueBox.buffer = "";

			return true;

		}

		cbcks.touchEnded.remove(dialogueBox.cbckTouchStartedForConvo);
		cbcks.keyPressed.remove(dialogueBox.cbckKeyPressedForConvo);
		player.resumeAllMovementControls();
		npcs.collisionResponse = NULLFN;
		dialogueBox.draw = NULLFN;
		dialogueBox.active = false;
		dialogueBox.idDialogue = 0;
		dialogueBox.cursor = 0;
		dialogueBox.buffer = "";

		return false;

	},

	drawImpl() {

		sketch.push();

		sketch.translate(sketch.width / 2, sketch.height * 0.8);
		const rh = sketch.height * sketch.displayDensity() * 0.12;
		const fade = 255 * dialogueBox.fade;
		const rw = sketch.width * 0.5;
		const rr = 20; // Just 4% of width!
		sketch.scale(1.5);

		console.log('a');

		// #region Rectangle.
		sketch.push();

		sketch.rectMode(sketch.CENTER);
		sketch.fill(127, fade);
		sketch.curveDetail(6);
		sketch.noStroke();

		sketch.rect(0, 0, rw, rh, rr, rr, rr, rr);

		sketch.pop();
		// #endregion

		// #region Text.
		const dialogue = dialogueBox.convo[dialogueBox.idDialogue];
		const cursor = dialogueBox.cursor;
		dialogueBox.cursor++;

		if (cursor < dialogue.length) {

			dialogueBox.buffer += dialogue.charAt(cursor);

		}

		const text = dialogueBox.buffer;
		const tw = -rw / 2.25;
		const th = -rh / 8;

		sketch.push();

		sketch.textSize(rw * 0.04);
		sketch.fill(255, fade);
		sketch.noStroke();
		sketch.text(text, tw, th);

		sketch.pop();
		// #endregion

		sketch.pop();

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

const player = {

	// #region Controls stuff.
	// #region Pause/Resume controls.
	resumeAllMovementControls() {

		player.movementControls = player.movementControlsImpl;

		if (s_phone) {

			dpad.draw = dpad.drawImpl;
			cbcks.touchStarted.add(dpad.cbckTouchStarted);

		}

	},

	pauseAllMovementControls() {

		if (s_phone) {

			cbcks.touchStarted.remove(dpad.cbckTouchStarted);

		}

		player.movementControls = NULLFN;

	},
		// #endregion

		// #region Control callbacks.
		/** @type { SketchCbck } */ cbckTouchStarted() {

		player.movementControls();

		return true;

	},

		/** @type { SketchCbck } */ cbckKeyPressed() {

		player.movementControls();

		return true;

	},

	movementControlsImpl() {

		// It is predictable - if not, as I think, *"faster"* - and also much cheaper, to respond to movements here,
		// than via some callback that adds functions into a `Set` / an array to respond to movements.

		if (sketch.touches.length > 0) { // Have to poll sketch one because p5 orders events like an EDT would!

			dpad.touchControls();

		}

		const dt = sketch.deltaTime * 0.1; // Actually perfy, 'cause it also saves an access.

		if (sketch.keyIsDown(87) || dpad.pressed.w) {

			player.posAngle.y -= player.speed * dt;

		}
		if (sketch.keyIsDown(65) || dpad.pressed.a) {

			player.posAngle.x -= player.speed * dt;

		}
		if (sketch.keyIsDown(83) || dpad.pressed.s) {

			player.posAngle.y += player.speed * dt;

		}
		if (sketch.keyIsDown(68) || dpad.pressed.d) {

			player.posAngle.x += player.speed * dt;

		}

	},

	movementControls: NULLFN, // Called in `Sketch::draw()`!
	// #endregion
	// #endregion

	/** @type { p5.Vector } `z` is touch ID! */
	touchStart: null,

	/** @type { p5.Vector } */
	swipeBase: null,

	/** @type { p5.Vector } */
	posAngle: null,

	/** @type { Set<number> } */
	idsNpcsTouched: new Set(),

	isTouching: false,

	speed: 1.5,

	size: 20,

};

const window = {

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

	cbckFullscreen() {

		sketch.fullscreen(true);
		return true;

	},

	cbckResizeCanvas() {

		sketch.resizeCanvas(window.innerWidth, window.innerHeight);
		return true;

	},

	pauseAttemptingResizeEveryResize() {

		cbcks.windowResized.remove(window.cbckResizeCanvas);

	},

	resumeAttemptingResizeEveryResize() {

		cbcks.windowResized.add(window.cbckResizeCanvas);

	},

	pauseAttemptingFullscreenEveryPress() {

		cbcks.touchStarted.remove(window.cbckFullscreen);
		cbcks.mousePressed.remove(window.cbckFullscreen);

	},

	resumeAttemptingFullscreenEveryPress() {

		cbcks.touchStarted.add(window.cbckFullscreen);
		cbcks.mousePressed.add(window.cbckFullscreen);

	},

};

const cbcks = {

	touchEnded: new SketchCbckManager(),		// Touchscreens callback.
	touchMoved: new SketchCbckManager(),		// Touchscreens callback.
	touchStarted: new SketchCbckManager(),		// Touchscreens callback.
	keyReleased: new SketchCbckManager(),		// Keyboard callback.
	keyPressed: new SketchCbckManager(),		// Keyboard callback.
	keyTyped: new SketchCbckManager(),			// Keyboard callback.
	windowResized: new SketchCbckManager(),		// Window callback.
	mouseMoved: new SketchCbckManager(),		// Mouse callback.
	mouseWheel: new SketchCbckManager(),		// Mouse callback.
	mouseClicked: new SketchCbckManager(),		// Mouse callback.
	mouseDragged: new SketchCbckManager(),		// Mouse callback.
	mousePressed: new SketchCbckManager(),		// Mouse callback.
	mouseReleased: new SketchCbckManager(),		// Mouse callback.
	doubleClicked: new SketchCbckManager(),		// Mouse callback.

};

const dpad = {

	/** @type { p5.Vector } */ base: null,

	/** @type { SketchCbck } */	onTouchStartedAfterWindowResized() {

		s_phone = onPhone(userAgentRead());

		if (s_phone) {

			dpad.draw = dpad.drawImpl;

		}

		return false;

	},

		/** @type { SketchCbck } */	onKeyPressedAfterWindowResized() {

		s_phone = onPhone(userAgentRead());

		if (!s_phone) {

			dpad.draw = NULLFN;

		}

		return false;

	},

		/** @type { SketchCbck } */	cbckWindowResized() {

		cbcks.touchStarted.add(dpad.onTouchStartedAfterWindowResized);
		cbcks.keyPressed.add(dpad.onKeyPressedAfterWindowResized);
		dpad.base.y = sketch.height * 0.6;
		dpad.base.x = sketch.width / 4;

		return true;

	},

		/** @type { SketchCbck } */	cbckTouchStarted() {

		// All three of these exist for cosmetic reasons:
		// cbcks.touchMoved.add(dpad.cbckTouchMoved);
		// dpad.base.x = sketch.touches[0].x;
		// dpad.base.y = sketch.touches[0].y;
		return true;

	},

		/** @type {	SketchCbck } */ cbckTouchEnded() {

		// cbcks.touchMoved.remove(dpad.cbckTouchMoved);
		dpad.pressed.w = false;
		dpad.pressed.a = false;
		dpad.pressed.s = false;
		dpad.pressed.d = false;
		return true;

	},

		/** @type { SketchCbck } */	touchControls() {

		// The `1.35` factor allows scaling for arrow tips:
		const scale = dpad.base.z * 1.35;
		const { x, y } = sketch.touches[0];
		const arrows = [

			{ // W
				x: dpad.base.x + dpad.gap,
				y: dpad.base.y - (dpad.gap * scale),
			},
			{ // A
				x: dpad.base.x - (dpad.gap * scale),
				y: dpad.base.y + dpad.gap,
			},
			{ // S
				x: dpad.base.x + dpad.gap,
				y: dpad.base.y + (dpad.gap * scale),
			},
			{ // D
				x: dpad.base.x + (dpad.gap * scale),
				y: dpad.base.y + dpad.gap,
			},

		];

		const pressed = [false, false, false, false];

		for (let i = 0; i < 4; i++) {

			const top = arrows[i].y - (dpad.base.z * 0.5); // W
			const lef = arrows[i].x - (dpad.base.z * 0.5); // A
			const bot = arrows[i].y + (dpad.base.z * 0.5); // S
			const rig = arrows[i].x + (dpad.base.z * 0.5); // D

			pressed[i] =
				rig > x
				&&
				lef < x
				&&
				bot > y
				&&
				top < y
				;

		}

		dpad.pressed.w = pressed[0];
		dpad.pressed.a = pressed[1];
		dpad.pressed.s = pressed[2];
		dpad.pressed.d = pressed[3];

		return true;

	},

	/** @type { p5.Vector } */ gap: 0.9,

	drawImpl() {

		sketch.push();

		// #region Arrow rendering.
		const arrow = () => {

			sketch.beginShape(sketch.TESS);

			sketch.vertex(-0.5, 0.35);
			sketch.vertex(0.5, 0.35);
			sketch.vertex(0.5, -0.35);
			// sketch.edge(true);
			sketch.vertex(0, -0.85);
			// sketch.edge(false);
			sketch.vertex(-0.5, -0.35);

			sketch.endShape(sketch.CLOSE);

		};

		sketch.translate(dpad.base.x, dpad.base.y);
		sketch.scale(dpad.base.z);
		sketch.fill(127, 127);
		sketch.noStroke();

		sketch.push(); // W.
		sketch.translate(0, -dpad.gap);
		sketch.rotateZ(0);
		arrow();
		sketch.pop();

		sketch.push(); // A.
		sketch.translate(-dpad.gap, 0);
		sketch.rotateZ(-sketch.HALF_PI);
		arrow();
		sketch.pop();

		sketch.push(); // S.
		sketch.translate(0, dpad.gap);
		sketch.rotateZ(sketch.PI);
		arrow();
		sketch.pop();

		sketch.push(); // D.
		sketch.translate(dpad.gap, 0);
		sketch.rotateZ(sketch.HALF_PI);
		arrow();
		sketch.pop();
		// #endregion

		sketch.pop();

	},

	draw: NULLFN,

	pressed: {

		w: false,
		a: false,
		s: false,
		d: false,

	},

};

const npcs = {

	/**
	 * @type { () => void }
	 * @param { number } p_idNpcDetectedLast SoA index of the NPC touched last.
	 */
	collisionResponseOverworld: (p_idNpcDetectedLast) => {

		// dialogueBox.cursor = 0;
		// dialogueBox.buffer = "";
		// dialogueBox.active = true;
		dialogueBox.draw = dialogueBox.drawImpl;

		npcs.collisionResponse = NULLFN;
		player.pauseAllMovementControls();

		cbcks.keyPressed.add(dialogueBox.cbckKeyPressedForConvo);
		cbcks.touchStarted.add(dialogueBox.cbckTouchStartedForConvo);

		const convos = npcs.conversations[p_idNpcDetectedLast]; // All of the NPC's convos.
		const idConvo = npcs.idsConversation[p_idNpcDetectedLast]; // ID of convo to carry out.
		dialogueBox.convo = convos[idConvo];

		const idNext = idConvo + 1;
		npcs.idsConversation[p_idNpcDetectedLast] = idNext == convos.length ? idConvo : idNext;
	},

	/**
	 * @param { p5.Vector } p_posAngle
	 * @param { string[] } p_conversations
	 */
	create: (p_posAngle, p_conversations) => {

		npcs.idsDialogue.push(0);
		npcs.idsConversation.push(0);
		npcs.posAngles.push(p_posAngle);
		npcs.conversations.push(p_conversations);

	},

		/** @type { () => void 	} */ collisionResponse: NULLFN,
		/** @type { number[] 	} */ idsConversation: [],
		/** @type { string[][] 	} */ conversations: [],
		/** @type { number[] 	} */ idsDialogue: [],
		/** @type { p5.Vector[] } */ posAngles: [],

};

const rpg = {

	/** @type { p5.Font } */
	fontSonoRegular: undefined,

	setup() {

		npcs.collisionResponse = npcs.collisionResponseOverworld;

		// `sketch::dpad::cbckTouchStarted` for control objects is added by `sketch::player::resumeAllMovementControls()`.
		// cbcks.touchMoved.add(dpad.cbckTouchMoved); // Added by `sketch::dpad::cbckTouchStarted()`.
		cbcks.windowResized.add(dpad.cbckWindowResized);
		cbcks.touchEnded.add(dpad.cbckTouchEnded);

		cbcks.touchStarted.add(player.cbckTouchStarted);
		cbcks.keyPressed.add(player.cbckKeyPressed);

		sketch.textFont(rpg.fontSonoRegular);
		player.resumeAllMovementControls();

		player.touchStart = sketch.createVector();
		player.swipeBase = sketch.createVector();
		player.posAngle = sketch.createVector();
		dpad.base = sketch.createVector();

		dpad.cbckWindowResized();

		// Lady:
		npcs.create(
			sketch.createVector(150, -75),
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

		// THINGS!:
		npcs.create(
			sketch.createVector(0, -50),
			[
				[
					"sketch world needs more things, THINGS!",
				],
			],
		);

		// SOME body needs to FIX sketch!:
		npcs.create(
			sketch.createVector(0, 50),
			[
				[
					"What an empty void we live in...!",
					"SOMEbody needs to FIX sketch!",
				],
			],
		);

		// Tree:
		npcs.create(
			sketch.createVector(-150, 100),
			[
				[
					"sketch is a tree.",
					"You watered the tree.",
				],
				[
					"The tree seems safe and happy.",
				],
			],
		);

		if (s_phone) {

			dpad.draw = dpad.drawImpl;

		}

	},

};
// #endregion

const sketch = new class extends p5 {

	/** @type { p5.Renderer } */ renderer = undefined;
	/** @type { HTMLElement } */ elementCanvasParent = undefined;
	/** @type { HTMLCanvasElement } */ elementCanvas = undefined;
	/** @type { { x: number, y: number, id: number, }[] } */ ptouches = [];
	/** @type { WebGL2RenderingContext | WebGLRenderingContext } */ gl = undefined;

	draw() {
		this.ptouches = this.touches;
		player.movementControls();

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
			player.posAngle.x, player.posAngle.y, this.width / 4,
			player.posAngle.x, player.posAngle.y, 0,
			0, 1, 0
		);

		// #region Player render.
		this.push();
		this.rotateZ(player.posAngle.z);
		this.noStroke();
		this.fill(255);
		this.square(
			player.posAngle.x,
			player.posAngle.y,
			player.size,
		);
		this.pop();
		// #endregion

		// #region Check collisions.
		player.idsNpcsTouched.clear();
		let idNpcDetectedLast = 0;

		for (let i = 0; i < npcs.posAngles.length; i++) {

			const p = npcs.posAngles[i];

			const nLeft = p.x - (20 * 0.5);
			const nRight = p.x + (20 * 0.5);
			const nAbove = p.y - (20 * 0.5);
			const nBelow = p.y + (20 * 0.5);

			const pLeft = player.posAngle.x - (player.size * 0.5);
			const pRight = player.posAngle.x + (player.size * 0.5);
			const pAbove = player.posAngle.y - (player.size * 0.5);
			const pBelow = player.posAngle.y + (player.size * 0.5);

			const overlapping = !(
				pRight < nLeft
				||
				pLeft > nRight
				||
				pBelow < nAbove
				||
				pAbove > nBelow
			);

			if (overlapping) {

				player.idsNpcsTouched.add(i);
				idNpcDetectedLast = i;

			}

		}

		if (player.idsNpcsTouched.size != 0) {

			npcs.collisionResponse(idNpcDetectedLast);

		}
		else {

			npcs.collisionResponse = npcs.collisionResponseOverworld;

		}
		// #endregion

		// #region NPC rendering.
		this.push();
		this.fill(255);
		this.noStroke();

		for (const p of npcs.posAngles) {

			this.push();

			this.rotateZ(p.z);
			this.square(p.x, p.y, 20);

			this.pop();

		}

		this.pop();
		// #endregion

		// #endregion
		this.pop();

		// #region 2D rendering.
		this.resetMatrix();
		this.ortho(
			0, this.width,
			-this.height, 0,
			-1000, 1000,
		);

		dialogueBox.draw();
		dpad.draw();
		// #endregion
	}

	setup() {
		this.renderer = this.createCanvas(window.innerWidth, window.innerHeight, this.WEBGL);
		this.elementCanvas = this.elementCanvasParent.querySelector("canvas");
		window.resumeAttemptingFullscreenEveryPress();
		window.orientationLock("landscape-primary");
		window.resumeAttemptingResizeEveryResize();
		this.gl = this.renderer.GL;
		this.textFont(rpg.fontSonoRegular);
		this.frameRate(72);
		rpg.setup();
	}

	preload() {
		this.loadFont("/Sono-Regular.ttf", (p_font) => {

			rpg.fontSonoRegular = p_font;

		});
	}

	constructor() {
		super(p => p, DIV_SKETCH_PARENT);

		for (const [cbck, man] of Object.entries(cbcks)) {

			this[cbck] = man.handleEvent.bind(man);

		}

		this.elementCanvasParent = DIV_SKETCH_PARENT;
	}

};
