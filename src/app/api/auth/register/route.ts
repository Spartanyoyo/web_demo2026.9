import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, handleRouteError } from "@/lib/http";
import { setSessionCookie, signSession } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(1, "请填写姓名").max(40),
  email: z.string().trim().email("邮箱格式不正确").max(120),
  password: z.string().min(6, "密码至少 6 位").max(72),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return jsonError("该邮箱已注册", 409);
    }
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        passwordHash: await bcrypt.hash(body.password, 10),
        balance: 0,
      },
    });
    const token = await signSession({ uid: user.id, email: user.email, name: user.name });
    await setSessionCookie(token);
    return jsonOk({ id: user.id, email: user.email, name: user.name, balance: user.balance }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "参数不合法", 400);
    }
    return handleRouteError(error);
  }
}
