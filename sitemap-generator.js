import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

//Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const YOUR_DOMAIN = 'https://code-shift-alpha.vercel.app';

const links = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
];

async function generateSitemap() {
    const sitemapPath = resolve(__dirname, 'public', 'sitemap.xml');
    
    const writeStream = createWriteStream(sitemapPath);
    const smStream = new SitemapStream({ hostname: YOUR_DOMAIN });

    smStream.pipe(writeStream);

    for (const link of links) {
        smStream.write(link);
    }

    smStream.end();

    await streamToPromise(writeStream);
    console.log('Sitemap successfully generated at:', sitemapPath);
}

generateSitemap().catch(console.error);