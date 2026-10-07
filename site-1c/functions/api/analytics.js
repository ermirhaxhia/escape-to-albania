// Cloudflare Pages Function: /api/analytics?days=30
// Where visitors come from, read from Cloudflare Web Analytics for the admin's Analytics screen.
// Needs these environment variables (Settings → Variables and Secrets):
//   CF_ACCOUNT_ID   – Cloudflare account id
//   CF_WA_SITE_TAG  – Web Analytics site tag of escapetoalbania.com
//   CF_API_TOKEN    – API token with "Account Analytics: Read" (encrypted)
// Without them the admin shows sample data. Keep /api/analytics behind Cloudflare Access like /admin.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, max-age=300' } });

const QUERY = `query Traffic($account: string!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    accounts(filter: { accountTag: $account }) {
      referrers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 25, orderBy: [sum_visits_DESC]) {
        sum { visits }
        dimensions { refererHost }
      }
      countries: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 10, orderBy: [sum_visits_DESC]) {
        sum { visits }
        dimensions { countryName }
      }
    }
  }
}`;

export async function onRequestGet({ request, env }) {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID || !env.CF_WA_SITE_TAG) return json({ ok: false, error: 'Web Analytics is not configured' }, 503);

  const days = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('days'), 10) || 30, 1), 90);
  const end = new Date();
  const start = new Date(end.getTime() - days * 864e5);
  const filter = { AND: [{ datetime_geq: start.toISOString() }, { datetime_leq: end.toISOString() }, { siteTag: env.CF_WA_SITE_TAG }] };

  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.CF_API_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { account: env.CF_ACCOUNT_ID, filter } })
  });
  const body = await res.json().catch(() => null);
  const acc = body && body.data && body.data.viewer && body.data.viewer.accounts && body.data.viewer.accounts[0];
  if (!res.ok || !acc) return json({ ok: false, error: (body && body.errors && body.errors[0] && body.errors[0].message) || 'Cloudflare API error' }, 502);

  const own = new URL(request.url).hostname.replace(/^www\./, '');
  return json({
    ok: true,
    days,
    referrers: acc.referrers
      .map((r) => ({ host: (r.dimensions.refererHost || '').replace(/^www\./, ''), visits: r.sum.visits }))
      .filter((r) => r.visits > 0 && r.host !== own),
    countries: acc.countries.map((c) => ({ name: c.dimensions.countryName, visits: c.sum.visits })).filter((c) => c.visits > 0)
  });
}
