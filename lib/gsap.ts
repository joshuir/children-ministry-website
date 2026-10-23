/**
 * One place where GSAP and its plugins are registered (client components only).
 * Following GreenSock's React guidance: components animate with useGSAP() and a scope,
 * so every tween and ScrollTrigger is reverted automatically when the component unmounts.
 */
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { Flip } from "gsap/Flip";
import { TextPlugin } from "gsap/TextPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin, Draggable, InertiaPlugin, Flip, TextPlugin);
}

export { gsap, useGSAP, ScrollTrigger, Draggable, Flip };

/** Runs `onVisible(true/false)` as the element scrolls in and out of view (for pausing loops). */
export function whileVisible(el: Element, onVisible: (on: boolean) => void) {
  return ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (self) => onVisible(self.isActive) });
}
