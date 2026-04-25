import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  merge,
  mergeMap,
  Observable,
  range,
  scan,
  shareReplay,
  startWith,
  switchMap,
  withLatestFrom,
} from "rxjs";
import {
  __,
  addIndex,
  apply,
  complement,
  concat,
  difference,
  equals,
  identity,
  isNil,
  map as ramdaMap,
  memoizeWith,
  pipe,
  slice,
  without,
  zip,
} from "ramda";
import { getElementScrollParents } from "./utilites";

interface SpaceBehindWindow {
  width: number;
  height: number;
}

export function computeSpaceBehindWindowOf(el: Element): SpaceBehindWindow {
  const { left, top } = el.getBoundingClientRect();

  return {
    width: Math.abs(Math.min(left, 0)),
    height: Math.abs(Math.min(top, 0)),
  };
}

interface GridMeasurement {
  colGap: number;
  rowGap: number;
  flow: "row" | "column";
  columns: number;
  rows: number;
}

// Counts grid tracks in a computed grid-template-columns/rows value.
// split(" ") breaks on CSS functions like minmax(0px, 1fr) because the space
// inside the parens is treated as a track delimiter — this walks depth-aware.
function countGridTracks(value: string): number {
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
    } else {
      inToken = true;
    }
  }
  return (inToken ? count + 1 : count) || 1;
}

export function getGridMeasurement(rootEl: Element): GridMeasurement {
  const computedStyle = window.getComputedStyle(rootEl);

  return {
    rowGap: parseInt(computedStyle.getPropertyValue("row-gap")) || 0,
    colGap: parseInt(computedStyle.getPropertyValue("column-gap")) || 0,
    flow: computedStyle.getPropertyValue("grid-auto-flow").startsWith("column")
      ? "column"
      : "row",
    columns: countGridTracks(
      computedStyle.getPropertyValue("grid-template-columns"),
    ),
    rows: countGridTracks(computedStyle.getPropertyValue("grid-template-rows")),
  };
}

interface ResizeMeasurement extends GridMeasurement {
  itemHeightWithGap: number;
  itemWidthWithGap: number;
}

export function getResizeMeasurement(
  rootEl: Element,
  { height, width }: DOMRectReadOnly,
): ResizeMeasurement {
  const { colGap, rowGap, flow, columns, rows } = getGridMeasurement(rootEl);

  return {
    colGap,
    rowGap,
    flow,
    columns,
    rows,
    itemHeightWithGap: height + rowGap,
    itemWidthWithGap: width + colGap,
  };
}

interface BufferMeta {
  bufferedOffset: number;
  bufferedLength: number;
}

export const getBufferMeta =
  (
    windowInnerWidth: number = window.innerWidth,
    windowInnerHeight: number = window.innerHeight,
  ) =>
  (
    { width: widthBehindWindow, height: heightBehindWindow }: SpaceBehindWindow,
    {
      colGap,
      rowGap,
      flow,
      columns,
      rows,
      itemHeightWithGap,
      itemWidthWithGap,
    }: ResizeMeasurement,
  ): BufferMeta => {
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

    const linesInView =
      itemSizeWithGap &&
      Math.ceil((windowInnerSize + gap) / itemSizeWithGap) + 1;
    const length = linesInView * crosswiseLines;

    const linesBeforeView =
      itemSizeWithGap &&
      Math.floor((spaceBehindWindow + gap) / itemSizeWithGap);
    const offset = linesBeforeView * crosswiseLines;
    const bufferedOffset = Math.max(offset - Math.floor(length / 2), 0);
    const bufferedLength = length * 2;

    return {
      bufferedOffset,
      bufferedLength,
    };
  };

export function getObservableOfVisiblePageNumbers(
  { bufferedOffset, bufferedLength }: BufferMeta,
  length: number,
  pageSize: number,
): Observable<number> {
  const startPage = Math.floor(bufferedOffset / pageSize);
  const endPage = Math.ceil(
    Math.min(bufferedOffset + bufferedLength, length) / pageSize,
  );
  const numberOfPages = endPage - startPage;

  return range(startPage, numberOfPages);
}

interface ItemsByPage {
  pageNumber: number;
  items: unknown[];
  pageSize: number;
}

export type PageProvider<T = unknown> = (
  pageNumber: number,
  pageSize: number,
) => Promise<T[]> | T[];

export function callPageProvider(
  pageNumber: number,
  pageSize: number,
  pageProvider: PageProvider,
): Promise<ItemsByPage> {
  return Promise.resolve(pageProvider(pageNumber, pageSize)).then((items) => ({
    pageNumber,
    items,
    pageSize,
  }));
}

export function accumulateAllItems(
  allItems: unknown[],
  [{ pageNumber, items, pageSize }, length]: [ItemsByPage, number],
): unknown[] {
  // Update length if necessary in memory
  if (allItems.length !== length) {
    allItems.length = length;
  }

  const start = pageNumber * pageSize;
  const end = Math.min(start + pageSize, length);

  for (let i = start; i < end; i++) {
    const localIndex = i - start;
    allItems[i] = localIndex < items.length ? items[localIndex] : undefined;
  }

  return allItems;
}

interface ItemOffset {
  x: number;
  y: number;
}

export function getItemOffsetByIndex(
  index: number,
  {
    flow,
    columns,
    rows,
    itemWidthWithGap,
    itemHeightWithGap,
  }: ResizeMeasurement,
): ItemOffset {
  let x;
  let y;
  if (flow === "row") {
    x = (index % columns) * itemWidthWithGap;
    y = Math.floor(index / columns) * itemHeightWithGap;
  } else {
    x = Math.floor(index / rows) * itemWidthWithGap;
    y = (index % rows) * itemHeightWithGap;
  }

  return { x, y };
}

export interface InternalItem<T = unknown> {
  index: number;
  value: T | undefined;
  style?: { transform: string; gridArea: string };
}

export function getVisibleItems(
  { bufferedOffset, bufferedLength }: BufferMeta,
  resizeMeasurement: ResizeMeasurement,
  allItems: unknown[],
): InternalItem[] {
  return pipe<unknown[][], unknown[], InternalItem[]>(
    slice(bufferedOffset, bufferedOffset + bufferedLength),
    addIndex(ramdaMap)((value: unknown, localIndex: number) => {
      const index = bufferedOffset + localIndex;
      const { x, y } = getItemOffsetByIndex(index, resizeMeasurement);

      return {
        index,
        value,
        style: {
          gridArea: "1/1",
          transform: `translate(${x}px, ${y}px)`,
        },
      };
    }) as (a: unknown[]) => InternalItem[],
  )(allItems);
}

export function accumulateBuffer(
  buffer: InternalItem[],
  visibleItems: InternalItem[],
): InternalItem[] {
  const bufferByIndex = new Map(buffer.map((item) => [item.index, item]));

  // Don't downgrade a loaded item to a placeholder — transient undefined emissions
  // from allItems$ (e.g. when page size changes before the new page has loaded).
  const effectiveVisible = visibleItems.map((item) => {
    if (item.value === undefined) {
      const buffered = bufferByIndex.get(item.index);
      if (buffered?.value !== undefined) return buffered;
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

  return pipe(
    without(itemsToDelete),
    ramdaMap((item) => replaceMap.get(item) ?? item),
    concat(__, itemsToAppend),
  )(buffer);
}

interface ContentSize {
  width?: number;
  height?: number;
}

export function getContentSize(
  {
    colGap,
    rowGap,
    flow,
    columns,
    rows,
    itemWidthWithGap,
    itemHeightWithGap,
  }: ResizeMeasurement,
  length: number,
): ContentSize {
  return flow === "row"
    ? { height: itemHeightWithGap * Math.ceil(length / columns) - rowGap }
    : { width: itemWidthWithGap * Math.ceil(length / rows) - colGap };
}

interface PipelineInput {
  length$: Observable<number>;
  pageProvider$: Observable<PageProvider>;
  pageProviderDebounceTime$: Observable<number>;
  pageSize$: Observable<number>;
  itemRect$: Observable<DOMRectReadOnly>;
  rootResize$: Observable<Element>;
  scroll$: Observable<Element>;
  respectScrollToOnResize$: Observable<boolean>;
  scrollTo$: Observable<number | undefined>;
}

export type ScrollAction = {
  target: Element;
  top: number;
  left: number;
};

interface PipelineOutput {
  buffer$: Observable<InternalItem[]>;
  contentSize$: Observable<ContentSize>;
  scrollAction$: Observable<ScrollAction>;
  allItems$: Observable<unknown[]>;
  ready$: Observable<boolean>;
  recompute: () => Promise<void>;
}

type AsyncPipelineOutput = Promise<PipelineOutput>;

export async function pipeline({
  length$,
  pageProvider$,
  pageProviderDebounceTime$,
  pageSize$,
  itemRect$,
  rootResize$,
  scroll$,
  respectScrollToOnResize$,
  scrollTo$,
}: PipelineInput): AsyncPipelineOutput {
  // Fetch the first page for SSR before setting up the reactive pipeline
  const [ssrPageProvider, ssrPageSize] = await Promise.all([
    firstValueFrom(pageProvider$),
    firstValueFrom(pageSize$),
  ]);

  const manualRecompute$ = new BehaviorSubject(0);
  const { items: ssrPageItems } = await callPageProvider(
    0,
    ssrPageSize,
    ssrPageProvider,
  );
  // region: measurements of the visual grid
  const spaceBehindWindow$: Observable<SpaceBehindWindow> = merge(
    rootResize$,
    scroll$,
  ).pipe(map(computeSpaceBehindWindowOf), distinctUntilChanged());

  const resizeMeasurement$: Observable<ResizeMeasurement> = combineLatest(
    [rootResize$, itemRect$],
    getResizeMeasurement,
  ).pipe(distinctUntilChanged<ResizeMeasurement>(equals));

  const contentSize$: Observable<ContentSize> = combineLatest(
    [resizeMeasurement$, length$],
    getContentSize,
  );
  // endregion

  // region: scroll to a given item by index
  const scrollToNotNil$: Observable<number> = scrollTo$.pipe(
    filter(complement(isNil)),
  );
  const scrollAction$: Observable<ScrollAction> = respectScrollToOnResize$.pipe(
    switchMap((respectScrollToOnResize) =>
      respectScrollToOnResize
        ? // Emit when any input stream emits
          combineLatest<[number, ResizeMeasurement, Element]>([
            scrollToNotNil$,
            resizeMeasurement$,
            rootResize$,
          ])
        : // Emit only when the source stream emmits
          scrollToNotNil$.pipe(
            withLatestFrom<number, [ResizeMeasurement, Element]>(
              resizeMeasurement$,
              rootResize$,
            ),
          ),
    ),
    map<[number, ResizeMeasurement, Element], ScrollAction>(
      ([scrollTo, resizeMeasurement, rootEl]) => {
        const { vertical: verticalScrollEl, horizontal: horizontalScrollEl } =
          getElementScrollParents(rootEl);
        const computedStyle = getComputedStyle(rootEl);

        const gridPaddingTop = parseInt(
          computedStyle.getPropertyValue("padding-top"),
        );
        const gridBoarderTop = parseInt(
          computedStyle.getPropertyValue("border-top"),
        );

        const gridPaddingLeft = parseInt(
          computedStyle.getPropertyValue("padding-left"),
        );
        const gridBoarderLeft = parseInt(
          computedStyle.getPropertyValue("border-left"),
        );

        const leftToGridContainer =
          rootEl instanceof HTMLElement &&
          horizontalScrollEl instanceof HTMLElement
            ? rootEl.offsetLeft - horizontalScrollEl.offsetLeft
            : 0;

        const topToGridContainer =
          rootEl instanceof HTMLElement &&
          verticalScrollEl instanceof HTMLElement
            ? rootEl.offsetTop - verticalScrollEl.offsetTop
            : 0;

        const { x, y } = getItemOffsetByIndex(scrollTo, resizeMeasurement);

        return {
          target: verticalScrollEl,
          top: y + topToGridContainer + gridPaddingTop + gridBoarderTop,
          left: x + leftToGridContainer + gridPaddingLeft + gridBoarderLeft,
        };
      },
    ),
  );
  // endregion

  // region: rendering buffer
  const bufferMeta$: Observable<BufferMeta> = combineLatest([
    spaceBehindWindow$,
    resizeMeasurement$,
  ]).pipe(
    map(([space, resize]) =>
      getBufferMeta(window.innerWidth, window.innerHeight)(space, resize),
    ),
    distinctUntilChanged<BufferMeta>(equals),
    shareReplay(1),
  );

  const visiblePageNumbers$: Observable<Observable<number>> = combineLatest([
    bufferMeta$,
    length$,
    pageSize$,
  ]).pipe(map(apply(getObservableOfVisiblePageNumbers)));

  const debouncedVisiblePageNumbers$: Observable<Observable<number>> =
    pageProviderDebounceTime$.pipe(
      switchMap((time) =>
        visiblePageNumbers$.pipe(time === 0 ? identity : debounceTime(time)),
      ),
    );

  const memorizedPageProvider$: Observable<
    (
      pageNumber: number,
      pageSize: number,
      version: number,
    ) => Promise<unknown[]> | unknown[]
  > = combineLatest([pageProvider$, length$.pipe(distinctUntilChanged())]).pipe(
    map(([f, length]) =>
      memoizeWith(
        (pageNumber: number, pageSize: number, version: number) =>
          `${length}:${pageNumber},${pageSize},${version}`,
        (pageNumber: number, pageSize: number, _version: number) =>
          f(pageNumber, pageSize),
      ),
    ),
    shareReplay(1),
  );

  const itemsByPage$: Observable<ItemsByPage> = manualRecompute$.pipe(
    switchMap((version) =>
      combineLatest([
        debouncedVisiblePageNumbers$,
        pageSize$,
        memorizedPageProvider$,
      ]).pipe(
        mergeMap(([pageNumber$, pageSize, memorizedPageProvider]) => {
          return pageNumber$.pipe(
            mergeMap<number, Promise<ItemsByPage>>((pageNumber) =>
              callPageProvider(pageNumber, pageSize, (p, s) =>
                memorizedPageProvider(p, s, version),
              ),
            ),
          );
        }),
      ),
    ),
    shareReplay<ItemsByPage>(1),
  );

  const replayLength$: Observable<number> = length$.pipe(shareReplay(1));

  const allItems$: Observable<unknown[]> = memorizedPageProvider$.pipe(
    switchMap(() =>
      combineLatest([itemsByPage$, replayLength$]).pipe(
        scan(accumulateAllItems, []),
      ),
    ),
    shareReplay(1),
  );

  const ssrBuffer: InternalItem[] = ssrPageItems.map((value, index) => ({
    index,
    value,
    style: undefined,
  }));

  const domItems$: Observable<InternalItem[]> = combineLatest(
    [bufferMeta$, resizeMeasurement$, allItems$],
    getVisibleItems,
  );

  const buffer$: Observable<InternalItem[]> = domItems$.pipe(
    scan(accumulateBuffer, []),
    startWith(ssrBuffer),
  );

  const ready$: Observable<boolean> = merge(
    manualRecompute$.pipe(map(() => false)),
    domItems$.pipe(map(() => true)),
  ).pipe(distinctUntilChanged(), shareReplay(1));

  async function recompute() {
    manualRecompute$.next(manualRecompute$.value + 1);
    await firstValueFrom(ready$.pipe(filter((v) => v === true)));
  }

  return { buffer$, contentSize$, scrollAction$, allItems$, ready$, recompute };
}
