import { getElementScrollParents } from "../utilites.js";
import { watch } from "vue";
import { EMPTY, Observable, Subject } from "rxjs";
import { tryOnUnmounted, unrefElement } from "@vueuse/core";

//#region src/composables/useFromScrollParent.ts
function fromScrollParent(elRef) {
	if (typeof window === "undefined") return EMPTY;
	const scrollSubject = new Subject();
	watch(() => unrefElement(elRef), (element) => {
		if (!element) return;
		const { vertical, horizontal } = getElementScrollParents(element);
		const scrollParents = (vertical === horizontal ? [vertical] : [vertical, horizontal]).map((parent) => {
			return parent === document.documentElement ? window : parent;
		});
		const cleanup = new AbortController();
		const handler = () => scrollSubject.next(element);
		scrollParents.forEach((parent) => {
			parent.addEventListener("scroll", handler, {
				signal: cleanup.signal,
				passive: true,
				capture: true
			});
		});
		tryOnUnmounted(() => cleanup.abort());
	});
	return scrollSubject;
}

//#endregion
export { fromScrollParent };