"use client";

import { gsap, useGSAP } from "@/components/anim/gsap";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function GatePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("intern@pointdesk.local");
  const [password, setPassword] = useState("intern123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const scope = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((payload) => {
        if (payload.ok && payload.data) router.replace("/dashboard");
      })
      .catch(() => undefined);
  }, [router]);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tl = gsap.timeline({ defaults: { duration: 0.85, ease: "power3.out" } });
      tl.from(".gate-kicker", { autoAlpha: 0, y: 14, duration: 0.6 })
        .from(".gate-title > *", { autoAlpha: 0, y: 30, stagger: 0.1 }, reduced ? 0 : "-=0.4")
        .from(".gate-desc", { autoAlpha: 0, y: 18 }, reduced ? 0 : "-=0.45")
        .from(".gate-feat > *", { autoAlpha: 0, x: -14, stagger: 0.09 }, reduced ? 0 : "-=0.4")
        .from(
          ".gate-panel",
          { autoAlpha: 0, y: 34, scale: 0.97, duration: 0.9, ease: "back.out(1.2)" },
          reduced ? 0 : "-=0.55"
        )
        .from(".gate-hint", { autoAlpha: 0 }, reduced ? 0 : "-=0.3");
      if (reduced) tl.timeScale(100);
    },
    { scope }
  );

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.to(".orb", {
        y: (i) => (i % 2 === 0 ? 30 : -24),
        x: (i) => (i % 2 === 0 ? 16 : -18),
        duration: (i) => 7 + i * 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.4,
      });
    },
    { scope }
  );

  useGSAP(
    () => {
      const el = indicatorRef.current;
      const loginTab = loginTabRef.current;
      const registerTab = registerTabRef.current;
      if (!el || !loginTab || !registerTab) return;
      const target = mode === "login" ? loginTab : registerTab;
      const setPos = () => {
        el.style.left = `${target.offsetLeft}px`;
        el.style.width = `${target.offsetWidth}px`;
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setPos();
        return;
      }
      gsap.to(el, {
        left: target.offsetLeft,
        width: target.offsetWidth,
        duration: 0.35,
        ease: "power3.out",
      });
    },
    { scope: tabsRef, dependencies: [mode] }
  );

  useGSAP(
    () => {
      if (!error) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        errorRef.current,
        { x: -8 },
        {
          x: 8,
          duration: 0.06,
          repeat: 5,
          yoyo: true,
          ease: "power1.inOut",
          clearProps: "x",
        }
      );
    },
    { scope: errorRef, dependencies: [error] }
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const payload = await res.json();
    setBusy(false);
    if (!payload.ok) {
      setError(payload.error ?? "请求失败");
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <div ref={scope} className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="orb absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#cbb98a]/25 blur-3xl" />
        <div className="orb absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-[#8a6a2f]/15 blur-3xl" />
        <div className="orb absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[#efe3c6]/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-16">
        <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <section>
            <p className="gate-kicker text-sm tracking-[0.18em] text-[#8a6a2f]">
              PRIVATE EQUITY INTERN DESK
            </p>
            <h1 className="gate-title mt-3 text-4xl leading-tight md:text-5xl">
              <span className="block">PointDesk</span>
              <span className="block text-[#8a6a2f]">点金台</span>
            </h1>
            <p className="gate-desc mt-5 max-w-md text-[#6b6458] leading-7">
              完成研究与建模任务获得积分，用积分兑换数字商品。同一任务不可重复领奖，重复兑换请求不会二次扣分或发货。
            </p>
            <ul className="gate-feat mt-6 space-y-2 text-sm text-[#6b6458]">
              <li>— 余额、收支明细与兑换结果均可追溯</li>
              <li>— 余额不足或发放失败会明确说明，且不误扣</li>
              <li>— 本地虚构账本，不接入真实资金</li>
            </ul>
          </section>

          <section className="gate-panel panel rounded-sm p-6">
            <div ref={tabsRef} className="relative mb-5 flex gap-2 text-sm">
              <button
                ref={loginTabRef}
                className={`relative px-3 py-1 transition-colors duration-200 ${
                  mode === "login" ? "text-[#1c1914]" : "text-[#6b6458] hover:text-[#1c1914]"
                }`}
                onClick={() => setMode("login")}
                type="button"
              >
                登录
              </button>
              <button
                ref={registerTabRef}
                className={`relative px-3 py-1 transition-colors duration-200 ${
                  mode === "register" ? "text-[#1c1914]" : "text-[#6b6458] hover:text-[#1c1914]"
                }`}
                onClick={() => setMode("register")}
                type="button"
              >
                注册
              </button>
              <span
                ref={indicatorRef}
                className="absolute bottom-0 left-0 h-[2px] w-12 bg-[#8a6a2f]"
              />
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              {mode === "register" && (
                <label className="block text-sm">
                  姓名
                  <input
                    className="mt-1 w-full border border-[#ddd4c4] bg-white px-3 py-2 transition-all duration-200 hover:border-[#cbb98a] focus:border-[#8a6a2f] focus:shadow-[0_0_0_3px_rgba(138,106,47,0.12)] focus:outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
              )}
              <label className="block text-sm">
                邮箱
                <input
                  className="mt-1 w-full border border-[#ddd4c4] bg-white px-3 py-2 transition-all duration-200 hover:border-[#cbb98a] focus:border-[#8a6a2f] focus:shadow-[0_0_0_3px_rgba(138,106,47,0.12)] focus:outline-none"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                密码
                <input
                  className="mt-1 w-full border border-[#ddd4c4] bg-white px-3 py-2 transition-all duration-200 hover:border-[#cbb98a] focus:border-[#8a6a2f] focus:shadow-[0_0_0_3px_rgba(138,106,47,0.12)] focus:outline-none"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              {error && (
                <p
                  ref={errorRef}
                  className="bg-[#f8e2e2] px-3 py-2 text-sm text-[#8f2d2d]"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="btn-ink w-full px-4 py-2.5 disabled:pointer-events-none disabled:opacity-60"
              >
                {busy ? "处理中…" : mode === "login" ? "进入工作台" : "创建账户"}
              </button>
            </form>
            <p className="gate-hint mt-4 text-xs leading-5 text-[#6b6458]">
              演示账号：intern@pointdesk.local / intern123
              <br />
              注册新用户亦可，初始积分为 0。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
