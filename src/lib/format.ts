export function formatPoints(n: number) {
  return `${n.toLocaleString("zh-CN")} 分`;
}

export function formatTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function statusLabel(status: string) {
  if (status === "SUCCESS") return "发放成功";
  if (status === "FAILED") return "发放失败";
  if (status === "REJECTED") return "未扣分驳回";
  return status;
}
