"use client";

import { gsap, useGSAP } from "./gsap";
import { ReactNode, useRef } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  ease?: string;
  stagger?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
  duration = 0.85,
  ease = "power3.out",
  stagger = 0,
}: RevealProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        scope.current!.children,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration,
          delay,
          ease,
          stagger,
          clearProps: "transform,opacity,visibility",
        }
      );
    },
    { scope }
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
