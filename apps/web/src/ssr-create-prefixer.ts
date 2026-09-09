export default function createPrefixer(): (style: unknown) => unknown {
	return (style) => style;
}
