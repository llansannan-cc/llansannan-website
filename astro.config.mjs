import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://llansannan-cc.gov.wales',
  trailingSlash: 'always',
  build: {
    format: 'directory'
  },
  integrations: [
    // Generates /sitemap-index.xml and /sitemap-0.xml at build time, so new
    // pages are included automatically. Keep non-public pages out of it.
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/404'),
    }),
  ],
});
