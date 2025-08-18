import p5 from "p5";

const PARENT = document.querySelector("div.sketch#sketch0");

const sketch = new class Sketch extends p5 {

	mousePressed() {
		this.fullscreen(!this.fullscreen());
	}

	constructor() {
		super(p => p, PARENT);
	}

	setup() {
		console.log(state.value);
	}

	draw() {
		state.draw();
	}

};

const state = {

	value: 1,

	draw() {
		sketch.background(sketch.abs(sketch.sin(sketch.millis() * 0.01)) * 255);
	},

};
