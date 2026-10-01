import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@radar/database";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    return NextResponse.json({ success: true, isActive: updated.isActive });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to update user", details: String(err) },
      { status: 500 },
    );
  }
}
