"use client";

import { gsap, useGSAP } from "@/components/anim/gsap";
import { useRef } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(ref.current, {
        autoAlpha: 0,
        duration: 0.45,
        ease: "power2.out",
        clearProps: "opacity,visibility",
      });
    },
    { scope: ref }
  );

  return <div ref={ref}>{children}</div>;
}
