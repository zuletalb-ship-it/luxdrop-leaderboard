import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.PACKDRAW_API_KEY;
  console.log("PACKDRAW KEY EXISTS:", !!apiKey);
console.log("PACKDRAW KEY START:", apiKey?.slice(0, 8));
console.log("PACKDRAW KEY END:", apiKey?.slice(-4));

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing PACKDRAW_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const now = new Date();

const startDate = `${now.getMonth() + 1}-1-${now.getFullYear()}`;

    const url = `https://packdraw.com/api/v1/affiliates/leaderboard?after=${startDate}&apiKey=${apiKey}`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "PackDraw API error", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch PackDraw API",
        details: String(error),
      },
      { status: 500 }
    );
  }
}