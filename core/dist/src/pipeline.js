import { getElementScrollParents } from "./utilites.js";
import { _asyncToGenerator } from "../_virtual/_@oxc-project_runtime@0.112.0/helpers/asyncToGenerator.js";
import { __, addIndex, apply, complement, concat, difference, equals, identity, isNil, map, memoizeWith, pipe, slice, without, zip } from "ramda";
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, filter, firstValueFrom, map as map$1, merge, mergeMap, range, scan, shareReplay, startWith, switchMap, withLatestFrom } from "rxjs";

//#region src/pipeline.ts
function computeSpaceBehindWindowOf(el) {
	const { left, top } = el.getBoundingClientRect();
	return {
		width: Math.abs(Math.min(left, 0)),
		height: Math.abs(Math.min(top, 0))
	};
}
function countGridTracks(value) {
	if (!value || value === "none" || value === "subgrid") return 1;
	let count = 0;
	let depth = 0;
	let inToken = false;
	for (let i = 0; i < value.length; i++) {
		const ch = value[i];
		if (ch === "(") {
			depth++;
			inToken = true;
		} else if (ch === ")") {
			depth--;
			inToken = true;
		} else if (ch === " " && depth === 0) {
			if (inToken) {
				count++;
				inToken = false;
			}
		} else inToken = true;
	}
	return (inToken ? count + 1 : count) || 1;
}
function getGridMeasurement(rootEl) {
	const computedStyle = window.getComputedStyle(rootEl);
	return {
		rowGap: parseInt(computedStyle.getPropertyValue("row-gap")) || 0,
		colGap: parseInt(computedStyle.getPropertyValue("column-gap")) || 0,
		flow: computedStyle.getPropertyValue("grid-auto-flow").startsWith("column") ? "column" : "row",
		columns: countGridTracks(computedStyle.getPropertyValue("grid-template-columns")),
		rows: countGridTracks(computedStyle.getPropertyValue("grid-template-rows"))
	};
}
function getResizeMeasurement(rootEl, { height, width }) {
	const { colGap, rowGap, flow, columns, rows } = getGridMeasurement(rootEl);
	return {
		colGap,
		rowGap,
		flow,
		columns,
		rows,
		itemHeightWithGap: height + rowGap,
		itemWidthWithGap: width + colGap
	};
}
const getBufferMeta = (windowInnerWidth = window.innerWidth, windowInnerHeight = window.innerHeight) => ({ width: widthBehindWindow, height: heightBehindWindow }, { colGap, rowGap, flow, columns, rows, itemHeightWithGap, itemWidthWithGap }) => {
	let crosswiseLines;
	let gap;
	let itemSizeWithGap;
	let windowInnerSize;
	let spaceBehindWindow;
	if (flow === "row") {
		crosswiseLines = columns;
		gap = rowGap;
		itemSizeWithGap = itemHeightWithGap;
		windowInnerSize = windowInnerHeight;
		spaceBehindWindow = heightBehindWindow;
	} else {
		crosswiseLines = rows;
		gap = colGap;
		itemSizeWithGap = itemWidthWithGap;
		windowInnerSize = windowInnerWidth;
		spaceBehindWindow = widthBehindWindow;
	}
	const length = (itemSizeWithGap && Math.ceil((windowInnerSize + gap) / itemSizeWithGap) + 1) * crosswiseLines;
	const offset = (itemSizeWithGap && Math.floor((spaceBehindWindow + gap) / itemSizeWithGap)) * crosswiseLines;
	return {
		bufferedOffset: Math.max(offset - Math.floor(length / 2), 0),
		bufferedLength: length * 2
	};
};
function getObservableOfVisiblePageNumbers({ bufferedOffset, bufferedLength }, length, pageSize) {
	const startPage = Math.floor(bufferedOffset / pageSize);
	return range(startPage, Math.ceil(Math.min(bufferedOffset + bufferedLength, length) / pageSize) - startPage);
}
function callPageProvider(pageNumber, pageSize, pageProvider) {
	return Promise.resolve(pageProvider(pageNumber, pageSize)).then((items) => ({
		pageNumber,
		items,
		pageSize
	}));
}
function accumulateAllItems(allItems, [{ pageNumber, items, pageSize }, length]) {
	if (allItems.length !== length) allItems.length = length;
	const start = pageNumber * pageSize;
	const end = Math.min(start + pageSize, length);
	for (let i = start; i < end; i++) {
		const localIndex = i - start;
		allItems[i] = localIndex < items.length ? items[localIndex] : void 0;
	}
	return allItems;
}
function getItemOffsetByIndex(index, { flow, columns, rows, itemWidthWithGap, itemHeightWithGap }) {
	let x;
	let y;
	if (flow === "row") {
		x = index % columns * itemWidthWithGap;
		y = Math.floor(index / columns) * itemHeightWithGap;
	} else {
		x = Math.floor(index / rows) * itemWidthWithGap;
		y = index % rows * itemHeightWithGap;
	}
	return {
		x,
		y
	};
}
function getVisibleItems({ bufferedOffset, bufferedLength }, resizeMeasurement, allItems) {
	return pipe(slice(bufferedOffset, bufferedOffset + bufferedLength), addIndex(map)((value, localIndex) => {
		const index = bufferedOffset + localIndex;
		const { x, y } = getItemOffsetByIndex(index, resizeMeasurement);
		return {
			index,
			value,
			style: {
				gridArea: "1/1",
				transform: `translate(${x}px, ${y}px)`
			}
		};
	}))(allItems);
}
function accumulateBuffer(buffer, visibleItems) {
	const bufferByIndex = new Map(buffer.map((item) => [item.index, item]));
	const effectiveVisible = visibleItems.map((item) => {
		if (item.value === void 0) {
			const buffered = bufferByIndex.get(item.index);
			if ((buffered === null || buffered === void 0 ? void 0 : buffered.value) !== void 0) return buffered;
		}
		return item;
	});
	const itemsToAdd = difference(effectiveVisible, buffer);
	const itemsFreeToUse = difference(buffer, effectiveVisible);
	const replaceMap = new Map(zip(itemsFreeToUse, itemsToAdd));
	const itemsToBeReplaced = [...replaceMap.keys()];
	const itemsToReplaceWith = [...replaceMap.values()];
	const itemsToDelete = difference(itemsFreeToUse, itemsToBeReplaced);
	const itemsToAppend = difference(itemsToAdd, itemsToReplaceWith);
	return pipe(without(itemsToDelete), map((item) => {
		var _replaceMap$get;
		return (_replaceMap$get = replaceMap.get(item)) !== null && _replaceMap$get !== void 0 ? _replaceMap$get : item;
	}), concat(__, itemsToAppend))(buffer);
}
function getContentSize({ colGap, rowGap, flow, columns, rows, itemWidthWithGap, itemHeightWithGap }, length) {
	return flow === "row" ? { height: itemHeightWithGap * Math.ceil(length / columns) - rowGap } : { width: itemWidthWithGap * Math.ceil(length / rows) - colGap };
}
function pipeline(_x) {
	return _pipeline.apply(this, arguments);
}
function _pipeline() {
	_pipeline = _asyncToGenerator(function* ({ length$, pageProvider$, pageProviderDebounceTime$, pageSize$, itemRect$, rootResize$, scroll$, respectScrollToOnResize$, scrollTo$ }) {
		const [ssrPageProvider, ssrPageSize] = yield Promise.all([firstValueFrom(pageProvider$), firstValueFrom(pageSize$)]);
		const manualRecompute$ = new BehaviorSubject(0);
		const { items: ssrPageItems } = yield callPageProvider(0, ssrPageSize, ssrPageProvider);
		const spaceBehindWindow$ = merge(rootResize$, scroll$).pipe(map$1(computeSpaceBehindWindowOf), distinctUntilChanged());
		const resizeMeasurement$ = combineLatest([rootResize$, itemRect$], getResizeMeasurement).pipe(distinctUntilChanged(equals));
		const contentSize$ = combineLatest([resizeMeasurement$, length$], getContentSize);
		const scrollToNotNil$ = scrollTo$.pipe(filter(complement(isNil)));
		const scrollAction$ = respectScrollToOnResize$.pipe(switchMap((respectScrollToOnResize) => respectScrollToOnResize ? combineLatest([
			scrollToNotNil$,
			resizeMeasurement$,
			rootResize$
		]) : scrollToNotNil$.pipe(withLatestFrom(resizeMeasurement$, rootResize$))), map$1(([scrollTo, resizeMeasurement, rootEl]) => {
			const { vertical: verticalScrollEl, horizontal: horizontalScrollEl } = getElementScrollParents(rootEl);
			const computedStyle = getComputedStyle(rootEl);
			const gridPaddingTop = parseInt(computedStyle.getPropertyValue("padding-top"));
			const gridBoarderTop = parseInt(computedStyle.getPropertyValue("border-top"));
			const gridPaddingLeft = parseInt(computedStyle.getPropertyValue("padding-left"));
			const gridBoarderLeft = parseInt(computedStyle.getPropertyValue("border-left"));
			const leftToGridContainer = rootEl instanceof HTMLElement && horizontalScrollEl instanceof HTMLElement ? rootEl.offsetLeft - horizontalScrollEl.offsetLeft : 0;
			const topToGridContainer = rootEl instanceof HTMLElement && verticalScrollEl instanceof HTMLElement ? rootEl.offsetTop - verticalScrollEl.offsetTop : 0;
			const { x, y } = getItemOffsetByIndex(scrollTo, resizeMeasurement);
			return {
				target: verticalScrollEl,
				top: y + topToGridContainer + gridPaddingTop + gridBoarderTop,
				left: x + leftToGridContainer + gridPaddingLeft + gridBoarderLeft
			};
		}));
		const bufferMeta$ = combineLatest([spaceBehindWindow$, resizeMeasurement$]).pipe(map$1(([space, resize]) => getBufferMeta(window.innerWidth, window.innerHeight)(space, resize)), distinctUntilChanged(equals), shareReplay(1));
		const visiblePageNumbers$ = combineLatest([
			bufferMeta$,
			length$,
			pageSize$
		]).pipe(map$1(apply(getObservableOfVisiblePageNumbers)));
		const debouncedVisiblePageNumbers$ = pageProviderDebounceTime$.pipe(switchMap((time) => visiblePageNumbers$.pipe(time === 0 ? identity : debounceTime(time))));
		const memorizedPageProvider$ = combineLatest([pageProvider$, length$.pipe(distinctUntilChanged())]).pipe(map$1(([f, length]) => memoizeWith((pageNumber, pageSize, version) => `${length}:${pageNumber},${pageSize},${version}`, (pageNumber, pageSize, _version) => f(pageNumber, pageSize))), shareReplay(1));
		const itemsByPage$ = manualRecompute$.pipe(switchMap((version) => combineLatest([
			debouncedVisiblePageNumbers$,
			pageSize$,
			memorizedPageProvider$
		]).pipe(mergeMap(([pageNumber$, pageSize, memorizedPageProvider]) => {
			return pageNumber$.pipe(mergeMap((pageNumber) => callPageProvider(pageNumber, pageSize, (p, s) => memorizedPageProvider(p, s, version))));
		}))), shareReplay(1));
		const replayLength$ = length$.pipe(shareReplay(1));
		const allItems$ = memorizedPageProvider$.pipe(switchMap(() => combineLatest([itemsByPage$, replayLength$]).pipe(scan(accumulateAllItems, []))), shareReplay(1));
		const ssrBuffer = ssrPageItems.map((value, index) => ({
			index,
			value,
			style: void 0
		}));
		const domItems$ = combineLatest([
			bufferMeta$,
			resizeMeasurement$,
			allItems$
		], getVisibleItems);
		const buffer$ = domItems$.pipe(scan(accumulateBuffer, []), startWith(ssrBuffer));
		const ready$ = merge(manualRecompute$.pipe(map$1(() => false)), domItems$.pipe(map$1(() => true))).pipe(distinctUntilChanged(), shareReplay(1));
		function recompute() {
			return _recompute.apply(this, arguments);
		}
		function _recompute() {
			_recompute = _asyncToGenerator(function* () {
				manualRecompute$.next(manualRecompute$.value + 1);
				yield firstValueFrom(ready$.pipe(filter((v) => v === true)));
			});
			return _recompute.apply(this, arguments);
		}
		return {
			buffer$,
			contentSize$,
			scrollAction$,
			allItems$,
			ready$,
			recompute
		};
	});
	return _pipeline.apply(this, arguments);
}

//#endregion
export { accumulateAllItems, accumulateBuffer, callPageProvider, computeSpaceBehindWindowOf, getBufferMeta, getContentSize, getGridMeasurement, getItemOffsetByIndex, getObservableOfVisiblePageNumbers, getResizeMeasurement, getVisibleItems, pipeline };