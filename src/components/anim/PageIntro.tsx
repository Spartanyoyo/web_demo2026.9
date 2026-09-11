"use client";

import { gsap, useGSAP } from "./gsap";
import { ReactNode, useRef } from "react";

type PageIntroProps = {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
};

export function PageIntro({ kicker, title, sub, right }: PageIntroProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tl = gsap.timeline({ defaults: { duration: 0.8, ease: "power3.out" } });
      tl.from(".pi-kicker", { autoAlpha: 0, y: 12, duration: 0.55, clearProps: "transform,opacity,visibility" })
        .from(".pi-title", { autoAlpha: 0, y: 26, clearProps: "transform,opacity,visibility" }, reduced ? 0 : "-=0.35")
        .from(
          ".pi-rule",
          { scaleX: 0, transformOrigin: "left center", duration: 0.7, ease: "power2.inOut", clearProps: "transform,opacity,visibility" },
          reduced ? 0 : "-=0.4"
        )
        .from(".pi-sub, .pi-right", { autoAlpha: 0, y: 14, clearProps: "transform,opacity,visibility" }, reduced ? 0 : "-=0.45");
      if (reduced) tl.timeScale(100);
    },
    { scope }
  );

  return (
    <div ref={scope}>
      <p className="pi-kicker text-sm uppercase tracking-[0.18em] text-[#8a6a2f]">{kicker}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="pi-title text-3xl md:text-4xl">{title}</h1>
        {right && <div className="pi-right">{right}</div>}
      </div>
      <div className="pi-rule mt-3 h-px w-24 bg-gradient-to-r from-[#cbb98a] to-transparent" />
      {sub && <p className="pi-sub mt-4 max-w-2xl leading-7 text-[#6b6458]">{sub}</p>}
    </div>
  );
}
