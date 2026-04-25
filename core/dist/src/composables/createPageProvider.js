import { toValue } from "vue";

//#region src/composables/createPageProvider.ts
function createPageProvider(data) {
	return (page, pageSize) => {
		const content = toValue(data);
		const totalLength = content.length;
		const start = page * pageSize;
		const end = Math.min(start + pageSize, totalLength);
		if (start >= totalLength) return [];
		return content.slice(start, end);
	};
}

//#endregion
export { createPageProvider };