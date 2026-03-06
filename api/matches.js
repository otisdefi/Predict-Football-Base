// Vercel Serverless Function — API anahtarını gizler
const LEAGUE_IDS = [39, 140, 135, 78, 61, 203, 2];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.FOOTBALL_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const url = `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=Europe/Istanbul`;

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });

    if (!response.ok) throw new Error('API error: ' + response.status);
    const data = await response.json();

    const fixtures = (data.response || []).filter(f => LEAGUE_IDS.includes(f.league.id));

    const matches = fixtures.map(f => {
      const status = f.fixture.status.short;
      return {
        id: String(f.fixture.id),
        leagueId: f.league.id,
        leagueName: f.league.name,
        home: f.teams.home.name,
        away: f.teams.away.name,
        homeGoals: f.goals.home,
        awayGoals: f.goals.away,
        status,
        isLive: ['1H','2H','HT','ET','P'].includes(status),
        isUpcoming: status === 'NS',
        elapsed: f.fixture.status.elapsed,
        kickoff: f.fixture.date,
      };
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ matches });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
