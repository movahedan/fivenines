/** PEG-style export name expected by react-native-svg's transform. */
export class PegSyntaxError extends Error {
	name = "SyntaxError";
}

export { PegSyntaxError as SyntaxError };

export const StartRules = ["start"];

export function parse() {
	return [];
}

export default { SyntaxError, StartRules, parse };
