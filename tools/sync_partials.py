#!/usr/bin/env python3
"""Fill the shared partials into the site's pages.

Every page in site/ stays plain static HTML (that is what Vercel serves), but
the blocks that repeat on every page live once in partials/ and are copied in
between markers:

    <!-- include:chrome -->
      ...filled in by this script...
    <!-- /include:chrome -->

Edit partials/<name>.html, then run from the repo root:

    python3 tools/sync_partials.py              # every site/*.html page
    python3 tools/sync_partials.py site/why-us.html

Partials may include other partials. Links in included markup that point at
the page being synced get aria-current="page", which the nav styles pick up.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
PARTIALS = ROOT / 'partials'
BLOCK = re.compile(r'([ \t]*)<!-- include:([\w-]+) -->.*?<!-- /include:\2 -->', re.S)


def render(name, page, depth):
    if depth > 6:
        raise RecursionError(f'partials nest too deep at "{name}"')
    text = (PARTIALS / f'{name}.html').read_text().rstrip('\n')
    text = fill(text, page, depth + 1)
    if depth == 0:
        # only once, on the outermost partial, so nested links aren't marked twice;
        # [data-consult] links are actions (open the form), not navigation
        text = re.sub(r'<a ((?:(?!data-consult)[^>])*?)href="%s"(?![^>]*data-consult)' % re.escape(page),
                      r'<a \1href="%s" aria-current="page"' % page, text)
    return text


def fill(html, page, depth=0):
    def repl(m):
        indent, name = m.group(1), m.group(2)
        body = render(name, page, depth)
        body = '\n'.join(indent + line if line.strip() else '' for line in body.split('\n'))
        return f'{indent}<!-- include:{name} -->\n{body}\n{indent}<!-- /include:{name} -->'
    return BLOCK.sub(repl, html)


def main(args):
    pages = [pathlib.Path(a).resolve() for a in args] or sorted(SITE.glob('*.html'))
    for path in pages:
        html = path.read_text()
        out = fill(html, path.name)
        if out != html:
            path.write_text(out)
            print(f'synced  {path.relative_to(ROOT)}')
        else:
            print(f'ok      {path.relative_to(ROOT)}')


if __name__ == '__main__':
    main(sys.argv[1:])
