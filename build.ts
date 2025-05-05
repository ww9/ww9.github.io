import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import fs from 'fs';
import path from 'path';

// Site configuration
const SITE_CONFIG = {
	title: 'Bruno Cassol',
	description: 'notes from a software engineer',
	baseUrl: 'https://brunocassol.com', // Updated to match the domain in robots.txt
	contacts: {
		'github.com/ww9': 'https://github.com/ww9',
		'x.com/brunocassol': 'https://x.com/brunocassol',
		'instagram.com/brunocassol': 'https://instagram.com/brunocassol',
		'brunocassol+web@gmail.com': 'brunocassol+web@gmail.com'
	},
	copyright: `© ${new Date().getFullYear()} Bruno Cassol. All rights reserved.`
};

// Setup directories
const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const STATIC_DIR = path.join(ROOT_DIR, 'static');
const POSTS_FILE = path.join(ROOT_DIR, 'posts.md');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
	fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Configure marked with syntax highlighting
marked.use(
	markedHighlight({
		langPrefix: 'hljs language-',
		highlight(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	})
);

// Custom renderer for adding IDs to headings and captions to images
marked.use({
	renderer: {
		heading(text, level) {
			// Only add IDs to h1, h2, h3
			if (level <= 3) {
				const slug = generateSlug(text);
				return `<h${level} id="${slug}">${text}</h${level}>`;
			}
			return `<h${level}>${text}</h${level}>`;
		},
		image(href, title, text) {
			// 'text' is the alt text in marked's renderer
			let imageTag = `<img src="${href}" alt="${text}"`;
			if (title) {
				imageTag += ` title="${title} (click to open image in new tab)"`;
			} else {
				imageTag += ` title="${text} (click to open image in new tab)"`;
			}
			imageTag += '>';

			// Wrap the image in a link that opens in a new tab
			const imageLink = `<a href="${href}" target="_blank" rel="noopener noreferrer">${imageTag}</a>`;

			if (text) {
				// If alt text exists, wrap image link and caption in a figure
				// Append the clickable text to the caption
				return `
          <figure>
            ${imageLink}
            <figcaption>${text} (<a href="${href}" target="_blank" rel="noopener noreferrer">click to open image in new tab</a>)</figcaption>
          </figure>
        `;
			} else {
				// Otherwise, just return the linked image tag
				return imageLink;
			}
		}
	}
});

// Generate slug for anchor links
function generateSlug(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD') // decompose accented characters
		.replace(/[\u0300-\u036f]/g, '') // remove diacritics
		.replace(/[^\w\s-]/g, '') // remove non-word chars
		.replace(/[\s_-]+/g, '_') // replace spaces and dashes with underscore
		.trim();
}

// Parse date string from post
function parseDate(dateString: string): Date {
	const datePattern = /^\d{4}-\d{2}-\d{2}/;
	const match = dateString.match(datePattern);
	if (match) {
		return new Date(match[0]);
	}
	throw new Error(`Invalid date format: ${dateString}`);
}

// Type definition for parsed posts
interface Post {
	title: string;
	slug: string;
	date: Date;
	dateString: string;
	content: string;
	htmlContent: string;
}

// Read and parse posts.md
function parseBlogPosts(): Post[] {
	const content = fs.readFileSync(POSTS_FILE, { encoding: 'utf-8' });

	// Split posts by H1 title (matching start of lines)
	const postSections = content.split(/^# /m).slice(1);

	let posts = postSections.map(postContent => {
		// Split content into lines
		const lines = postContent.trim().split('\n');

		// First line is the title
		const title = lines[0].trim();

		// Third line is the date
		const dateString = lines[2].trim();

		// Rest is the post content
		const restContent = lines.slice(3).join('\n').trim();

		// Generate slug for the title
		const slug = generateSlug(title);

		// Parse markdown content
		const htmlContent = marked.parse(restContent);

		return {
			title,
			slug,
			date: parseDate(dateString),
			dateString,
			content: restContent,
			htmlContent
		};
	});

	return posts;
}

// Generate HTML for the blog
function generateHTML(posts: Post[]): string {
	// Create posts HTML
	const postsHTML = posts.map(post => `
    <article id="${post.slug}" class="post">
      <h1 id="${post.slug}">${post.title}</h1>
      <p class="date">${post.dateString}</p>
      <div class="content">
        ${post.htmlContent}
      </div>
    </article>
  `).join('\n');

	// Create contacts HTML
	const contactsHTML = Object.entries(SITE_CONFIG.contacts).map(([platform, url]) => {
		// Handle email links differently
		const link = url.includes('@') ? `mailto:${url}` : url;
		const target = url.includes('@') ? '' : ' target="_blank" rel="noopener noreferrer"';
		return `<a href="${link}"${target}>${platform}</a>`;
	}).join(' | ');

	// Create HTML template
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>${SITE_CONFIG.title} - ${SITE_CONFIG.description}</title>
  <meta name="description" content="${SITE_CONFIG.description}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${SITE_CONFIG.title} - ${SITE_CONFIG.description}">
  <meta property="og:description" content="${SITE_CONFIG.description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_CONFIG.baseUrl}">
  <meta property="og:image" content="${SITE_CONFIG.baseUrl}/static/bruno-cassol.png">
  
  <link rel="stylesheet" href="/static/style.css">
  
  <link rel="icon" href="/static/favicons/favicon.ico">
  <link rel="icon" type="image/png" sizes="16x16" href="/static/favicons/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/static/favicons/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/static/favicons/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/static/favicons/android-chrome-192x192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/static/favicons/android-chrome-512x512.png">
</head>
<body>
  <header>
    <div class="header-content">
      <div class="branding">
        <h1>${SITE_CONFIG.title}</h1>
        <p>${SITE_CONFIG.description}</p>
      </div>
      <nav class="contacts">
        ${contactsHTML}
      </nav>
    </div>
  </header>
  
  <main>
    ${postsHTML}
  </main>
  
  <footer>
    <div class="footer-content">
      <div class="branding">
        <h1>${SITE_CONFIG.title}</h1>
        <p>${SITE_CONFIG.description}</p>
      </div>
      <nav class="contacts">
        ${contactsHTML}
      </nav>
    </div>
    <p class="copyright">${SITE_CONFIG.copyright}</p>
  </footer>
</body>
</html>`;
}

// Generate RSS feed
function generateRSS(posts: Post[]): string {
	const items = posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${SITE_CONFIG.baseUrl}#${post.slug}</link>
      <description><![CDATA[${post.htmlContent}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${SITE_CONFIG.baseUrl}#${post.slug}</guid>
    </item>
  `).join('\n');

	return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE_CONFIG.title}</title>
  <description>${SITE_CONFIG.description}</description>
  <link>${SITE_CONFIG.baseUrl}</link>
  <atom:link href="${SITE_CONFIG.baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>`;
}

// Generate sitemap
function generateSitemap(posts: Post[]): string {
	const urls = posts.map(post => `
  <url>
    <loc>${SITE_CONFIG.baseUrl}#${post.slug}</loc>
    <lastmod>${post.date.toISOString().split('T')[0]}</lastmod>
  </url>
  `).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_CONFIG.baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
  ${urls}
</urlset>`;
}

// Generate 404 page
function generate404Page(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found | ${SITE_CONFIG.title}</title>
  <link rel="stylesheet" href="/static/style.css">
  <link rel="icon" href="/static/favicon.ico">
</head>
<body>
  <header>
    <div class="header-content">
      <div class="branding">
        <h1>${SITE_CONFIG.title}</h1>
        <p>${SITE_CONFIG.description}</p>
      </div>
    </div>
  </header>
  
  <main class="error-page">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <a href="/">Go back to homepage</a>
  </main>
  
  <footer>
    <div class="footer-content">
      <div class="branding">
        <h1>${SITE_CONFIG.title}</h1>
        <p>${SITE_CONFIG.description}</p>
      </div>
    </div>
    <p class="copyright">${SITE_CONFIG.copyright}</p>
  </footer>
</body>
</html>`;
}

// Copy directory recursively
async function copyDir(src: string, dest: string) {
	// Create destination directory if it doesn't exist
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	// Read source directory
	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			// Recursively copy subdirectories
			await copyDir(srcPath, destPath);
		} else {
			// Copy files
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

// Main build function
async function build() {
	console.log('Building blog...');

	// Parse posts from posts.md
	const posts = parseBlogPosts();
	console.log(`Found ${posts.length} posts.`);

	// Generate HTML
	const html = generateHTML(posts);
	fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
	console.log('Generated index.html');

	// Generate RSS feed
	const rss = generateRSS(posts);
	fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), rss);
	console.log('Generated rss.xml');

	// Generate sitemap
	const sitemap = generateSitemap(posts);
	fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
	console.log('Generated sitemap.xml');

	// Generate 404 page
	const notFound = generate404Page();
	fs.writeFileSync(path.join(DIST_DIR, '404.html'), notFound);
	console.log('Generated 404.html');

	// Copy static directory
	await copyDir(STATIC_DIR, path.join(DIST_DIR, 'static'));
	console.log('Copied static directory');

	// Append highlight.js CSS to style.css
	const hlJsCssPath = path.join(ROOT_DIR, 'node_modules/highlight.js/styles/github-dark.min.css');
	const mainCssPath = path.join(DIST_DIR, 'static/style.css');

	if (fs.existsSync(hlJsCssPath) && fs.existsSync(mainCssPath)) {
		const hljsCssContent = fs.readFileSync(hlJsCssPath, 'utf-8');
		fs.appendFileSync(mainCssPath, `\n\n/* highlight.js github-dark.min.css */\n${hljsCssContent}`);
		console.log('Appended highlight.js CSS to style.css');
	} else {
		console.warn('Could not find highlight.js CSS or main style.css to append.');
	}

	// Copy robots.txt
	fs.copyFileSync(
		path.join(ROOT_DIR, 'robots.txt'),
		path.join(DIST_DIR, 'robots.txt')
	);
	console.log('Copied robots.txt');

	console.log('Build completed successfully!');
}

// Run the build
build().catch(err => {
	console.error('Build failed:', err);
	process.exit(1);
});