import { MaybeRefOrGetter } from "vue";

//#region src/composables/createPageProvider.d.ts
declare function createPageProvider<T>(data: MaybeRefOrGetter<T[]>): (page: number, pageSize: number) => T[];
//#endregion
export { createPageProvider };