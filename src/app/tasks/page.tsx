"use client";

import { AppShell } from "@/components/AppShell";
import { PageIntro } from "@/components/anim/PageIntro";
import { Stagger } from "@/components/anim/Stagger";
import { FloatUp } from "@/components/anim/FloatUp";
import { gsap, useGSAP } from "@/components/anim/gsap";
import { formatPoints, formatTime } from "@/lib/format";
import { useCallback, useEffect, useRef, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: string;
  claimed: boolean;
  claimedAt: string | null;
};

type Float = { key: number; taskId: string; text: string };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const messageRef = useRef<HTMLParagraphElement>(null);

  const load = useCallback(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((payload) => payload.ok && setTasks(payload.data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useGSAP(
    () => {
      if (!message) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(messageRef.current, {
        autoAlpha: 0,
        y: -10,
        scale: 0.98,
        duration: 0.45,
        ease: "power3.out",
      });
    },
    { scope: messageRef, dependencies: [message] }
  );

  async function claim(task: Task) {
    setBusyId(task.id);
    setMessage("");
    const res = await fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });
    const payload = await res.json();
    setBusyId(null);
    if (!payload.ok) {
      setMessage(payload.error);
    } else {
      setMessage(`已入账 ${payload.data.task.reward} 分，当前余额 ${payload.data.balance} 分`);
      setFloats((prev) => [
        ...prev,
        { key: Date.now(), taskId: task.id, text: `+${payload.data.task.reward}` },
      ]);
    }
    load();
  }

  return (
    <AppShell>
      <PageIntro
        kicker="TASKS"
        title="任务台"
        sub="演示环境中点击「领取积分」即视为任务完成。服务端以 (userId, taskId) 唯一约束保证同一奖励不会发两次。"
      />

      {message && (
        <p ref={messageRef} className="mt-4 bg-[#efe3c6] px-3 py-2 text-sm">
          {message}
        </p>
      )}

      <Stagger className="mt-6 space-y-3" deps={[tasks.length]} each={0.1}>
        {tasks.map((task) => (
          <article key={task.id} data-reveal className="panel panel-hover rounded-sm p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs tracking-wide text-[#8a6a2f]">{task.category}</div>
                <h2 className="mt-1 text-xl">{task.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6458]">
                  {task.description}
                </p>
              </div>
              <div className="text-right">
                <div className="mono text-lg">{formatPoints(task.reward)}</div>
                {task.claimed ? (
                  <p className="mt-2 text-xs text-[#1f6b4a]">
                    已于 {task.claimedAt ? formatTime(task.claimedAt) : "—"} 领取
                  </p>
                ) : (
                  <div className="relative mt-3 inline-block">
                    <button
                      disabled={busyId === task.id}
                      onClick={() => claim(task)}
                      className="btn-ink px-3 py-1.5 text-sm disabled:pointer-events-none disabled:opacity-60"
                    >
                      {busyId === task.id ? "入账中…" : "领取积分"}
                    </button>
                    {floats
                      .filter((f) => f.taskId === task.id)
                      .map((f) => (
                        <FloatUp
                          key={f.key}
                          onDone={() =>
                            setFloats((prev) => prev.filter((p) => p.key !== f.key))
                          }
                          className="mono pointer-events-none absolute right-0 -top-2 text-lg text-[#1f6b4a]"
                        >
                          {f.text}
                        </FloatUp>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </Stagger>
    </AppShell>
  );
}
