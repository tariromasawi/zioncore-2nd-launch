import path from 'path';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import {
  assertNoStartupGenesis,
  assertStartupBudget,
  collectStartupChunks,
} from './src/lib/startup-bundle';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const seoLandingSlugs = new Set([
  'audio-spectrum-analyzer',
  'online-tone-generator',
  'sound-message-encoder',
  'spiritual-frequency-exploration',
  'plant-bioacoustics',
  'frequency-signal-guide',
]);

function seoLandingPageRoutes(): Plugin {
  const basePrefix = basePath.replace(/\/+$/, '');
  return {
    name: 'zioncore-seo-landing-page-routes',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (!request.url) return next();
        const queryIndex = request.url.indexOf('?');
        const pathname = queryIndex < 0 ? request.url : request.url.slice(0, queryIndex);
        const query = queryIndex < 0 ? '' : request.url.slice(queryIndex);
        const routePath = basePrefix && pathname.startsWith(`${basePrefix}/`)
          ? pathname.slice(basePrefix.length)
          : pathname;
        const slug = routePath.replace(/^\/+|\/+$/g, '');
        if (seoLandingSlugs.has(slug)) {
          request.url = `/${slug}/index.html${query}`;
        }
        next();
      });
    },
  };
}

function standalonePublicOriginPlugin(): Plugin {
  return {
    name: 'zioncore-2nd-public-origin',
    apply: 'build',
    async closeBundle() {
      const rawOrigin = process.env.VITE_PUBLIC_SITE_URL?.trim();
      let publicOrigin: string | null = null;
      if (rawOrigin) {
        let parsedOrigin: URL;
        try {
          parsedOrigin = new URL(rawOrigin);
        } catch {
          throw new Error('VITE_PUBLIC_SITE_URL must be a valid HTTPS origin.');
        }
        if (
          parsedOrigin.protocol !== 'https:'
          || parsedOrigin.pathname !== '/'
          || parsedOrigin.search
          || parsedOrigin.hash
          || parsedOrigin.hostname.toLowerCase() === 'zioncore.replit.app'
        ) {
          throw new Error(
            'VITE_PUBLIC_SITE_URL must be an independent HTTPS origin, not the main ZionCore site.',
          );
        }
        publicOrigin = parsedOrigin.origin;
      }

      const outputDir = path.resolve(import.meta.dirname, 'dist/public');
      const visit = async (directory: string): Promise<void> => {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          const fullPath = path.join(directory, entry.name);
          if (entry.isDirectory()) {
            await visit(fullPath);
            continue;
          }
          if (!/\.(?:html|xml|txt)$/i.test(entry.name)) continue;

          let content = await readFile(fullPath, 'utf8');
          if (publicOrigin) {
            content = content.replaceAll('https://zioncore.replit.app', publicOrigin);
          } else {
            content = content
              .replace(
                /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*zioncore\.replit\.app)[^>]*>\s*/gi,
                '',
              )
              .replace(
                /<meta\b(?=[^>]*(?:property=["']og:(?:url|image)["']|name=["']twitter:image["']))(?=[^>]*zioncore\.replit\.app)[^>]*>\s*/gi,
                '',
              )
              .replace(
                /<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>\s*/gi,
                match => match.includes('zioncore.replit.app') ? '' : match,
              )
              .replace(/^\s*Sitemap:\s*https:\/\/zioncore\.replit\.app\/sitemap\.xml\s*$/gim, '')
              .replace(/<url>[\s\S]*?<\/url>/gi, match =>
                match.includes('zioncore.replit.app') ? '' : match,
              );
          }

          if (content.includes('zioncore.replit.app')) {
            throw new Error(`Standalone build contains a main-site URL: ${fullPath}`);
          }
          await writeFile(fullPath, content);
        }
      };

      await visit(outputDir);
      this.info(
        publicOrigin
          ? `SEO origin configured for standalone host ${publicOrigin}.`
          : 'No standalone public URL is configured; main-site canonical and sitemap URLs were omitted.',
      );
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    {
      name: 'zioncore-startup-budget',
      apply: 'build',
      generateBundle(_options, bundle) {
        const chunks = collectStartupChunks(bundle);
        assertNoStartupGenesis(chunks);
        const bytes = chunks.reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0);
        const gzipBytes = chunks.reduce((total, chunk) => total + gzipSync(chunk.code).length, 0);
        assertStartupBudget(gzipBytes);
        this.info(`Initial JavaScript: ${bytes} bytes; ${gzipBytes} gzip bytes across ${chunks.length} static chunk(s).`);
      },
    },
    seoLandingPageRoutes(),
    standalonePublicOriginPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
