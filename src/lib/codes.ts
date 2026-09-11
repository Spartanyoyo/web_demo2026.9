import { randomBytes } from "crypto";

export function newIdempotencyKey() {
  return randomBytes(16).toString("hex");
}

export function fulfillmentCode(productSlug: string) {
  const token = randomBytes(4).toString("hex").toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase();
  return `PD-${productSlug.slice(0, 8).toUpperCase()}-${stamp}-${token}`;
}
