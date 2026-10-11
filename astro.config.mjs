import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://llansannan-cc.gov.wales',
  trailingSlash: 'always',
  build: {
    format: 'directory'
  }
});
