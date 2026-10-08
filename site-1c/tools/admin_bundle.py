"""Edit the admin app inside public/admin/index.html (a self-contained bundle).

  python3 tools/admin_bundle.py unpack public/admin/index.html admin-app.html   # writes the app's source
  # ...edit admin-app.html (markup at the top, component logic in the <script type="text/x-dc"> block)...
  python3 tools/admin_bundle.py pack   public/admin/index.html admin-app.html   # puts it back
"""
import base64, gzip, json, re, sys

APP = 'f1c4d4db-d701-4286-8137-f01d5676a301'  # "Admin App v2" in the bundle manifest


def manifest(s):
    m = re.search(r'(<script type="__bundler/manifest">)(.*?)(</script>)', s, re.S)
    return m, json.loads(m.group(2))


def main(cmd, bundle, src):
    s = open(bundle, encoding='utf-8').read()
    m, man = manifest(s)
    if cmd == 'unpack':
        open(src, 'w', encoding='utf-8').write(gzip.decompress(base64.b64decode(man[APP]['data'])).decode())
    elif cmd == 'pack':
        man[APP]['data'] = base64.b64encode(gzip.compress(open(src, encoding='utf-8').read().encode(), 9)).decode()
        man[APP]['compressed'] = True
        open(bundle, 'w', encoding='utf-8').write(s[:m.start(2)] + json.dumps(man, separators=(',', ':')) + s[m.end(2):])
    else:
        raise SystemExit(__doc__)


if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
