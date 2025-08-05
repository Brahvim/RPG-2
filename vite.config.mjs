export default {

	server: {
		strictPort: true,
		host: "0.0.0.0",
		port: 8080,
	},

	build: {
		rollupOptions: {
			external: [
				"p5"
			],
		},
	},

};
