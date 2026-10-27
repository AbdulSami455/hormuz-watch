import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'

const agent = 'hormuz-watch/1.0 (personal maritime map)'

const FEED_URLS: Record<string, string[]> = {
  gcaptain: ['https://gcaptain.com/feed/'],
  'mar-ex': [
    'https://news.google.com/rss/search?q=site:maritime-executive.com+Hormuz&hl=en-US&gl=US&ceid=US:en',
    'https://www.maritime-executive.com/rss.xml',
  ],
  splash: ['https://splash247.com/feed/'],
  marinelink: ['https://www.marinelink.com/news/rss'],
  hellenic: ['https://www.hellenicshippingnews.com/feed/'],
  insight: ['https://www.marineinsight.com/feed/'],
  naval: ['https://www.navalnews.com/feed/'],
  bbc: ['https://feeds.bbci.co.uk/news/world/middle_east/rss.xml'],
  aj: [
    'https://news.google.com/rss/search?q=site:aljazeera.com+%22Strait+of+Hormuz%22+OR+Hormuz+tanker&hl=en-US&gl=US&ceid=US:en',
    'https://www.aljazeera.com/xml/rss/all.xml',
  ],
  guardian: ['https://www.theguardian.com/world/middleeast/rss'],
  'hormuz-wire': [
    'https://news.google.com/rss/search?q=%22Strait+of+Hormuz%22+(tanker+OR+vessel)+(hit+OR+struck+OR+attack+OR+missile+OR+mine)&hl=en-US&gl=US&ceid=US:en',
  ],
}

async function pullFeed(urls: string[]) {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
        headers: {
          'User-Agent': agent,
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        },
      })
      const body = await res.text()
      if (res.ok && /<(rss|feed)\b/i.test(body)) return body
    } catch {
      /* try next url */
    }
  }
  return null
}

function rssPlugin(): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0] === '/api/bundle') {
      const feeds = await Promise.all(
        Object.entries(FEED_URLS).map(async ([id, urls]) => ({
          id,
          xml: await pullFeed(urls),
        })),
      )
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(feeds))
      return
    }

    const match = req.url?.match(/^\/feeds\/([^/?#]+)/)
    if (!match) return next()
    const urls = FEED_URLS[match[1]]
    if (!urls) {
      res.statusCode = 404
      res.end('unknown feed')
      return
    }
    const xml = await pullFeed(urls)
    if (!xml) {
      res.statusCode = 502
      res.end('feed unavailable')
      return
    }
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(xml)
  }

  return {
    name: 'hormuz-rss',
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}

export default defineConfig({
  plugins: [react(), rssPlugin()],
  server: {
    proxy: {
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
        headers: { 'User-Agent': agent },
      },
    },
  },
})
