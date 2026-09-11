"use client";

import { gsap, useGSAP } from "./gsap";
import { useRef } from "react";

type CountUpProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  initial?: number;
};

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.1,
  className,
  initial = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const proxy = useRef({ n: initial });
  const tweenRef = useRef<ReturnType<typeof gsap.to> | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      tweenRef.current?.kill();
      const render = (n: number) => {
        el.textContent = `${prefix}${Math.round(n).toLocaleString("zh-CN")}${suffix}`;
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        proxy.current.n = value;
        render(value);
        return;
      }
      tweenRef.current = gsap.to(proxy.current, {
        n: value,
        duration,
        ease: "power2.out",
        onUpdate: () => render(proxy.current.n),
      });
    },
    { scope: ref, dependencies: [value] }
  );

  return <span ref={ref} className={className} />;
}
