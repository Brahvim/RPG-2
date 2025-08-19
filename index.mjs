import p5 from "p5";

const NULLFN = () => { };
const GL = WebGLRenderingContext;

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

/** @type { HTMLCanvasElement } */
const s_divSketchParent = document.querySelector("div.sketch#sketch0");

/**
 * @typedef { (...args: any[]) => boolean } SketchCbck
 * Called when an event occurs. Can return `true` if it wishes to be called next time said event occurs!
 */

/** @returns { number } */ const distSq2d = (x1, y1, x2, y2) => s_sketch.sq(x2 - x1) + s_sketch.sq(y2 - y1);

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

const s_rpg = {

	/** @type { p5.Font } */
	fontSonoRegular: undefined,

	setup: () => {

		s_npcs.collisionResponse = s_npcs.collisionResponseOverworld;

		// `this::dpad::cbckTouchStarted` for control objects is added by `this::player::resumeAllMovementControls()`.
		// cbcks.touchMoved.add(dpad.cbckTouchMoved); // Added by `this::dpad::cbckTouchStarted()`.
		s_cbcks.windowResized.add(s_dpad.cbckWindowResized);
		s_cbcks.touchEnded.add(s_dpad.cbckTouchEnded);

		s_cbcks.touchStarted.add(s_player.cbckTouchStarted);
		s_cbcks.keyPressed.add(s_player.cbckKeyPressed);

		s_player.touchStart = s_sketch.createVector();
		s_player.swipeBase = s_sketch.createVector();
		s_player.posAngle = s_sketch.createVector();

		s_dpad.base = s_sketch.createVector();

		s_sketch.textFont(s_rpg.fontSonoRegular);
		s_player.resumeAllMovementControls();
		s_dpad.cbckWindowResized();

		// Lady:
		s_npcs.create(
			s_sketch.createVector(150, -75),
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
		s_npcs.create(
			s_sketch.createVector(0, -50),
			[
				[
					"This world needs more things, THINGS!",
				],
			],
		);

		// SOME body needs to FIX this!:
		s_npcs.create(
			s_sketch.createVector(0, 50),
			[
				[
					"What an empty void we live in...!",
					"SOMEbody needs to FIX this!",
				],
			],
		);

		// Tree:
		s_npcs.create(
			s_sketch.createVector(-150, 100),
			[
				[
					"This is a tree.",
					"You watered the tree.",
				],
				[
					"The tree seems safe and happy.",
				],
			],
		);

		if (s_phone) {

			s_dpad.draw = s_dpad.drawImpl;

		}

	},

};

const s_npcs = {

	/**
	 * @type { () => void }
	 * @param { number } p_idNpcDetectedLast SoA index of the NPC touched last.
	 */
	collisionResponseOverworld: (p_idNpcDetectedLast) => {

		// dialogueBox.cursor = 0;
		// dialogueBox.buffer = "";
		// dialogueBox.active = true;
		s_dialogueBox.draw = s_dialogueBox.drawImpl;

		s_npcs.collisionResponse = NULLFN;
		s_player.pauseAllMovementControls();

		s_cbcks.keyPressed.add(s_dialogueBox.cbckKeyPressedForConvo);
		s_cbcks.touchStarted.add(s_dialogueBox.cbckTouchStartedForConvo);

		const convos = s_npcs.conversations[p_idNpcDetectedLast]; // All of the NPC's convos.
		const idConvo = s_npcs.idsConversation[p_idNpcDetectedLast]; // ID of convo to carry out.
		s_dialogueBox.convo = convos[idConvo];

		const idNext = idConvo + 1;
		s_npcs.idsConversation[p_idNpcDetectedLast] = idNext == convos.length ? idConvo : idNext;
	},

	/**
	 * @param { p5.Vector } p_posAngle
	 * @param { string[] } p_conversations
	 */
	create: (p_posAngle, p_conversations) => {

		s_npcs.idsDialogue.push(0);
		s_npcs.idsConversation.push(0);
		s_npcs.posAngles.push(p_posAngle);
		s_npcs.conversations.push(p_conversations);

	},

	/** @type { () => void 	} */ collisionResponse: NULLFN,
	/** @type { number[] 	} */ idsConversation: [],
	/** @type { string[][] 	} */ conversations: [],
	/** @type { number[] 	} */ idsDialogue: [],
	/** @type { p5.Vector[] } */ posAngles: [],

};

const s_dpad = {

	/** @type { p5.Vector } */ base: null,

	/** @type { SketchCbck } */	onTouchStartedAfterWindowResized: () => {

		s_phone = onPhone(userAgentRead());

		if (s_phone) {

			s_dpad.draw = s_dpad.drawImpl;

		}

		return false;

	},

	/** @type { SketchCbck } */	onKeyPressedAfterWindowResized: () => {

		s_phone = onPhone(userAgentRead());

		if (!s_phone) {

			s_dpad.draw = NULLFN;

		}

		return false;

	},

	/** @type { SketchCbck } */	cbckWindowResized: () => {

		s_cbcks.touchStarted.add(s_dpad.onTouchStartedAfterWindowResized);
		s_cbcks.keyPressed.add(s_dpad.onKeyPressedAfterWindowResized);
		s_dpad.base.y = s_sketch.height * 0.6;
		s_dpad.base.x = s_sketch.width / 4;

		return true;

	},

	/** @type { SketchCbck } */	cbckTouchStarted: () => {

		// All three of these exist for cosmetic reasons:
		// cbcks.touchMoved.add(dpad.cbckTouchMoved);
		// dpad.base.x = sketch.touches[0].x;
		// dpad.base.y = sketch.touches[0].y;
		return true;

	},

	/** @type {	SketchCbck } */ cbckTouchEnded: () => {

		// cbcks.touchMoved.remove(dpad.cbckTouchMoved);
		s_dpad.pressed.w = false;
		s_dpad.pressed.a = false;
		s_dpad.pressed.s = false;
		s_dpad.pressed.d = false;
		return true;

	},

	/** @type { SketchCbck } */	touchControls: () => {

		// The `1.35` factor allows scaling for arrow tips:
		const scale = s_dpad.base.z * 1.35;
		const { x, y } = s_sketch.touches[0];
		const arrows = [

			{ // W
				x: s_dpad.base.x + s_dpad.gap,
				y: s_dpad.base.y - (s_dpad.gap * scale),
			},
			{ // A
				x: s_dpad.base.x - (s_dpad.gap * scale),
				y: s_dpad.base.y + s_dpad.gap,
			},
			{ // S
				x: s_dpad.base.x + s_dpad.gap,
				y: s_dpad.base.y + (s_dpad.gap * scale),
			},
			{ // D
				x: s_dpad.base.x + (s_dpad.gap * scale),
				y: s_dpad.base.y + s_dpad.gap,
			},

		];

		const pressed = [false, false, false, false];

		for (let i = 0; i < 4; i++) {

			const top = arrows[i].y - (s_dpad.base.z * 0.5); // W
			const lef = arrows[i].x - (s_dpad.base.z * 0.5); // A
			const bot = arrows[i].y + (s_dpad.base.z * 0.5); // S
			const rig = arrows[i].x + (s_dpad.base.z * 0.5); // D

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

		s_dpad.pressed.w = pressed[0];
		s_dpad.pressed.a = pressed[1];
		s_dpad.pressed.s = pressed[2];
		s_dpad.pressed.d = pressed[3];

		return true;

	},

	/** @type { p5.Vector } */ gap: 0.9,

	drawImpl: () => {

		s_sketch.push();

		// #region Arrow rendering.
		const arrow = () => {

			s_sketch.beginShape(s_sketch.TESS);

			s_sketch.vertex(-0.5, 0.35);
			s_sketch.vertex(0.5, 0.35);
			s_sketch.vertex(0.5, -0.35);
			// sketch.edge(true);
			s_sketch.vertex(0, -0.85);
			// sketch.edge(false);
			s_sketch.vertex(-0.5, -0.35);

			s_sketch.endShape(s_sketch.CLOSE);

		};

		s_sketch.translate(s_dpad.base.x, s_dpad.base.y);
		s_sketch.scale(s_dpad.base.z);
		s_sketch.fill(127, 127);
		s_sketch.noStroke();

		s_sketch.push(); // W.
		s_sketch.translate(0, -s_dpad.gap);
		s_sketch.rotateZ(0);
		arrow();
		s_sketch.pop();

		s_sketch.push(); // A.
		s_sketch.translate(-s_dpad.gap, 0);
		s_sketch.rotateZ(-s_sketch.HALF_PI);
		arrow();
		s_sketch.pop();

		s_sketch.push(); // S.
		s_sketch.translate(0, s_dpad.gap);
		s_sketch.rotateZ(s_sketch.PI);
		arrow();
		s_sketch.pop();

		s_sketch.push(); // D.
		s_sketch.translate(s_dpad.gap, 0);
		s_sketch.rotateZ(s_sketch.HALF_PI);
		arrow();
		s_sketch.pop();
		// #endregion

		s_sketch.pop();

	},

	draw: NULLFN,

	pressed: {

		w: false,
		a: false,
		s: false,
		d: false,

	},

};

const s_cbcks = {

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

const s_window = {

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

		s_sketch.fullscreen(true);
		return true;

	},

	cbckResizeCanvas: () => {

		s_sketch.resizeCanvas(window.innerWidth, window.innerHeight);
		return true;

	},

	pauseAttemptingResizeEveryResize: () => {

		s_cbcks.windowResized.remove(s_window.cbckResizeCanvas);

	},

	resumeAttemptingResizeEveryResize: () => {

		s_cbcks.windowResized.add(s_window.cbckResizeCanvas);

	},

	pauseAttemptingFullscreenEveryPress: () => {

		s_cbcks.touchStarted.remove(s_window.cbckFullscreen);
		s_cbcks.mousePressed.remove(s_window.cbckFullscreen);

	},

	resumeAttemptingFullscreenEveryPress: () => {

		s_cbcks.touchStarted.add(s_window.cbckFullscreen);
		s_cbcks.mousePressed.add(s_window.cbckFullscreen);

	},

};

const s_player = {

	// #region Controls stuff.
	// #region Pause/Resume controls.
	resumeAllMovementControls: () => {

		s_player.movementControls = s_player.movementControlsImpl;

		if (s_phone) {

			s_dpad.draw = s_dpad.drawImpl;
			s_cbcks.touchStarted.add(s_dpad.cbckTouchStarted);

		}

	},

	pauseAllMovementControls: () => {

		if (s_phone) {

			s_cbcks.touchStarted.remove(s_dpad.cbckTouchStarted);

		}

		s_player.movementControls = NULLFN;

	},
		// #endregion

		// #region Control callbacks.
	/** @type { SketchCbck } */ cbckTouchStarted: () => {

		s_player.movementControls();

		return true;

	},

	/** @type { SketchCbck } */ cbckKeyPressed: () => {

		s_player.movementControls();

		return true;

	},

	movementControlsImpl: () => {

		// It is predictable - if not, as I think, *"faster"* - and also much cheaper, to respond to movements here,
		// than via some callback that adds functions into a `Set` / an array to respond to movements.

		if (s_sketch.touches.length > 0) { // Have to poll this one because p5 orders events like an EDT would!

			s_dpad.touchControls();

		}

		const dt = s_sketch.deltaTime * 0.1; // Actually perfy, 'cause it also saves an access.

		if (s_sketch.keyIsDown(87) || s_dpad.pressed.w) {

			s_player.posAngle.y -= s_player.speed * dt;

		}
		if (s_sketch.keyIsDown(65) || s_dpad.pressed.a) {

			s_player.posAngle.x -= s_player.speed * dt;

		}
		if (s_sketch.keyIsDown(83) || s_dpad.pressed.s) {

			s_player.posAngle.y += s_player.speed * dt;

		}
		if (s_sketch.keyIsDown(68) || s_dpad.pressed.d) {

			s_player.posAngle.x += s_player.speed * dt;

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

const s_dialogueBox = {

	convoIsLast: () => s_dialogueBox.idDialogue >= s_dialogueBox.convo.length - 1,

	/** @type { SketchCbck } */ cbckTouchStartedForConvo: () => {

		return s_dialogueBox.convoShouldExit();

	},

	/** @type { SketchCbck } */ cbckKeyPressedForConvo: () => {

		if (s_sketch.keyCode != 69) {

			return true;

		}

		return s_dialogueBox.convoShouldExit();

	},

	convoShouldExit: () => {

		if (!s_dialogueBox.convoIsLast()) {

			s_dialogueBox.cursor = 0;
			s_dialogueBox.idDialogue++;
			s_dialogueBox.buffer = "";

			return true;

		}

		s_cbcks.touchEnded.remove(s_dialogueBox.cbckTouchStartedForConvo);
		s_cbcks.keyPressed.remove(s_dialogueBox.cbckKeyPressedForConvo);
		s_player.resumeAllMovementControls();
		s_npcs.collisionResponse = NULLFN;
		s_dialogueBox.draw = NULLFN;
		s_dialogueBox.active = false;
		s_dialogueBox.idDialogue = 0;
		s_dialogueBox.cursor = 0;
		s_dialogueBox.buffer = "";

		return false;

	},

	drawImpl: () => {

		console.log('a');

		s_sketch.push();

		s_sketch.translate(s_sketch.width / 2, s_sketch.height * 0.8);
		const rh = s_sketch.height * s_sketch.displayDensity() * 0.12;
		const fade = 255 * s_dialogueBox.fade;
		const rw = s_sketch.width * 0.5;
		const rr = 20; // Just 4% of width!
		s_sketch.scale(1.5);

		// #region Rectangle.
		s_sketch.push();

		s_sketch.rectMode(s_sketch.CENTER);
		s_sketch.fill(127, fade);
		s_sketch.curveDetail(6);
		s_sketch.noStroke();

		s_sketch.rect(0, 0, rw, rh, rr, rr, rr, rr);

		s_sketch.pop();
		// #endregion

		// #region Text.
		const dialogue = s_dialogueBox.convo[s_dialogueBox.idDialogue];
		const cursor = s_dialogueBox.cursor;
		s_dialogueBox.cursor++;

		if (cursor < dialogue.length) {

			s_dialogueBox.buffer += dialogue.charAt(cursor);

		}

		const text = s_dialogueBox.buffer;
		const tw = -rw / 2.25;
		const th = -rh / 8;

		s_sketch.push();

		s_sketch.textSize(rw * 0.04);
		s_sketch.fill(255, fade);
		s_sketch.noStroke();
		s_sketch.text(text, tw, th);

		s_sketch.pop();
		// #endregion

		s_sketch.pop();

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

const s_sketch = new class /*Sketch*/ extends p5 {

	// #region Fields.

	/** @type { p5.Renderer } */ renderer = undefined;
	/** @type { HTMLElement } */ elementCanvasParent = undefined;
	/** @type { HTMLCanvasElement } */ elementCanvas = undefined;
	/** @type { { x: number, y: number, id: number, }[] } */ ptouches = [];
	/** @type { WebGL2RenderingContext | WebGLRenderingContext } */ gl = undefined;

	// #endregion

	draw() {
		this.ptouches = this.touches;
		s_player.movementControls();

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
			s_player.posAngle.x, s_player.posAngle.y, this.width / 4,
			s_player.posAngle.x, s_player.posAngle.y, 0,
			0, 1, 0
		);

		// #region Player render.
		this.push();
		this.rotateZ(s_player.posAngle.z);
		this.noStroke();
		this.fill(255);
		// console.log(`${player.posAngle.x}, ${player.posAngle.y}`);

		this.square(
			s_player.posAngle.x,
			s_player.posAngle.y,
			s_player.size,
		);
		this.pop();
		// #endregion

		// #region Check collisions.
		s_player.idsNpcsTouched.clear();
		let idNpcDetectedLast = 0;

		for (let i = 0; i < s_npcs.posAngles.length; i++) {

			const p = s_npcs.posAngles[i];

			const nLeft = p.x - (20 * 0.5);
			const nRight = p.x + (20 * 0.5);
			const nAbove = p.y - (20 * 0.5);
			const nBelow = p.y + (20 * 0.5);

			const pLeft = s_player.posAngle.x - (s_player.size * 0.5);
			const pRight = s_player.posAngle.x + (s_player.size * 0.5);
			const pAbove = s_player.posAngle.y - (s_player.size * 0.5);
			const pBelow = s_player.posAngle.y + (s_player.size * 0.5);

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

				s_player.idsNpcsTouched.add(i);
				idNpcDetectedLast = i;

			}

		}

		if (s_player.idsNpcsTouched.size != 0) {

			s_npcs.collisionResponse(idNpcDetectedLast);

		}
		else {

			s_npcs.collisionResponse = s_npcs.collisionResponseOverworld;

		}
		// #endregion

		// #region NPC rendering.
		this.push();
		this.fill(255);
		this.noStroke();

		for (const p of s_npcs.posAngles) {

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

		s_dialogueBox.draw();
		s_dpad.draw();
		// #endregion
	}

	setup() {
		this.renderer = this.createCanvas(window.innerWidth, window.innerHeight, this.WEBGL);
		this.elementCanvas = this.elementCanvasParent.querySelector("canvas");
		s_window.resumeAttemptingFullscreenEveryPress();
		s_window.orientationLock("landscape-primary");
		s_window.resumeAttemptingResizeEveryResize();
		this.gl = this.renderer.GL;
		this.textFont(s_rpg.fontSonoRegular);
		this.frameRate(72);
		s_rpg.setup();
	}

	preload() {
		this.loadFont("/Sono-Regular.ttf", (p_font) => {

			s_rpg.fontSonoRegular = p_font;

		});
	}

	constructor() {
		super(p => p, s_divSketchParent);

		for (const [cbck, man] of Object.entries(s_cbcks)) {

			this[cbck] = man.handleEvent.bind(man);

		}

		this.elementCanvasParent = s_divSketchParent;
	}

};
