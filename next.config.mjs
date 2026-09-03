/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  /* The Insights page used to live at /blogs and its route folder is
     app/insights/ now. The old path is not in the site's own markup
     anywhere - the nav has always labelled it Insights and only the href
     was behind - but it is the URL anything outside this repo would have
     of it, so it redirects rather than 404s. Permanent, because it is. */
  async redirects() {
    return [{ source: "/blogs", destination: "/insights", permanent: true }];
  },

  /* How long the pictures and the films are allowed to stay put.

     Next hashes and fingerprints everything it builds - the JS chunks,
     the fonts out of next/font - and serves those immutable for a year
     on its own. Nothing under public/ gets that treatment, because Next
     cannot know whether /assets/art/culture.webp is the same file it was
     yesterday. The default most hosts then apply is "revalidate every
     time", which for a page carrying seventy pictures is seventy
     conditional requests and seventy 304s before a repeat visitor sees
     anything - a round trip each, and on a phone on 4G that is most of
     the wait.

     A week fresh, a month stale-while-revalidate. Inside the week
     nothing is asked for at all; for the three weeks after that the
     cached copy is drawn immediately and refreshed in the background, so
     a reader never waits for a picture they have already seen. A
     replaced asset therefore takes up to a week to reach somebody who
     was here before it changed.

     That is the trade, and it is the right way round for a marketing
     site whose art direction changes a few times a year - but it is a
     real cost on the day of a change. If something has to land the same
     day, either drop this to a few hours or give the file a new name;
     the build scripts all name their output off the master, so a
     renamed master is a new URL and nothing has to expire.

     Deliberately not `immutable`: these paths are stable across
     re-encodes (scripts/build-art.mjs writes culture.webp every time),
     so promising a browser the bytes will never change would be a lie
     it holds onto for the full year. */
  async headers() {
    return [
      {
        source: "/:path(assets|media)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
