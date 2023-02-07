const glob = require('glob');
const path = require('path');
const assert = require('assert');
const fs = require('fs-extra');
const { exit } = require('process');
const cheerio = require('cheerio');
const open = require('open');

function createJoplinExportDirectory() {
	fs.mkdirSync('./joplin_export');
	fs.writeFileSync('./joplin_export/.gitignore', `# Ignore everything in this directory
*
# Except this file
!.gitignore`);
}

// create "joplin_export" directory if it doesn't exist and create .gitignore file in it
if (!fs.existsSync('./joplin_export')) {
	createJoplinExportDirectory();
	console.log('Created ./joplin_export directory and .gitignore file in it. Nothing to publish yet.');
	exit();
}
// Read files, gather metadata and store it in pages array
const files = glob.sync('./joplin_export/**/*.html');
assert(files.length > 0, 'At least one .html file needs to be in ./joplin_export directory.');
console.log(files);
// backup ./joplin_export to ./backups/epochMilliseconds_joplin_export
const epochMilliseconds = new Date().getTime();
//fs.copySync('./joplin_export', `./backups/${epochMilliseconds}_joplin_export`);

// re-create ./docs directory so we can work on a blank slate
fs.rmSync('./docs', { recursive: true, force: true });
fs.mkdirSync('./docs');
fs.moveSync('./_resources', './docs/_resources', { overwrite: true });
fs.copySync('./joplin_export/pluginAssets', './docs/pluginAssets');
fs.writeFileSync('./docs/.gitkeep', `# Please don't delete this file. It keeps this directory in git even if there are no files`);
fs.writeFileSync('./docs/CNAME', `brunocassol.com`);
fs.writeFileSync('./docs/.nojekyll', `We need this file otherwise GitHub Pages will ignore our /docs/_resources directory. See https://github.com/mpetrovich/stylemark/issues/65`);

const pages = [];
files.forEach(file => {
	const content = fs.readFileSync(file, 'utf8');
	const $ = cheerio.load(content);
	const page = {
		filePath: file.replace('./joplin_export/', ''),
		fileDir: path.dirname(file).replace('./joplin_export', '') || '/',
		fileName: file.substring(file.lastIndexOf('/') + 1),
		exportedNoteTitle: $('.exported-note-title').text(),
		firstH1: $('h1').first().text(),
		isBlogPost: file.startsWith('./joplin_export/blog/'),
		$: $,
	};

	// Remove <div class="exported-note-title">...</div> from the page
	$('.exported-note-title').remove();
	page.content = $.html();

	if (page.exportedNoteTitle.startsWith('_')) return; // Ignore unpublished pages
	let postDate = page.fileName.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}).*/);
	page.postDate = postDate ? postDate[1] : null;
	pages.push(page);
});

// Generate list of blog posts and place it in index.html "LIST_LINKED_BLOG_POSTS_TITLES_HERE"
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
	// Insert blog post list
	if (page.fileName === 'index.html' || page.fileName === 'blog.html') {
		page.content = page.content.replace('LIST_LINKED_BLOG_POSTS_TITLES_HERE', blogListHTML);
	}
	// Fix asset pathings in subfolders
	page.content = page.content.replace(/"pluginAssets\//g, '"\/pluginAssets\/');
	page.content = page.content.replace(/"..\/..\/_resources\//g, '"\/_resources\/');

	// Add navigation links to the top of the page
	const navLinks = '<nav><a href="/">Home</a> | <a href="/blog.html">Blog</a></nav>';
	page.content = page.content.replace(/<div id="rendered-md">/g, '<div id="rendered-md">' + navLinks);

	fs.outputFile(`./docs/${page.filePath}`, page.content);
});

// Clean joplin_export directory. Delete all files except .gitignore
fs.rmSync('./joplin_export', { recursive: true, force: true });
createJoplinExportDirectory();

// Print pages without content to debug
pages.forEach(page => { delete page.content; delete page.$; }); console.log(pages);

// Serve content and open browser to preview result
const express = require('express');
const server = express();
server.use(express.static('docs', { index: 'index.html', redirect: false }));
server.listen(3000, () => { console.log('Listening on http://localhost:3000') });
open('http://localhost:3000', { wait: true });