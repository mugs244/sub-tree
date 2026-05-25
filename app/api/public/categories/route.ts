import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const categories = await prisma.productCategory.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
    select: { id: true, key: true, label: true, type: true },
  })
  return NextResponse.json({ data: categories })
}
