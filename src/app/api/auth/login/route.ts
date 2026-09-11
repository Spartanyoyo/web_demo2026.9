import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { setSessionCookie, signSession } from "@/lib/session";

const schema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return jsonError("邮箱或密码不正确", 401);
    }
    const token = await signSession({ uid: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);
    return jsonOk({ id: user.id, email: user.email, name: user.name, balance: user.balance });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "参数不合法", 400);
    }
    return handleRouteError(error);
  }
}
