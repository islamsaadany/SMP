import type { Metadata } from "next";

export const metadata: Metadata = {
  /* The organisation's name is data, not a literal — the title is set per page
     from what the database holds. */
  title: "Strategy Management Platform",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.png", sizes: "32x32" }], apple: "/icons/apple-touch-icon.png" },
  /* §26, carried at Phase J: index.html links this and so does the platform
     file, and it is what lets the platform be added to a home screen — which
     on an iPhone is the only place a push notification is ever delivered. */
  manifest: "/manifest.webmanifest",
};

/* THE THEME IS READ BEFORE THE FIRST PAINT (index.html's own head script,
   §25.2, §27): the choice made inside the platform is remembered in
   localStorage under one key, and absence of the attribute is what hands the
   decision back to prefers-color-scheme — so "auto" removes rather than sets.
   Inline and in the head, or the page paints light and flips. */
const THEME = 'try{var t=localStorage.getItem("smp.theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}';

/* No stylesheet here: the door and the platform each carry their own in their
   route group, because the door is Forefront's surface with Forefront's own
   tokens and the platform is the tenant's (§34, §41.10). */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
        <meta name="theme-color" content="#16325C" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#14161A" media="(prefers-color-scheme: dark)" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
