"use client";

import { gsap, useGSAP } from "@/components/anim/gsap";
import { CountUp } from "@/components/anim/CountUp";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Me = {
  name: string;
  email: string;
  balance: number;
};

const NAV = [
  { href: "/dashboard", label: "总览" },
  { href: "/tasks", label: "任务" },
  { href: "/shop", label: "兑换" },
  { href: "/ledger", label: "账本" },
  { href: "/redemptions", label: "兑换结果" },
];

let shellSeen = false;
let cachedBalance: number | null = null;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const balanceRef = useRef<HTMLSpanElement>(null);
  const prevBalance = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((payload) => {
        if (!payload.ok) {
          router.replace("/");
          return;
        }
        cachedBalance = payload.data.balance;
        setMe(payload.data);
      })
      .catch(() => router.replace("/"));
  }, [pathname, router]);

  useGSAP(
    () => {
      if (shellSeen) return;
      shellSeen = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power3.out" } });
      tl.from(".shell-logo", { autoAlpha: 0, y: -12, duration: 0.5 })
        .from(".shell-nav > *", { autoAlpha: 0, y: -10, stagger: 0.05 }, "-=0.3")
        .from(".shell-user > *", { autoAlpha: 0, y: -10, stagger: 0.06 }, "-=0.4");
    },
    { scope: headerRef }
  );

  useGSAP(
    () => {
      const el = balanceRef.current;
      if (!el || me === null) return;
      const prev = prevBalance.current;
      prevBalance.current = me.balance;
      if (prev === null || prev === me.balance) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        el,
        { scale: 1.4, color: "#b8860b" },
        { scale: 1, color: "#8a6a2f", duration: 0.55, ease: "power2.out", clearProps: "transform" }
      );
    },
    { scope: balanceRef, dependencies: [me?.balance] }
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  return (
    <div className="min-h-screen">
      <header
        ref={headerRef}
        className="sticky top-0 z-10 border-b border-[#ddd4c4] bg-[#f7f4ee]/90 backdrop-blur"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/dashboard" className="shell-logo group flex items-baseline gap-2">
            <span className="text-lg tracking-wide transition-colors group-hover:text-[#8a6a2f]">
              PointDesk
            </span>
            <span className="text-sm text-[#8a6a2f]">点金台</span>
          </Link>
          <nav className="shell-nav hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative rounded-sm px-3 py-1.5 text-sm transition-colors duration-200 ${
                    active ? "bg-[#efe3c6] text-[#1c1914]" : "text-[#6b6458] hover:bg-[#efe3c6]/50"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-2 -bottom-px h-px origin-left bg-[#8a6a2f] transition-transform duration-300 ease-out ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
          <div className="shell-user flex items-center gap-3 text-sm">
            <span ref={balanceRef} className="mono text-[#8a6a2f]">
              {me ? (
                <CountUp
                  value={me.balance}
                  suffix=" 分"
                  initial={cachedBalance ?? 0}
                />
              ) : (
                "—"
              )}
            </span>
            <span className="hidden text-[#6b6458] sm:inline">{me?.name ?? ""}</span>
            <button
              onClick={logout}
              className="rounded-sm border border-[#ddd4c4] px-2 py-1 text-[#6b6458] transition-all duration-200 hover:-translate-y-px hover:border-[#cbb98a] hover:bg-white hover:text-[#1c1914] active:translate-y-0"
            >
              退出
            </button>
          </div>
        </div>
        <nav className="shell-nav flex gap-1 overflow-x-auto border-t border-[#eee6d8] px-3 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-sm px-3 py-1 text-sm transition-colors duration-200 ${
                pathname === item.href ? "bg-[#efe3c6] text-[#1c1914]" : "text-[#6b6458]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
