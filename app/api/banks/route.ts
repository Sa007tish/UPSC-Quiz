import { NextResponse } from "next/server";
import { loadAllBankMeta } from "@/lib/banks";

export async function GET() {
  const meta = loadAllBankMeta();
  return NextResponse.json({ banks: meta });
}
