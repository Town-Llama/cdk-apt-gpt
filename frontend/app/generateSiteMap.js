const fs = require('fs');
const path = require('path');

const domain = 'https://townllama.ai';

// Static pages
const staticPages = [
    '/'
];

// Function to get dynamic apartment pages
async function getApartmentPages() {
    const headers = {
        "Content-Type": "application/json",
    };
    const url = "/blog/all"; // Construct the full URL
    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(),
        });
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const res = await response.json();
        const blogEntries = res.data;
        console.log(blogEntries, "ok");
        return blogEntries.map(entry => ({
            slug: entry.id, // Adjust this if your blog entries have a different identifier
            lastmod: new Date().toISOString(), // Use lastModified if available, or current date
        }));
    } catch (error) {
        console.error('Error fetching blog entries:', error);
        return []; // Return an empty array if there's an error
    }
}

async function generateSitemap() {
    const apartments = await getApartmentPages();

    const pages = [
        ...staticPages.map(page => ({ url: page, lastmod: new Date().toISOString() })),
        ...apartments.map(apt => ({ url: `/blog/${apt.slug}`, lastmod: apt.lastmod })),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages
            .map(page => `
      <url>
        <loc>${domain}${page.url}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
    `)
            .join('')}
  </urlset>
  `;

    const buildDir = path.join(__dirname, 'build');

    // Ensure the build/public directory exists
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }

    fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully in build/public directory! ' + buildDir);
}

generateSitemap().catch(console.error);
