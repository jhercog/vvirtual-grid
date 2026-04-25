import _sfc_main from "../../src/Grid.js";

//#region integrations/vue/plugin.ts
const VVirtualGridPlugin = { install(app) {
	app.component("VirtualGrid", _sfc_main);
} };

//#endregion
export { VVirtualGridPlugin };