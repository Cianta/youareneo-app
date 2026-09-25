import { NextResponse } from "next/server";
import { calculateBirth, type BirthInput } from "@/lib/workspace/birth";
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BirthInput;
    if (
      typeof body.date !== "string" ||
      typeof body.time !== "string" ||
      typeof body.timezone !== "string"
    )
      throw new Error("Datum, Uhrzeit und Zeitzone prüfen.");
    return NextResponse.json(calculateBirth(body));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Berechnung fehlgeschlagen" },
      { status: 400 },
    );
  }
}
