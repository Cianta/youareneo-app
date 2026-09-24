import { NextResponse } from "next/server";
import { findBirthPlaces } from "@/lib/workspace/places";
export async function GET(req: Request) {
  return NextResponse.json({
    places: findBirthPlaces(new URL(req.url).searchParams.get("q") ?? ""),
  });
}
