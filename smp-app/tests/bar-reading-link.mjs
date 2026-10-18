/* The staff reading link on the two bars. Run: node --experimental-strip-types tests/bar-reading-link.mjs
   No database. The shared bar (lib/topbar.ts) and the frozen shell's stamp (lib/shell.ts) both
   read what the router set (lib/bar-extras.ts); a consultant never gets it and nobody gets a
   link to an empty list. */
import { topBarHtml } from "../lib/topbar.ts";
import { shellDocument } from "../lib/shell.ts";
import { withBarExtras } from "../lib/bar-extras.ts";

let pass = 0, fail = 0;
const check = (n, c) => (c ? pass++ : (fail++, console.log("  FAIL  " + n)));
const bar = (extras, over = {}) => withBarExtras({ processesRead: extras }, () => topBarHtml({ slug: "rhi", tenantName: "Raya", module: "notes", have: ["strategy", "notes"], consultant: false, ...over }));
const doc = (extras) => withBarExtras({ processesRead: extras }, () => shellDocument("Raya", "strategy"));

// Refusals
check("no extras: no link on the shared bar", !/tbread/.test(bar(null)));
check("nothing published: no link", !/tbread/.test(bar({ published: 0, waiting: 0 })));
check("a consultant's bar has no reading link, whatever was set", !/tbread/.test(bar({ published: 3, waiting: 2 }, { consultant: true })));
check("the shell is not stamped when there is nothing to say", !/data-processes-read/.test(doc(null)) && !/data-processes-read/.test(doc({ published: 0, waiting: 0 })));
check("outside a request the shell is not stamped", !/data-processes-read/.test(shellDocument("Raya", "strategy")));

// Legitimate
check("waiting: link with the count", /<a class="tbread" href="\/rhi\/processes\/read">Processes<span class="tbn">2 to read<\/span><\/a>/.test(bar({ published: 3, waiting: 2 })));
check("all read: the link stays without a count", /<a class="tbread" href="\/rhi\/processes\/read">Processes<\/a>/.test(bar({ published: 3, waiting: 0 })));
check("the link sits before Sign out", bar({ published: 1, waiting: 1 }).indexOf("tbread") < bar({ published: 1, waiting: 1 }).indexOf("tbacts"));
check("it is a link, not a menu: no module menu is added", !/tbmenu|tbmod/.test(bar({ published: 1, waiting: 1 })));
check("an explicit value wins over the request's", /tbn">1 to read/.test(topBarHtml({ slug: "rhi", tenantName: "Raya", module: "processes", have: [], consultant: false, processesRead: { published: 3, waiting: 1 } })));
check("on the reading pages the link is marked current", /aria-current="page"/.test(topBarHtml({ slug: "rhi", tenantName: "Raya", module: "processes", have: [], consultant: false, processesRead: { published: 3, waiting: 1 } })));
const stamped = doc({ published: 3, waiting: 2 });
const m = stamped.match(/data-processes-read='([^']*)'/);
check("the shell is stamped with the words", !!m && JSON.parse(m[1].replace(/&quot;/g, '"')).count === "2 to read");

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
