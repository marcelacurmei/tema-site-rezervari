// Apelează o funcție din api/ la fel ca Vercel (req, res), fără Vercel. Folosit de teste și de proba locală.

export function raspunsGol() {
  const res = {
    statusCode: 200, antete: {}, corp: undefined, terminat: false,
    status(c) { this.statusCode = c; return this; },
    setHeader(k, v) { this.antete[k.toLowerCase()] = v; return this; },
    json(d) { this.setHeader('Content-Type', 'application/json; charset=utf-8'); this.corp = JSON.stringify(d); this.terminat = true; return this; },
    send(d) { this.corp = typeof d === 'string' ? d : JSON.stringify(d); this.terminat = true; return this; },
    end(d) { if (d) this.corp = d; this.terminat = true; return this; },
  };
  return res;
}

export async function apeleaza(handler, { method = 'GET', body, headers = {}, query = {} } = {}) {
  const req = { method, body, query, headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])) };
  const res = raspunsGol();
  await handler(req, res);
  let date = null;
  try { date = res.corp ? JSON.parse(res.corp) : null; } catch { date = res.corp; }
  return { status: res.statusCode, date, antete: res.antete };
}
