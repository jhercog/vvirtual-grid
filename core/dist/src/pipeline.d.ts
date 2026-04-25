import { Observable } from "rxjs";

//#region src/pipeline.d.ts
interface SpaceBehindWindow {
  width: number;
  height: number;
}
declare function computeSpaceBehindWindowOf(el: Element): SpaceBehindWindow;
interface GridMeasurement {
  colGap: number;
  rowGap: number;
  flow: "row" | "column";
  columns: number;
  rows: number;
}
declare function getGridMeasurement(rootEl: Element): GridMeasurement;
interface ResizeMeasurement extends GridMeasurement {
  itemHeightWithGap: number;
  itemWidthWithGap: number;
}
declare function getResizeMeasurement(rootEl: Element, {
  height,
  width
}: DOMRectReadOnly): ResizeMeasurement;
interface BufferMeta {
  bufferedOffset: number;
  bufferedLength: number;
}
declare const getBufferMeta: (windowInnerWidth?: number, windowInnerHeight?: number) => ({
  width: widthBehindWindow,
  height: heightBehindWindow
}: SpaceBehindWindow, {
  colGap,
  rowGap,
  flow,
  columns,
  rows,
  itemHeightWithGap,
  itemWidthWithGap
}: ResizeMeasurement) => BufferMeta;
declare function getObservableOfVisiblePageNumbers({
  bufferedOffset,
  bufferedLength
}: BufferMeta, length: number, pageSize: number): Observable<number>;
interface ItemsByPage {
  pageNumber: number;
  items: unknown[];
  pageSize: number;
}
type PageProvider<T = unknown> = (pageNumber: number, pageSize: number) => Promise<T[]> | T[];
declare function callPageProvider(pageNumber: number, pageSize: number, pageProvider: PageProvider): Promise<ItemsByPage>;
declare function accumulateAllItems(allItems: unknown[], [{
  pageNumber,
  items,
  pageSize
}, length]: [ItemsByPage, number]): unknown[];
interface ItemOffset {
  x: number;
  y: number;
}
declare function getItemOffsetByIndex(index: number, {
  flow,
  columns,
  rows,
  itemWidthWithGap,
  itemHeightWithGap
}: ResizeMeasurement): ItemOffset;
interface InternalItem<T = unknown> {
  index: number;
  value: T | undefined;
  style?: {
    transform: string;
    gridArea: string;
  };
}
declare function getVisibleItems({
  bufferedOffset,
  bufferedLength
}: BufferMeta, resizeMeasurement: ResizeMeasurement, allItems: unknown[]): InternalItem[];
declare function accumulateBuffer(buffer: InternalItem[], visibleItems: InternalItem[]): InternalItem[];
interface ContentSize {
  width?: number;
  height?: number;
}
declare function getContentSize({
  colGap,
  rowGap,
  flow,
  columns,
  rows,
  itemWidthWithGap,
  itemHeightWithGap
}: ResizeMeasurement, length: number): ContentSize;
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
type ScrollAction = {
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
declare function pipeline({
  length$,
  pageProvider$,
  pageProviderDebounceTime$,
  pageSize$,
  itemRect$,
  rootResize$,
  scroll$,
  respectScrollToOnResize$,
  scrollTo$
}: PipelineInput): AsyncPipelineOutput;
//#endregion
export { InternalItem, PageProvider, ScrollAction, accumulateAllItems, accumulateBuffer, callPageProvider, computeSpaceBehindWindowOf, getBufferMeta, getContentSize, getGridMeasurement, getItemOffsetByIndex, getObservableOfVisiblePageNumbers, getResizeMeasurement, getVisibleItems, pipeline };