import { NextResponse } from "next/server";
import { loadBankById } from "@/lib/banks";

export async function GET(_req: Request, { params }: { params: { bankId: string } }) {
  const bank = loadBankById(params.bankId);
  if (!bank) {
    return NextResponse.json({ error: `Bank "${params.bankId}" not found` }, { status: 404 });
  }
  return NextResponse.json({ bank });
}
