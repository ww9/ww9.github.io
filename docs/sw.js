self.addEventListener('install', (e) => {
	e.waitUntil(
	  caches.open('cached_blog_files').then((cache) => cache.addAll([
		 '/',
		 '/index.html',
		 '/_resources/037cd31e4bdc4caa83bb371d9e17f93e.png',
		 '/_resources/226a5b291f6b4787a37e97fd8579b9ed.png',
		 '/_resources/696c4e9fc58a4c70886fe594bab8ba1e.png',
		 '/_resources/edf970db09aa4d27b988322de422417a.png',
		 '/blog/2023-02-07-Debugging-slow-MySQL-and-MariaDB-querie.html',
		 '/blog/2023-02-08-How-I-blog-using-joplins-EXPORT-HTML-Di.html',
	  ])),
	);
 });
 
 self.addEventListener('fetch', (e) => {
	console.log(e.request.url);
	e.respondWith(
	  caches.match(e.request).then((response) => response || fetch(e.request)),
	);
 });