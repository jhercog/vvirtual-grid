import { watchEffect } from "vue";
import { partial, pipe, unary } from "ramda";
import { EMPTY, Observable, animationFrameScheduler, fromEventPattern, map as map$1, mergeAll, scheduled } from "rxjs";
import { useResizeObserver } from "@vueuse/core";

//#region src/utilites.ts
function fromProp(props, propName) {
	return new Observable((subscriber) => {
		subscriber.next(props[propName]);
		return watchEffect(() => subscriber.next(props[propName]));
	});
}
function fromResizeObserver(elRef, pluckTarget) {
	if (typeof window === "undefined") return EMPTY;
	return scheduled(fromEventPattern(pipe(unary, partial(useResizeObserver, [elRef]))), animationFrameScheduler).pipe(mergeAll(), map$1((entry) => entry[pluckTarget]));
}
function getElementScrollParents(element, includeHidden = false) {
	var _parent$assignedSlot$, _parent$assignedSlot, _vertical, _horizontal;
	const style = getComputedStyle(element);
	if (style.position === "fixed") return {
		vertical: document.body,
		horizontal: document.body
	};
	const excludeStaticParent = style.position === "absolute";
	const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
	let vertical;
	let horizontal;
	for (let parent = element; parent = (_parent$assignedSlot$ = (_parent$assignedSlot = parent.assignedSlot) === null || _parent$assignedSlot === void 0 ? void 0 : _parent$assignedSlot.parentElement) !== null && _parent$assignedSlot$ !== void 0 ? _parent$assignedSlot$ : parent.parentElement;) {
		const parentStyle = getComputedStyle(parent);
		if (excludeStaticParent && parentStyle.position === "static") continue;
		if (!horizontal && overflowRegex.test(parentStyle.overflowX)) {
			horizontal = parent;
			if (vertical) return {
				vertical,
				horizontal
			};
		}
		if (!vertical && overflowRegex.test(parentStyle.overflowY)) {
			vertical = parent;
			if (horizontal) return {
				vertical,
				horizontal
			};
		}
	}
	const fallback = document.scrollingElement || document.documentElement;
	return {
		vertical: (_vertical = vertical) !== null && _vertical !== void 0 ? _vertical : fallback,
		horizontal: (_horizontal = horizontal) !== null && _horizontal !== void 0 ? _horizontal : fallback
	};
}

//#endregion
export { fromProp, fromResizeObserver, getElementScrollParents };