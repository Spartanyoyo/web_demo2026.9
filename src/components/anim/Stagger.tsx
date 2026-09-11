"use client";

import { gsap, useGSAP } from "./gsap";
import { ElementType, ReactNode, useRef } from "react";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  deps?: unknown[];
  each?: number;
  delay?: number;
  y?: number;
  duration?: number;
};

export function Stagger({
  children,
  className,
  as: Tag = "div",
  deps = [],
  each = 0.08,
  delay = 0,
  y = 26,
  duration = 0.7,
}: StaggerProps) {
  const scope = useRef<HTMLElement>(null);
  const tweenRef = useRef<ReturnType<typeof gsap.fromTo> | null>(null);

  useGSAP(
    () => {
      const els = scope.current?.querySelectorAll("[data-reveal]");
      if (!els || els.length === 0) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      tweenRef.current?.kill();
      const fromVars: gsap.TweenVars = { autoAlpha: 0 };
      if (y !== 0) fromVars.y = y;
      tweenRef.current = gsap.fromTo(els, fromVars, {
        autoAlpha: 1,
        y: 0,
        duration,
        delay,
        ease: "power3.out",
        stagger: each,
        clearProps: "transform,opacity,visibility",
      });
    },
    { scope, dependencies: deps }
  );

  return (
    <Tag ref={scope} className={className}>
      {children}
    </Tag>
  );
}
