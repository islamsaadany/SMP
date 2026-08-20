css = (open('_shared.css').read() + "\n" + open('group-extra.css').read()
       + "\n" + open('config.css').read() + "\n" + open('arrange.css').read()
       + "\n" + open('present.css').read())
shell = open('shell.html').read()
for tag, f in [("DATA","group-data.js"), ("CONFIGDATA","config-data.js"),
               ("ARRANGE","arrange.js"), ("PAGEINFO","pageinfo.js"), ("TEMPLATES","templates.js"), ("XLSX","xlsx.js"),
               ("RENDER","group-render.js"), ("CONFIGRENDER","config-render.js"), ("PRESENT","present.js"),
               ("SYNC","sync.js")]:
    shell = shell.replace('<script src="%s"></script>' % tag, '<script>\n' + open(f).read() + '\n</script>')
# The icon travels INSIDE the built file, as a data URI, because the file has
# to carry everything it needs — opened from a memory stick it still shows its
# own mark in the tab. It is the Strategy Temple, the platform's own drawing:
# pediment, architrave, three pillars, stylobate, in the house navy and gold.
# The SVG is what modern browsers use; the PNG is there for the ones that will
# not take an SVG favicon. Both are generated from favicon.svg at the repo root
# (see the note beside it) — regenerate both together if the mark changes.
ICON = (
  '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2232%22%20height=%2232%22%20viewBox=%220%200%2032%2032%22%3E%20%3Crect%20width=%2232%22%20height=%2232%22%20rx=%226%22%20fill=%22%2316325C%22/%3E%20%3Cpath%20d=%22M16%205.2%2027.4%2012H4.6z%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%225.2%22%20y=%2213.2%22%20width=%2221.6%22%20height=%222.4%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%227.2%22%20y=%2217%22%20width=%223.2%22%20height=%227.4%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%2214.4%22%20y=%2217%22%20width=%223.2%22%20height=%227.4%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%2221.6%22%20y=%2217%22%20width=%223.2%22%20height=%227.4%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%224.4%22%20y=%2225.6%22%20width=%2223.2%22%20height=%222.8%22%20rx=%220.6%22%20fill=%22%23C9A24D%22/%3E%20%3C/svg%3E">' "\n"
  '<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACh0lEQVR4nOyXy2sTURTGvzuZacb4qpY+sEhc+FhowUQUQSmUgHFZQS3WulBEfHSh/huCbnwUETfaCnVRXYitEAKiKIqNUgXRLAw+aCOVWGOcaWZyvHdC2wRjOknTSRf9LZIzdy5zvjln7j33yMihwdd5hMDaubmTMbYGFYSIvvG/5wx0Lx7puzU1zsRPra/TqzB2nYHtgQMQ6FGa6EQi0heTxIAC1uuUc4HwpTDptmXX+7uO8jDcRBUg4BiPAHWgalCHzAhbs19CaUgSYZ9v0rIHIjXIZEp/iPAtg7FGlMiWZgOnAymsXU3WdWCzjqshD95+lVES3Ddr8HeR3fl1y0wcb9Wwe6NR8P6TDzJuPFYxnnTBLrYEKC4ebr+OAzs0qErxUGtpwt0XKgaG3Uibs6dlVgF+bxqn2v6gqdZ2oCxGEwzXwkswHFNQloCmlSZOtmnYts7AXHj1SUZPWMXoT5c9AapC2L9d5yHXUCOXsTwKMGkQT4nKU+OGbrDiApym4Lo5HxRLzEQl+fzDhYtDHtgSIJyvb8zACQoKeBZVEI1XVsD3CQm2BfS/VOEURffOS4d+TafickjF0Ih7+t4ZvhXvbUlb9uCIgiuhmfwGW3R0BzTLjo5JOHdneXkCnGBRwKKAhS2gnxePFZ5sqXj3JX9q+H0N36yyFU5ss7mIuWLZCiZSxQvaP8XIW2di14Y05oOnHxXExvPFyrxlGcs9Fx7kp57WTXM7A/yP5lUmLjxcOjPAfUvE8Dp30m+9MmeAQiS1/HogfMv8ON3jkhCcGnzwxo1ESsJ8IFKQi/BtvW69//Agb5eCcBKi+/FIb7v1qhmWOcv7JB0OwTvlpGGiW9h5Ca9Ge/4XAAD//5ZnhOIAAAAGSURBVAMAdNLgS2NC1g8AAAAASUVORK5CYII=">')

out = ("<!doctype html>\n<meta charset='utf-8'>\n"
       "<meta name='viewport' content='width=device-width,initial-scale=1'>\n"
       + ICON + "\n"
       # Root-absolute, and harmless when it 404s on file:// — the platform has
       # to stay openable from a memory stick. The worker itself is registered
       # by the gate, not here: its scope is the whole origin and you cannot
       # reach this file without signing in there first.
       '<link rel="manifest" href="/manifest.webmanifest">\n'
       '<meta name="theme-color" content="#16325C" media="(prefers-color-scheme: light)">\n'
       '<meta name="theme-color" content="#14161A" media="(prefers-color-scheme: dark)">\n'
       "<title>Raya Trade \u2014 Strategy Management Platform</title>\n<style>\n"
       + css + "\n</style>\n"
       # The theme is chosen in the HEAD, before the body is parsed, so a
       # person who picked dark never sees the page paint light and flip.
       # It has to be inline for the same reason the icon is a data URI:
       # the file has to carry everything it needs.
       "<script>\n" + open('theme.js').read() + "\n</script>\n\n" + shell)
open('strategy-management-platform.html','w').write(out)
print("built", len(out))
