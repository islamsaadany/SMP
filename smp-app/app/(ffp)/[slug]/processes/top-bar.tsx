"use client";

/* SMP's shared top bar inside the Processes frame (lib/topbar.ts, §444). Its
   own script (/topbar.js) wires it as the page loads: it draws the theme
   button's icon and listens on the theme, sign-out and menu buttons. So React
   sets the bar once and never again: setting it again would put back the bare
   buttons and drop what the script wired. When a refresh brings a new bar (the
   reading link's count moves after "I have read it" or an approval), only that
   link is swapped; it is a plain link the script never touches. */
import { useEffect, useRef, useState } from "react";

export function TopBar({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [first] = useState(html);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const t = document.createElement("template");
    t.innerHTML = html;
    const now = box.querySelector("a.tbread"), next = t.content.querySelector("a.tbread");
    if (now && next) {
      if (now.outerHTML !== next.outerHTML) now.replaceWith(next);
    } else if (now) now.remove();
    else if (next) box.querySelector(".tborg")?.after(next);
  }, [html]);
  return <div ref={ref} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: first }} />;
}
