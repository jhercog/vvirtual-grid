import { shallowRef } from "vue";
import "rxjs";
import { tryOnUnmounted } from "@vueuse/core";

//#region src/composables/useObservable.ts
function useObservable(observable) {
	const valueRef = shallowRef();
	const subscription = observable.subscribe((val) => valueRef.value = val);
	tryOnUnmounted(() => subscription.unsubscribe());
	return valueRef;
}

//#endregion
export { useObservable };