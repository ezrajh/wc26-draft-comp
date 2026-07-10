// Proxies the football-data.org World Cup feed so the API key stays
// server-side. Responses are cached on Netlify's CDN for 5 minutes,
// which keeps us far inside the free tier's 10 requests/minute limit
// no matter how many people open the site.

export default async () => {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return json({ error: "FOOTBALL_DATA_TOKEN environment variable is not set in Netlify." }, 500);
  }

  const headers = { "X-Auth-Token": token };
  let matchRes, standRes;
  try {
    [matchRes, standRes] = await Promise.all([
      fetch("https://api.football-data.org/v4/competitions/WC/matches", { headers }),
      fetch("https://api.football-data.org/v4/competitions/WC/standings", { headers }),
    ]);
  } catch {
    return json({ error: "Could not reach football-data.org." }, 502);
  }

  if (!matchRes.ok) {
    return json({ error: "football-data.org responded with " + matchRes.status }, 502);
  }

  const matchData = await matchRes.json();

  // Trim matches to just what the ladder and bracket need.
  const matches = (matchData.matches || []).map((m) => ({
    stage: m.stage,
    status: m.status,
    home: m.homeTeam && m.homeTeam.name,
    away: m.awayTeam && m.awayTeam.name,
    winner: m.score && m.score.winner,
    duration: m.score && m.score.duration,
    ft: m.score && m.score.fullTime,
    regular: m.score && m.score.regularTime,
    extra: m.score && m.score.extraTime,
    utcDate: m.utcDate,
  }));

  // Group standings — one table per group. Tolerate a missing/failed call.
  let standings = [];
  if (standRes && standRes.ok) {
    const standData = await standRes.json();
    standings = (standData.standings || [])
      .filter((s) => s.type === "TOTAL" && s.group)
      .map((s) => ({
        group: s.group,
        table: (s.table || []).map((row) => ({
          position: row.position,
          team: row.team && row.team.name,
          played: row.playedGames,
          won: row.won,
          draw: row.draw,
          lost: row.lost,
          gf: row.goalsFor,
          ga: row.goalsAgainst,
          gd: row.goalDifference,
          points: row.points,
        })),
      }));
  }

  return json(
    { fetched: new Date().toISOString(), matches, standings },
    200,
    { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" }
  );
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

export const config = { path: "/api/scores" };
