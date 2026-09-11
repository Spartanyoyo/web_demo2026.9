"use client";

import { gsap, useGSAP } from "./gsap";
import { ReactNode, useRef } from "react";

type FloatUpProps = {
  children: ReactNode;
  onDone?: () => void;
  className?: string;
};

export function FloatUp({ children, onDone, className }: FloatUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    (context, contextSafe) => {
      const done = contextSafe?.(() => onDone?.()) ?? (() => onDone?.());
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        done();
        return;
      }
      gsap.to(ref.current, {
        y: -48,
        autoAlpha: 0,
        duration: 1.15,
        ease: "power2.out",
        onComplete: done,
      });
    },
    { scope: ref }
  );

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
