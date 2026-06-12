# WC26 Draft Comp — auto-updating

Live World Cup 2026 draft competition ladder. Scores, goals and
eliminations update automatically from football-data.org.

## One-time setup (~5 minutes)

1. **Get a free API key** — sign up at https://www.football-data.org/client/register
   (free tier, includes the World Cup). The key arrives by email.

2. **Push this folder to a GitHub repo** and connect it to Netlify
   (Add new site → Import an existing project). No build command needed,
   publish directory is the repo root.

3. **Add the key to Netlify** — Site configuration → Environment variables →
   Add a variable:
   - Key: `FOOTBALL_DATA_TOKEN`
   - Value: your API key

4. **Redeploy** (Deploys → Trigger deploy) so the function picks up the key.

That's it. Every page load pulls fresh results (cached 5 minutes on
Netlify's CDN so the free rate limit is never an issue).

## What's automatic vs manual

Automatic: goals per team, knockout progress, eliminations, finishing
positions, champion — all derived from the match feed.

Manual (edit the DATA block at the top of `index.html` and push):
- `AWARDS` — Golden Ball / Boot / Glove, Most Assists, Team of the
  Tournament, entered once at the end of the tournament.
- `MANUAL_OVERRIDES` — emergency switch if the feed ever disagrees with
  reality. Anything in there beats the feed.
- `STATUS_NOTE` — the banter line under the ladder heading.

If the feed is down, the site falls back to manual data and says so.

## Notes on scoring edge cases

- Goals use the 120-minute score; penalty shootout goals don't count.
- A team banks its stage points the moment it qualifies for that stage
  (making the R16 = 4 points immediately, etc.).
- Group-stage eliminations only register once the full round-of-32
  bracket is named, to avoid prematurely killing off teams.
