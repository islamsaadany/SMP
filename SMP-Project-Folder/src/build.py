css = (open('_shared.css').read() + "\n" + open('group-extra.css').read()
       + "\n" + open('config.css').read() + "\n" + open('arrange.css').read()
       + "\n" + open('present.css').read())
shell = open('shell.html').read()
for tag, f in [("DATA","group-data.js"), ("CONFIGDATA","config-data.js"),
               ("ARRANGE","arrange.js"), ("PAGEINFO","pageinfo.js"), ("TEMPLATES","templates.js"), ("XLSX","xlsx.js"),
               ("RENDER","group-render.js"), ("CONFIGRENDER","config-render.js"), ("PRESENT","present.js"),
               ("SYNC","sync.js")]:
    shell = shell.replace('<script src="%s"></script>' % tag, '<script>\n' + open(f).read() + '\n</script>')
out = ("<!doctype html>\n<meta charset='utf-8'>\n"
       "<meta name='viewport' content='width=device-width,initial-scale=1'>\n"
       "<title>Raya Trade \u2014 Strategy Management Platform</title>\n<style>\n"
       + css + "\n</style>\n\n" + shell)
open('strategy-management-platform.html','w').write(out)
print("built", len(out))
