"""Builds db/console/*.sql: the migration and the seed with no comments, cut into small pieces.

The Cloudflare dashboard console flattens everything onto one line, so '--' comments would swallow the
rest of the script. Paste the files of one migration in order, one at a time. Files of a migration you already ran are not needed again.   python tools/make_console_sql.py
"""
import glob, os, re, sqlite3

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'db/console')
LIMIT = 4500  # characters per file


def strip_comments(sql):
    out = []
    for line in sql.splitlines():
        res, q = '', False
        i = 0
        while i < len(line):
            ch = line[i]
            if ch == "'":
                q = not q
            if not q and line.startswith('--', i):
                break
            res += ch
            i += 1
        if res.strip():
            out.append(res.rstrip())
    return '\n'.join(out)


def statements(sql):
    buf, res = '', []
    for line in sql.splitlines():
        buf += line + '\n'
        if sqlite3.complete_statement(buf):
            res.append(' '.join(buf.split()))
            buf = ''
    assert not buf.strip(), buf
    return [s for s in res if not s.upper().startswith('PRAGMA')]


files = sorted(glob.glob(os.path.join(ROOT, 'db/migrations/*.sql'))) + [os.path.join(ROOT, 'db/seed.sql')]
os.makedirs(OUT, exist_ok=True)
for old in glob.glob(os.path.join(OUT, '*.sql')):
    os.remove(old)
total = 0
for f in files:
    base = os.path.splitext(os.path.basename(f))[0]          # 0001_init, 0002_site_content, seed
    stmts = statements(strip_comments(open(f, encoding='utf-8').read()))
    chunks, chunk = [], ''
    for s in stmts:
        if chunk and len(chunk) + len(s) > LIMIT:
            chunks.append(chunk); chunk = ''
        chunk += s + ' '
    if chunk:
        chunks.append(chunk)
    for k, c in enumerate(chunks, 1):
        total += 1
        with open(os.path.join(OUT, '%s_%02d.sql' % (base, k)), 'w', encoding='utf-8', newline='\n') as out:
            out.write(c.strip() + '\n')
print(total, 'files in db/console')
