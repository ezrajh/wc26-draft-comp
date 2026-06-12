// Proxies the football-data.org World Cup feed so the API key stays
// server-side. Responses are cached on Netlify's CDN for 5 minutes,
// which keeps us far inside the free tier's 10 requests/minute limit
// no matter how many people open the site.

export default async () => {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return json({ error: "FOOTBALL_DATA_TOKEN environment variable is not set in Netlify." }, 500);
  }

  let upstream;
  try {
    upstream = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": token },
    });
  } catch {
    return json({ error: "Could not reach football-data.org." }, 502);
  }

  if (!upstream.ok) {
    return json({ error: "football-data.org responded with " + upstream.status }, 502);
  }

  const data = await upstream.json();

  // Trim the payload to just what the ladder needs.
  const matches = (data.matches || []).map((m) => ({
    stage: m.stage,
    status: m.status,
    home: m.homeTeam && m.homeTeam.name,
    away: m.awayTeam && m.awayTeam.name,
    winner: m.score && m.score.winner,
    ft: m.score && m.score.fullTime,
    utcDate: m.utcDate,
  }));

  return json(
    { fetched: new Date().toISOString(), matches },
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
