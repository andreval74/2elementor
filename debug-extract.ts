
import { extractCSS, extractColorFromClass } from "./src/services/css-extractor";
console.log("Testing extractColorFromClass with text-white:");
console.log(extractColorFromClass("text-white"));

console.log("\nTesting extractCSS with text-white:");
const result = extractCSS("text-white text-5xl font-bold", {});
console.log("Result of extractCSS:", JSON.stringify(result, null, 2));
