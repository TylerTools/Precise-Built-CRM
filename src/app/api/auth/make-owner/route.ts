// One-time route — promotes a user to owner role
// DELETE THIS FILE after running
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.SEED_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "owner" },
  });

  return Response.json({
    success: true,
    user: { email: user.email, role: user.role },
  });
}
