import { defineConfig, optimizeDeps } from 'vite'
export default defineConfig({

	build: {

		commonjsOptions: {

			include: [
				"*.js"
			],

		},
		rollupOptions: {
			input: {
				app: "./index.html",
			},
			external: [
				"p5"
			],
		},
	},

});
