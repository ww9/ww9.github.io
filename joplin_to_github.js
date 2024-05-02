const glob = require('glob');
const path = require('path');
const assert = require('assert');
const fs = require('fs-extra');
const { exit } = require('process');
const cheerio = require('cheerio');
const open = require('open');

const exportDirectory = './brunocassol.com';

function createJoplinExportDirectory() {
	fs.mkdirSync(exportDirectory);
	fs.writeFileSync(exportDirectory + '/.gitignore', `# Ignore everything in this directory
*
# Except this file
!.gitignore`);
}

// create exportDirectory if it doesn't exist and create .gitignore file in it
if (!fs.existsSync(exportDirectory)) {
	createJoplinExportDirectory();
	console.log('Created ' + exportDirectory + ' directory and .gitignore file in it. Nothing to publish yet.');
	exit();
}
// Read files, gather metadata and store it in pages array
const files = glob.sync(exportDirectory + '/**/*.html');
assert(files.length > 0, 'At least one .html file needs to be in ' + exportDirectory + ' directory.');
console.log(files);

// backup ./exportDirectory directory to ./backups/epochMilliseconds_export
const epochMilliseconds = new Date().getTime();
//fs.copySync(exportDirectory, `./backups/${epochMilliseconds}_export`);

// re-create ./docs directory so we can work on a blank slate
fs.rmSync('./docs', { recursive: true, force: true });
fs.mkdirSync('./docs');
fs.copySync('./_resources', './docs/_resources', { overwrite: true });
fs.copySync(exportDirectory + '/pluginAssets', './docs/pluginAssets');
fs.writeFileSync('./docs/.gitkeep', `# Please don't delete this file. It keeps this directory in git even if there are no files`);
fs.writeFileSync('./docs/CNAME', `brunocassol.com`);
fs.writeFileSync('./docs/.nojekyll', `We need this file otherwise GitHub Pages will ignore our /docs/_resources directory. See https://github.com/mpetrovich/stylemark/issues/65`);

const pages = [];
const allowedDirectories = ['/', '/blog'];
files.forEach(file => {
	const content = fs.readFileSync(file, 'utf8');
	const $ = cheerio.load(content);
	const page = {
		filePath: file.replace(exportDirectory + '/', ''),
		fileDir: path.dirname(file).replace(exportDirectory, '') || '/',
		fileName: file.substring(file.lastIndexOf('/') + 1),
		exportedNoteTitle: $('.exported-note-title').text(),
		firstH1: $('h1').first().text(),
		isBlogPost: file.startsWith(exportDirectory + '/blog/'),
		$: $,
	};

	if (!allowedDirectories.includes(page.fileDir)) return; // Ignore pages that are not in allowedDirectories
	if (page.exportedNoteTitle.startsWith('_')) return; // Ignore unpublished pages

	let postDate = page.fileName.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}).*/);
	page.postDate = postDate ? postDate[1] : null;
	pages.push(page);
});

// Generate list of blog posts, sorted by date descending, so we can fill the 
// list in index.html and blog.html "LIST_LINKED_BLOG_POSTS_TITLES_HERE"
const blogListHTML = pages
	.filter(page => page.isBlogPost)
	.sort((a, b) => {
		if (a.postDate < b.postDate) return 1;
		if (a.postDate > b.postDate) return -1;
		return 0;
	})
	.map(page => {
		return `<b>${page.postDate}</b> <a href="/blog/${page.fileName}"> ${page.firstH1}</a>`;
	})
	.join('\n<br>\n');

// Process each page and save it to ./docs
pages.forEach(page => {

	// Remove <div class="exported-note-title">...</div> from the page
	page.$('.exported-note-title').remove();

	// Add navigation links to the top of the page
	const navLinks = '<nav><a href="/">Home</a> | <a href="/blog.html">Blog</a></nav>';
	page.$('#rendered-md').prepend(navLinks);
	// page.content = page.content.replace(/<div id="rendered-md">/g, '<div id="rendered-md">' + navLinks);

	// If it is a blog page, replace HTML title with page.firstH1
	if (page.isBlogPost) {
		assert(page.firstH1.length > 0, 'Blog pages need an H1 title.' + page);
		page.$('title').text(page.firstH1);
	} else if (page.filePath === 'index.html') {
		page.$('title').text('Bruno Cassol');
	} else if (page.filePath === 'blog.html') {
		page.$('title').text('Blog');
	}

	// Append " - brunocassol.com" to page HTML <title> of all pages except home
	if (page.filePath !== 'index.html') {
		page.$('title').text(page.$('title').text() + ' - Bruno Cassol');
	}

	let htmlContent = page.$.html();
	// Replaces occurrences of the strin "pluginAssets/ with "/pluginAssets/ 
	htmlContent = htmlContent.replace(/"pluginAssets\//g, '"\/pluginAssets\/');
	// Replaces occurrences of the string "../../_resources/ with "/_resources/
	htmlContent = htmlContent.replace(/"..\/..\/_resources\//g, '"\/_resources\/');
	// Insert blog post list
	if (page.fileName === 'index.html' || page.fileName === 'blog.html') {
		htmlContent = htmlContent.replace('LIST_LINKED_BLOG_POSTS_TITLES_HERE', blogListHTML);
	}

	fs.outputFile(`./docs/${page.filePath}`, htmlContent);
});

// Clean export directory. Delete all files except .gitignore
fs.rmSync(exportDirectory, { recursive: true, force: true });
fs.rmSync('./_resources', { recursive: true, force: true });
createJoplinExportDirectory();

// Print pages without content to debug
pages.forEach(page => { delete page.content; delete page.$; }); console.log(pages);

// Serve content and open browser to preview result
const express = require('express');
const server = express();
server.use(express.static('docs', { index: 'index.html', redirect: false }));
server.listen(3000, () => { console.log('Listening on http://localhost:3000') });
open('http://localhost:3000', { wait: true });