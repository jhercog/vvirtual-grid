import { InternalItem, PageProvider } from "./pipeline.js";
import * as vue from "vue";
import { PropType } from "vue";

//#region src/Grid.vue.d.ts
declare const __VLS_export: <T extends object>(__VLS_props: NonNullable<Awaited<typeof __VLS_setup>>["props"], __VLS_ctx?: __VLS_PrettifyLocal<Pick<NonNullable<Awaited<typeof __VLS_setup>>, "attrs" | "emit" | "slots">>, __VLS_exposed?: NonNullable<Awaited<typeof __VLS_setup>>["expose"], __VLS_setup?: Promise<{
  props: vue.PublicProps & __VLS_PrettifyLocal<vue.ExtractPublicPropTypes<{
    /** Total number of items in the list  */length: {
      type: PropType<number>;
      required: boolean;
      validator: (value: number) => boolean;
    };
    pageProvider: {
      type: PropType<PageProvider<T>>;
      required: boolean;
    };
    /**
     * Debounce window in milliseconds on the calls to `pageProvider`,
     * which is useful for avoiding network requests of skimmed pages.
     */
    pageProviderDebounceTime: {
      type: PropType<number>;
      required: boolean;
      default: number;
      validator: (value: number) => boolean;
    }; /** The number of items in a page from the item provider (e.g. a backend API). */
    pageSize: {
      type: PropType<number>;
      required: boolean;
      validator: (value: number) => boolean;
    }; /** Scroll to a specific item by index, must be less than the length prop */
    scrollTo: {
      type: PropType<number>;
      required: boolean;
      validator: (value: number) => boolean;
    }; /** Snap to `scrollTo` when the grid container is resized */
    respectScrollToOnResize: {
      type: PropType<boolean>;
      required: boolean;
      default: boolean;
    }; /** The scroll behavior to use when scrolling to an item. */
    scrollBehavior: {
      type: PropType<"smooth" | "auto">;
      required: boolean;
      default: string;
      validator: (value: string) => boolean;
    }; /** Rendered tag for the wrapper */
    tag: {
      type: PropType<string>;
      required: boolean;
      default: string;
    }; /** The tag to use for the probe element. */
    probeTag: {
      type: PropType<string>;
      required: boolean;
      default: string;
    }; /** Method for key extraction from items */
    getKey: {
      type: PropType<(internalItem: InternalItem) => number | string>;
      required: boolean;
      default: undefined;
    };
  }>> & (typeof globalThis extends {
    __VLS_PROPS_FALLBACK: infer P;
  } ? P : {});
  expose: (exposed: vue.ShallowUnwrapRef<{
    allItems: Readonly<vue.Ref<unknown[], unknown[]>>;
    ready: Readonly<vue.Ref<boolean, boolean>>;
  }>) => void;
  attrs: any;
  slots: {
    probe?: (props: {}) => any;
  } & {
    placeholder?: (props: {
      total: number;
      style: {
        transform: string;
        gridArea: string;
      } | undefined;
      index: number;
    }) => any;
  } & {
    default?: (props: {
      total: number;
      style: {
        transform: string;
        gridArea: string;
      } | undefined;
      item: T;
      index: number;
    }) => any;
  } & {
    probe?: (props: {}) => any;
  };
  emit: {};
}>) => vue.VNode & {
  __ctx?: Awaited<typeof __VLS_setup>;
};
declare const _default: typeof __VLS_export;
type __VLS_PrettifyLocal<T> = (T extends any ? { [K in keyof T]: T[K] } : { [K in keyof T as K]: T[K] }) & {};
//#endregion
export { _default };