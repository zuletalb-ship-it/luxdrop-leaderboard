
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Player = {
  username: string;
  wagered: number;
};

type ShufflePlayer = {
  username: string;
  wagerAmount: number;
};

function maskUsername(username: string): string {
  if (username.length <= 3) {
    return username[0] + "*".repeat(username.length - 1);
  }

  return (
    username.slice(0, 2) +
    "*".repeat(username.length - 3) +
    username.slice(-1)
  );
}

function maskPlayers(players: Player[]): Player[] {
  return players.map((player) => ({
    ...player,
    username: maskUsername(player.username),
  }));
}

const CACHE_ID = 1;

// Successful data refresh interval: 3 minutes
const CACHE_SECONDS = 180;

// Minimum time between Shuffle API attempts.
// Also allows recovery from a failed refresh.
const RETRY_SECONDS = 180;

function getCompetition() {
  const now = new Date();

  // Shuffle resets on the 19th at 00:00 UTC.
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() -
        (now.getUTCDate() < 19 ? 1 : 0),
      19
    )
  );

  const end = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      19
    )
  );

  return { start, end };
}

export async function GET() {
  const databaseUrl = process.env.SHUFFLE_DB_DATABASE_URL;
  const apiKey = process.env.SHUFFLE_API_KEY;

  if (!databaseUrl || !apiKey) {
    return NextResponse.json(
      { error: "Missing Shuffle configuration" },
      { status: 500 }
    );
  }

  const sql = neon(databaseUrl);
  const { start, end } = getCompetition();

  const startISO = start.toISOString();
  const endISO = end.toISOString();

  try {
    // Create a cache record if none exists.
    await sql`
      INSERT INTO shuffle_leaderboard_cache (
        id,
        players,
        competition_start,
        competition_end,
        updated_at,
        refresh_started_at
      )
      VALUES (
        ${CACHE_ID},
        '[]'::jsonb,
        ${startISO},
        ${endISO},
        NOW() - INTERVAL '10 minutes',
        NULL
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Read the saved leaderboard.
    const rows = await sql`
      SELECT
        players,
        competition_start,
        competition_end,
        updated_at,
        refresh_started_at
      FROM shuffle_leaderboard_cache
      WHERE id = ${CACHE_ID}
    `;

    const cached = rows[0];

    const sameCompetition =
      new Date(cached.competition_start).getTime() ===
        start.getTime() &&
      new Date(cached.competition_end).getTime() ===
        end.getTime();

    const age =
      Date.now() -
      new Date(cached.updated_at).getTime();

    // Return fresh cached data, including an empty
    // leaderboard if Shuffle confirmed zero players.
    if (
      sameCompetition &&
      age >= 0 &&
      age < CACHE_SECONDS * 1000
    ) {
      
return NextResponse.json(maskPlayers(cached.players));

    }

    // Atomically claim a refresh.
    // Only one Vercel instance can claim it.
    // The lock also prevents requests from exceeding
    // Shuffle's rate limit during normal operation.
    const claimed = await sql`
      UPDATE shuffle_leaderboard_cache
      SET refresh_started_at = NOW()
      WHERE id = ${CACHE_ID}
        AND (
          refresh_started_at IS NULL
          OR refresh_started_at <=
            NOW() - (${RETRY_SECONDS} * INTERVAL '1 second')
        )
      RETURNING id
    `;

   
if (claimed.length === 0) {
  return NextResponse.json(
    sameCompetition ? maskPlayers(cached.players) : []
  );
}


    const url = new URL(
      `https://affiliate.shufflexternal.com/wager/${encodeURIComponent(apiKey)}`
    );

    url.searchParams.set(
      "startTime",
      Math.floor(start.getTime() / 1000).toString()
    );

    url.searchParams.set(
      "endTime",
      Math.floor(end.getTime() / 1000).toString()
    );

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Shuffle API error: ${response.status}`
      );
    }

    const data: ShufflePlayer[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid Shuffle API response");
    }

    const players: Player[] = data
      
.filter(
  (player) =>
    typeof player.username === "string" &&
    typeof player.wagerAmount === "number" &&
    Number.isFinite(player.wagerAmount)
)

.map((player) => ({
  username: maskUsername(player.username),
  wagered: player.wagerAmount,
}))


      .sort((a, b) => b.wagered - a.wagered);

    // Save the successful result and its competition.
    await sql`
      UPDATE shuffle_leaderboard_cache
      SET
        players = ${JSON.stringify(players)}::jsonb,
        competition_start = ${startISO},
        competition_end = ${endISO},
        updated_at = NOW()
      WHERE id = ${CACHE_ID}
    `;

    return NextResponse.json(players);
  } catch (error) {
    console.error("Shuffle cache error:", error);

    // Preserve the last successful leaderboard
    // if Shuffle temporarily fails.
    try {
      const fallback = await sql`
        SELECT players, competition_start
        FROM shuffle_leaderboard_cache
        WHERE id = ${CACHE_ID}
      `;

      if (
        fallback.length > 0 &&
        new Date(
          fallback[0].competition_start
        ).getTime() === start.getTime()
      ) {
        
return NextResponse.json(maskPlayers(fallback[0].players));

      }
    } catch (fallbackError) {
      console.error(
        "Shuffle fallback error:",
        fallbackError
      );
    }

    return NextResponse.json(
      { error: "Unable to load Shuffle leaderboard" },
      { status: 500 }
    );
  }
}
