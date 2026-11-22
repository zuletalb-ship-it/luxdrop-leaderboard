
"use client";

import { motion } from "framer-motion";
import { Crown, Trophy, Timer, Zap } from "lucide-react";
import { useEffect, useState } from "react";

type Leaderboard = "shuffle" | "luxdrop";

type Player = {
  rank: number;
  name: string;
  wagered: number;
  deposited?: number;
  avatar?: string;
};

const CONFIG = {
  
shuffle: {
  name: "SHUFFLE",
  prizePool: "$3500",
  prizes: ["$1500", "$1000", "$500", "$300", "$200"],
  api: "/api/shuffle",
},

  luxdrop: {
    name: "LUXDROP",
    prizePool: "$3000",
    prizes: ["$1200", "$750", "$500", "$400", "$300"],
    api: "/api/leaderboard",
  },
};

export default function Home() {
  const [active, setActive] = useState<Leaderboard>("shuffle");
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const config = CONFIG[active];

  useEffect(() => {
    function updateCountdown() {
      
if (active === "shuffle") {
  const now = new Date();

  // Shuffle resets at midnight UTC on the 19th.
  let end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      19,
      0,
      0,
      0
    )
  );

  // If this month's 19th has passed,
  // count down to next month's 19th.
  if (now >= end) {
    end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        19,
        0,
        0,
        0
      )
    );
  }

  const difference = end.getTime() - now.getTime();

  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference / 3600000) % 24);
  const minutes = Math.floor((difference / 60000) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  setTimeLeft(`${days}D ${hours}H ${minutes}M ${seconds}S`);
  return;
}


      const now = new Date();
      let nextEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        11,
        0,
        0,
        0
      );

      if (now >= nextEnd) {
        nextEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          11,
          0,
          0,
          0
        );
      }

      const difference = nextEnd.getTime() - now.getTime();

      const days = Math.floor(difference / 86400000);
      const hours = Math.floor((difference / 3600000) % 24);
      const minutes = Math.floor((difference / 60000) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${days}D ${hours}H ${minutes}M ${seconds}S`);
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      try {
        const response = await fetch(config.api, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Leaderboard request failed");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid leaderboard data");
        }

        const formatted: Player[] = data
          .filter(
            (player: any) =>
              typeof player.username === "string" &&
              Number.isFinite(Number(player.wagered))
          )
          .sort(
            (a: any, b: any) =>
              Number(b.wagered) - Number(a.wagered)
          )
          .map((player: any, index: number) => ({
            rank: index + 1,
            name: player.username,
            wagered: Number(player.wagered),
            deposited: player.deposited,
            avatar: player.avatar,
          }));

        if (!cancelled) {
          setPlayers(formatted);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);

        if (!cancelled) {
          setError("Unable to load leaderboard.");
          setLoading(false);
        }
      }
    }

    setPlayers([]);
    setError("");
    setLoading(true);
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, 180000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [config.api]);

  const podium = [players[1], players[0], players[2]].filter(Boolean);
  const rest = players.slice(3);

  function prizeFor(rank: number) {
    return config.prizes[rank - 1] ?? "TBD";
  }

  return (
    <main className="min-h-screen bg-[#03030a] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(147,51,234,0.35),_transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(88,28,135,0.22),_transparent_40%)]" />

      <section className="relative max-w-7xl mx-auto px-6 py-8">
        <nav className="flex items-center justify-between mb-10">
          <div className="text-3xl font-black tracking-tight">
            Zuleta<span className="text-sky-500">LB</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black/50 px-5 py-3 text-sm font-bold">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            LIVE WAGER RACE
          </div>
        </nav>

        <div className="flex justify-center gap-4 mb-14">
          {(["shuffle", "luxdrop"] as Leaderboard[]).map((site) => (
            <button
              key={site}
              onClick={() => setActive(site)}
              className={`rounded-xl px-8 py-4 font-black tracking-widest border transition ${
                active === site
                  ? "bg-sky-500 text-black border-sky-400"
                  : "bg-black/50 text-zinc-400 border-zinc-700 hover:text-white"
              }`}
            >
              {site.toUpperCase()}
            </button>
          ))}
        </div>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/50 bg-sky-500/10 px-5 py-2 text-sky-300 font-bold tracking-widest mb-6">
            <Zap size={16} />
            MONTHLY COMPETITION
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
            {config.name}
            <br />
            <span className="text-sky-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.65)]">
              WAGER RACE
            </span>
          </h1>

          <p className="text-zinc-400 text-lg mt-6">
            Compete, wager, and climb to the top.
            <br />
            Big rewards for the biggest grinders.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          <StatCard icon={<Trophy size={38} />} label="Prize Pool" value={config.prizePool} />
          <StatCard icon={<Timer size={38} />} label="Ends In" value={timeLeft} />
          <StatCard
            icon={<Crown size={38} />}
            label="Top Prize"
            value={config.prizes[0] ?? "TBD"}
          />
        </div>

        {loading && (
          <p className="text-center text-zinc-400 mb-8">
            Loading leaderboard...
          </p>
        )}

        {error && (
          <p className="text-center text-red-400 mb-8">{error}</p>
        )}

        {!loading && !error && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-10 items-end">
              {podium.map((player) => (
                <motion.div
                  key={`${active}-${player.rank}`}
                  whileHover={{ scale: 1.03 }}
                  className={`rounded-3xl border bg-black/60 backdrop-blur p-8 text-center ${
                    player.rank === 1
                      ? "md:-translate-y-6 border-yellow-400 shadow-[0_0_45px_rgba(56,189,248,0.25)]"
                      : player.rank === 2
                      ? "border-zinc-400/60"
                      : "border-orange-500/60"
                  }`}
                >
                  <div className="text-7xl mb-4">
                    {player.rank === 1 ? "👑" : player.rank === 2 ? "🥈" : "🥉"}
                  </div>

                  <div
                    className={`text-7xl font-black ${
                      player.rank === 1
                        ? "text-yellow-300"
                        : player.rank === 2
                        ? "text-zinc-300"
                        : "text-orange-400"
                    }`}
                  >
                    {player.rank}
                  </div>

                  <h2 className="text-3xl font-black mt-4">
                    {player.name}
                  </h2>

                  <p className="text-green-400 text-2xl font-black mt-3">
                    ${player.wagered.toLocaleString()}
                  </p>

                  <div className="mt-5 rounded-xl border border-sky-500/40 py-3 font-bold tracking-widest">
                    PRIZE: {prizeFor(player.rank)}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-3xl border border-sky-500/40 bg-black/60 overflow-x-auto mb-8 shadow-[0_0_40px_rgba(147,51,234,0.12)]">
              <div className="p-7 border-b border-zinc-800">
                <h2 className="text-3xl font-black tracking-wide">
                  FULL LEADERBOARD
                </h2>
                {active === "shuffle" && (
                  <p className="text-zinc-500 mt-1">
                    Rankings based on weighted wagering.
                    Competition dates pending confirmation.
                  </p>
                )}
              </div>

              <table className="w-full">
                <thead className="bg-slate-900/30 text-zinc-300 text-sm tracking-widest">
                  <tr className="text-left">
                    <th className="p-5">RANK</th>
                    <th className="p-5">PLAYER</th>
                    <th className="p-5">
                      {active === "shuffle" ? "WAGERED" : "WAGERED"}
                    </th>
                    <th className="p-5">PRIZE</th>
                  </tr>
                </thead>

                <tbody>
                  {rest.map((player) => (
                    <tr
                      key={`${active}-${player.rank}`}
                      className="border-t border-zinc-900 hover:bg-sky-500/10 transition"
                    >
                      <td className="p-5 font-bold">#{player.rank}</td>
                      <td className="p-5 font-semibold">{player.name}</td>
                      <td className="p-5 text-green-400 font-black">
                        ${player.wagered.toLocaleString()}
                      </td>
                      <td className="p-5">
                        {prizeFor(player.rank) !== "TBD" && (
                          <span className="rounded-full border border-sky-500/40 px-3 py-1 text-sm font-bold text-sky-300">
                            {prizeFor(player.rank)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <footer className="rounded-3xl border border-sky-500/30 bg-black/60 p-6 text-center text-zinc-300">
          18+ only. Please gamble responsibly.
        </footer>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-sky-500/30 bg-black/60 p-7 backdrop-blur shadow-[0_0_30px_rgba(147,51,234,0.12)]">
      <div className="text-sky-400 mb-4">{icon}</div>
      <p className="text-zinc-400 uppercase tracking-widest font-bold">
        {label}
      </p>
      <h2 className="text-4xl font-black mt-2">{value}</h2>
    </div>
  );
}
