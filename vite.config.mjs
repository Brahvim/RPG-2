import { build } from "vite";

export default {

	build: {
		rollupOptions: {
			external: [
				"p5"
			],
		},
	},

};
