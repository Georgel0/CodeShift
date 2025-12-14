const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');

const YOUR_DOMAIN = 'https://code-shift-alpha.vercel.app';

// entry for every unique, publicly visible page in your React app.
const links = [
    { 
        url: '/', 
        changefreq: 'daily', 
        priority: 1.0 
    },
];
// Function to generate the sitemap
async function generateSitemap() {
    // Create a write stream to your public folder
    const sitemapPath = path.resolve(__dirname, 'public', 'sitemap.xml');
    const writeStream = createWriteStream(sitemapPath);
    
    // Create the sitemap stream with your domain
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
