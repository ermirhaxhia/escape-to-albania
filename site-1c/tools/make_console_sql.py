"""Builds db/console/*.sql: the migration and the seed with no comments, cut into small pieces.

The Cloudflare dashboard console flattens everything onto one line, so '--' comments would swallow the
rest of the script. Paste the files in order, one at a time.   python tools/make_console_sql.py
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
n = 0
for f in files:
    stmts = statements(strip_comments(open(f, encoding='utf-8').read()))
    chunk = ''
    for s in stmts + [None]:
        if s is None or (chunk and len(chunk) + len(s) > LIMIT):
            if chunk:
                n += 1
                open(os.path.join(OUT, '%02d_%s.sql' % (n, os.path.splitext(os.path.basename(f))[0])), 'w', encoding='utf-8', newline='\n').write(chunk.strip() + '\n')
            chunk = ''
        if s:
            chunk += s + ' '
print(n, 'files in db/console')
