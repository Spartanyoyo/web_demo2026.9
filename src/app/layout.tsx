import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PointDesk 点金台",
  description: "私募实习生任务积分与数字权益兑换台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
