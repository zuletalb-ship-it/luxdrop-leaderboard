import { NextResponse } from "next/server";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.LUXDROP_API_KEY;
  const proxyUrl = process.env.PROXY_URL;
  const affiliateCode = "Zuleta";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing LUXDROP_API_KEY" },
      { status: 500 }
    );
  }

  if (!proxyUrl) {
    return NextResponse.json(
      { error: "Missing PROXY_URL" },
      { status: 500 }
    );
  }

  try {
    const now = new Date();

let cycleStart = new Date(
  now.getFullYear(),
  now.getMonth(),
  11
);

// Before the 11th, the current race started on the 11th of last month.
if (now.getDate() < 11) {
  cycleStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    11
  );
}

const startDate = `${cycleStart.getFullYear()}-${String(
  cycleStart.getMonth() + 1
).padStart(2, "0")}-${String(
  cycleStart.getDate()
).padStart(2, "0")}`;

    const url =
      `https://api.luxdrop.com/external/affiliates` +
      `?codes=${affiliateCode}` +
      `&startDate=${startDate}`;

    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await axios.get(url, {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
      httpsAgent: agent,
      proxy: false,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch LuxDrop API",
        details: error.message,
        response: error.response?.data,
      },
      { status: 500 }
    );
  }
}