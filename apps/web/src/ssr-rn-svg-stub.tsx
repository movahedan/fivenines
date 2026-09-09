import { createElement, type ReactNode } from "react";

type SvgBoxProps = { readonly children?: ReactNode } & Record<string, unknown>;

function svgBox(tag: string) {
	return function SvgBox({ children, ...rest }: SvgBoxProps) {
		return createElement(tag, rest, children);
	};
}

export const Svg = svgBox("svg");
export const Path = svgBox("path");
export const Circle = svgBox("circle");
export const Ellipse = svgBox("ellipse");
export const Rect = svgBox("rect");
export const Line = svgBox("line");
export const Polyline = svgBox("polyline");
export const Polygon = svgBox("polygon");
export const G = svgBox("g");
export const Text = svgBox("text");
export const TSpan = svgBox("tspan");
export const TextPath = svgBox("textPath");
export const Use = svgBox("use");
export const Image = svgBox("image");
export const Defs = svgBox("defs");
export const LinearGradient = svgBox("linearGradient");
export const RadialGradient = svgBox("radialGradient");
export const Stop = svgBox("stop");
export const ClipPath = svgBox("clipPath");
export const Mask = svgBox("mask");
export const Pattern = svgBox("pattern");
export const Marker = svgBox("marker");
export const ForeignObject = svgBox("foreignObject");

export default Svg;
