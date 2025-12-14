import { SitemapStream, streamToPromise } from 'sitemap';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const YOUR_DOMAIN = 'https://code-shift-alpha.vercel.app';

const links = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
];

async function generateSitemap() {
    // Define the path to the 'dist' folder
    const distDir = resolve(__dirname, 'dist');
    const sitemapPath = resolve(distDir, 'sitemap.xml');

    // Safety check: Ensure the 'dist' folder exists
    if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
    }

    // Create the sitemap stream
    const smStream = new SitemapStream({ hostname: YOUR_DOMAIN });

    // Add links to the stream
    for (const link of links) {
        smStream.write(link);
    }
    smStream.end();

    // Convert stream to buffer
    const sitemapOutput = await streamToPromise(smStream);

    // Write the file synchronously
    writeFileSync(sitemapPath, sitemapOutput);

    console.log('Sitemap successfully generated at:', sitemapPath);
}

generateSitemap().catch(console.error);