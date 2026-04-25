import { _typeof } from "./typeof.js";
import { toPrimitive } from "./toPrimitive.js";

//#region \0@oxc-project+runtime@0.112.0/helpers/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}

//#endregion
export { toPropertyKey };