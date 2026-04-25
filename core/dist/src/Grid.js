import { fromProp, fromResizeObserver } from "./utilites.js";
import { _asyncToGenerator } from "../_virtual/_@oxc-project_runtime@0.112.0/helpers/asyncToGenerator.js";
import { pipeline } from "./pipeline.js";
import { fromScrollParent } from "./composables/useFromScrollParent.js";
import { useObservable } from "./composables/useObservable.js";
import { _objectSpread2 } from "../_virtual/_@oxc-project_runtime@0.112.0/helpers/objectSpread2.js";
import { Fragment, computed, createBlock, createCommentVNode, createElementBlock, defineComponent, normalizeStyle, onUpdated, openBlock, renderList, renderSlot, resolveDynamicComponent, shallowRef, unref, useId, useTemplateRef, vShow, watch, withAsyncContext, withCtx, withDirectives } from "vue";
import { once } from "ramda";

//#region src/Grid.vue
const _sfc_main = /* @__PURE__ */ defineComponent({
	__name: "Grid",
	props: {
		length: {
			type: Number,
			required: true,
			validator: (value) => Number.isInteger(value) && value >= 0
		},
		pageProvider: {
			type: Function,
			required: true
		},
		pageProviderDebounceTime: {
			type: Number,
			required: false,
			default: 0,
			validator: (value) => Number.isInteger(value) && value >= 0
		},
		pageSize: {
			type: Number,
			required: true,
			validator: (value) => Number.isInteger(value) && value >= 1
		},
		scrollTo: {
			type: Number,
			required: false,
			validator: (value) => Number.isInteger(value) && value >= 0
		},
		respectScrollToOnResize: {
			type: Boolean,
			required: false,
			default: true
		},
		scrollBehavior: {
			type: String,
			required: false,
			default: "smooth",
			validator: (value) => ["smooth", "auto"].includes(value)
		},
		tag: {
			type: String,
			required: false,
			default: "div"
		},
		probeTag: {
			type: String,
			required: false,
			default: "div"
		},
		getKey: {
			type: Function,
			required: false,
			default: void 0
		}
	},
	setup(__props, { expose: __expose }) {
		return _asyncToGenerator(function* () {
			let __temp, __restore;
			const props = __props;
			const rootRef = useTemplateRef("root");
			const probeRef = useTemplateRef("probe");
			const { ready$, buffer$, contentSize$, scrollAction$, allItems$ } = ([__temp, __restore] = withAsyncContext(() => pipeline({
				length$: fromProp(props, "length"),
				pageProvider$: fromProp(props, "pageProvider"),
				pageProviderDebounceTime$: fromProp(props, "pageProviderDebounceTime"),
				pageSize$: fromProp(props, "pageSize"),
				itemRect$: fromResizeObserver(probeRef, "contentRect"),
				rootResize$: fromResizeObserver(rootRef, "target"),
				scroll$: fromScrollParent(rootRef),
				respectScrollToOnResize$: fromProp(props, "respectScrollToOnResize"),
				scrollTo$: fromProp(props, "scrollTo")
			})), __temp = yield __temp, __restore(), __temp);
			const sharedProbeStyles = computed(() => {
				return {
					opacity: 0,
					visibility: "hidden",
					pointerEvents: "none",
					zIndex: -1,
					placeSelf: "stretch"
				};
			});
			const ssrProbeStyles = computed(() => {
				return _objectSpread2({}, sharedProbeStyles.value);
			});
			const csrProbeStyles = computed(() => {
				return _objectSpread2(_objectSpread2({}, sharedProbeStyles.value), {}, { gridArea: "1/1" });
			});
			onUpdated(once(() => {
				scrollAction$.subscribe(({ target, top, left }) => {
					target.scrollTo({
						top,
						left,
						behavior: props.scrollBehavior
					});
				});
			}));
			const buffer = useObservable(buffer$);
			const ready = useObservable(ready$);
			const contentSize = useObservable(contentSize$);
			const rootStyles = computed(() => {
				var _contentSize$value;
				return Object.fromEntries([...Object.entries((_contentSize$value = contentSize.value) !== null && _contentSize$value !== void 0 ? _contentSize$value : {}).map(([property, value]) => [property, value + "px"]), ["placeContent", "start"]]);
			});
			const keyPrefix = shallowRef(useId());
			watch(() => props.pageProvider, () => keyPrefix.value = (/* @__PURE__ */ new Date()).getTime().toString());
			__expose({
				allItems: useObservable(allItems$),
				ready
			});
			return (_ctx, _cache) => {
				return withDirectives((openBlock(), createBlock(resolveDynamicComponent(__props.tag), {
					ref: "root",
					style: normalizeStyle(rootStyles.value)
				}, {
					default: withCtx(() => [
						unref(ready) ? (openBlock(), createBlock(resolveDynamicComponent(__props.probeTag), {
							key: 0,
							style: normalizeStyle(csrProbeStyles.value),
							ref: "probe"
						}, {
							default: withCtx(() => [renderSlot(_ctx.$slots, "probe")]),
							_: 3
						}, 8, ["style"])) : createCommentVNode("v-if", true),
						(openBlock(true), createElementBlock(Fragment, null, renderList(unref(buffer), (internalItem) => {
							return openBlock(), createElementBlock(Fragment, { key: __props.getKey ? __props.getKey(internalItem) : keyPrefix.value + "." + internalItem.index }, [internalItem.value === void 0 ? renderSlot(_ctx.$slots, "placeholder", {
								key: 0,
								index: internalItem.index,
								style: normalizeStyle(internalItem.style),
								total: unref(buffer).length
							}) : renderSlot(_ctx.$slots, "default", {
								key: 1,
								item: internalItem.value,
								index: internalItem.index,
								style: normalizeStyle(internalItem.style),
								total: unref(buffer).length
							})], 64);
						}), 128)),
						!unref(ready) ? (openBlock(), createBlock(resolveDynamicComponent(__props.probeTag), {
							key: 1,
							style: normalizeStyle(ssrProbeStyles.value),
							ref: "probe"
						}, {
							default: withCtx(() => [renderSlot(_ctx.$slots, "probe")]),
							_: 3
						}, 8, ["style"])) : createCommentVNode("v-if", true)
					]),
					_: 3
				}, 8, ["style"])), [[vShow, __props.length > 0]]);
			};
		})();
	}
});

//#endregion
export { _sfc_main as default };