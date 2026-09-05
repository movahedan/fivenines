function createStyleq(options) {
	const transform = options?.transform;
	return function styleqFn(...args) {
		let className = "";
		let inlineStyle = null;
		const styles = args.flat(Number.POSITIVE_INFINITY).reverse();
		const seen = new Set();
		for (const possible of styles) {
			if (possible == null || possible === false) {
				continue;
			}
			const style = transform != null ? transform(possible) : possible;
			if (style.$$css) {
				for (const [prop, value] of Object.entries(style)) {
					if (prop === "$$css" || seen.has(prop)) {
						continue;
					}
					seen.add(prop);
					if (typeof value === "string") {
						className = className === "" ? value : `${className} ${value}`;
					}
				}
			} else {
				inlineStyle = inlineStyle == null ? { ...style } : { ...style, ...inlineStyle };
			}
		}
		return [className, inlineStyle];
	};
}

const styleq = createStyleq();
styleq.factory = createStyleq;

export { styleq };
