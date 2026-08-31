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
};

export default nextConfig;
