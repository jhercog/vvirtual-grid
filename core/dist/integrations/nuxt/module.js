import { addComponent, addImports, createResolver, defineNuxtModule } from "@nuxt/kit";

//#region integrations/nuxt/module.ts
const module = defineNuxtModule({
	meta: {
		name: "vvirtual-grid",
		configKey: "vvgrid",
		compatibility: { nuxt: ">=3.0.0" }
	},
	defaults: {},
	setup() {
		const resolver = createResolver(import.meta.url);
		addImports({
			name: "createPageProvider",
			as: "useVirtualGridProvider",
			from: resolver.resolve("../../src/composables/createPageProvider")
		});
		addComponent({
			name: "VirtualGrid",
			filePath: resolver.resolve("../../src/Grid.js")
		});
	}
});

//#endregion
export { module as default };