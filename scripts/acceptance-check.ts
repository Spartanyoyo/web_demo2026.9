/**
 * Hits a running PointDesk server and checks the four hard rules:
 * 1. same task cannot be claimed twice
 * 2. same redeem request does not double-charge or re-fulfill
 * 3. insufficient balance is rejected without debit
 * 4. fulfillment failure does not debit
 *
 * Usage: BASE_URL=http://localhost:3000 npm run demo:check
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

type Envelope<T> = { ok: boolean; data?: T; error?: string };

async function req<T>(path: string, init: RequestInit & { cookie?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const json = (await res.json()) as Envelope<T>;
  return { status: res.status, json, rawCookie: res.headers.get("set-cookie") };
}

function cookieFrom(setCookie: string | null) {
  if (!setCookie) throw new Error("login did not set session cookie");
  return setCookie.split(";")[0];
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

async function main() {
  const email = `qa.${Date.now()}@pointdesk.local`;
  const password = "intern123";
  const register = await req<{ id: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "验收账号", email, password }),
  });
  assert(register.json.ok, `register failed: ${register.json.error}`);
  const cookie = cookieFrom(register.rawCookie);

  const tasksRes = await req<Array<{ id: string; slug: string; reward: number }>>("/api/tasks", { cookie });
  assert(tasksRes.json.ok && tasksRes.json.data, "list tasks failed");
  const quiz = tasksRes.json.data.find((t) => t.slug === "monday-quiz");
  const memo = tasksRes.json.data.find((t) => t.slug === "read-weekly-memo");
  assert(quiz && memo, "seed tasks missing");

  const first = await req(`/api/tasks/${quiz.id}/complete`, { method: "POST", cookie });
  assert(first.json.ok, `first claim failed: ${first.json.error}`);
  const second = await req(`/api/tasks/${quiz.id}/complete`, { method: "POST", cookie });
  assert(!second.json.ok && second.status === 409, "duplicate task claim should be rejected");

  await req(`/api/tasks/${memo.id}/complete`, { method: "POST", cookie });
  // balance should now be 20 + 30 = 50

  const productsRes = await req<{
    balance: number;
    products: Array<{ id: string; slug: string; cost: number }>;
  }>("/api/products", { cookie });
  assert(productsRes.json.ok && productsRes.json.data, "list products failed");
  const { balance, products } = productsRes.json.data;
  assert(balance === 50, `expected balance 50 after two tasks, got ${balance}`);

  const badge = products.find((p) => p.slug === "tombstone-badge");
  const office = products.find((p) => p.slug === "partner-office-hour");
  const flaky = products.find((p) => p.slug === "limited-alpha-note");
  assert(badge && office && flaky, "seed products missing");

  const key = `qa-${Date.now()}-badge`;
  const redeem1 = await req<{
    status: string;
    pointsSpent: number;
    fulfillmentCode: string | null;
    replayed: boolean;
    balance: number;
  }>("/api/redeem", {
    method: "POST",
    cookie,
    body: JSON.stringify({ productId: badge.id, idempotencyKey: key }),
  });
  assert(redeem1.json.ok && redeem1.json.data?.status === "SUCCESS", "badge redeem should succeed");
  assert(redeem1.json.data?.fulfillmentCode, "success should return a code");
  const code = redeem1.json.data!.fulfillmentCode;
  const afterBadge = redeem1.json.data!.balance;
  assert(afterBadge === 25, `expected 25 after badge, got ${afterBadge}`);

  const redeem1b = await req<{
    status: string;
    pointsSpent: number;
    fulfillmentCode: string | null;
    replayed: boolean;
    balance: number;
  }>("/api/redeem", {
    method: "POST",
    cookie,
    body: JSON.stringify({ productId: badge.id, idempotencyKey: key }),
  });
  assert(redeem1b.json.data?.replayed === true, "second submit should be treated as replay");
  assert(redeem1b.json.data?.fulfillmentCode === code, "replay must not issue a new code");
  assert(redeem1b.json.data?.balance === 25, "replay must not debit again");

  const reject = await req<{ status: string; pointsSpent: number; balance: number }>("/api/redeem", {
    method: "POST",
    cookie,
    body: JSON.stringify({ productId: office.id, idempotencyKey: `qa-${Date.now()}-office` }),
  });
  assert(reject.json.data?.status === "REJECTED", "expensive item should be rejected");
  assert(reject.json.data?.pointsSpent === 0, "rejected redeem must not spend points");
  assert(reject.json.data?.balance === 25, "rejected redeem must not change balance");

  const fail = await req<{ status: string; pointsSpent: number; balance: number; failReason: string | null }>(
    "/api/redeem",
    {
      method: "POST",
      cookie,
      body: JSON.stringify({ productId: flaky.id, idempotencyKey: `qa-${Date.now()}-flaky` }),
    },
  );
  assert(fail.json.data?.status === "FAILED", "flaky sku should fail fulfillment");
  assert(fail.json.data?.pointsSpent === 0, "failed fulfillment must not spend points");
  assert(fail.json.data?.balance === 25, "failed fulfillment must not change balance");
  assert(Boolean(fail.json.data?.failReason), "failed fulfillment must explain why");

  console.log("acceptance-check passed");
  console.log(JSON.stringify({ email, balanceAfter: 25 }, null, 2));
}

main().catch((error) => {
  console.error("acceptance-check failed");
  console.error(error);
  process.exit(1);
});
