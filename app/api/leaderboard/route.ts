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

const pacificParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "numeric",
  day: "numeric",
}).formatToParts(now);

const parts = Object.fromEntries(
  pacificParts.map((part) => [part.type, part.value])
);

let year = Number(parts.year);
let month = Number(parts.month);
const day = Number(parts.day);

if (day < 11) {
  month--;

  if (month === 0) {
    month = 12;
    year--;
  }
}

const startDate =
  `${year}-${String(month).padStart(2, "0")}-11`;


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