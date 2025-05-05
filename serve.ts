import { serve } from 'bun';
import { join } from 'path';
import { statSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// Now we execute `bun build.ts` command to generate static files before starting the server
try {
	execSync('bun build.ts', { stdio: 'inherit' });
} catch (error) {
	// If the build fails, we exit the process
	console.error('Build failed:', error);
	process.exit(1);
}

const PORT = 3000;
const DIST_DIR = join(process.cwd(), 'dist');

// Simple development server for the static site
const server = serve({
	port: PORT,
	fetch(req) {
		// Get the URL pathname
		const url = new URL(req.url);
		let pathname = url.pathname;

		// Default to index.html for root path
		if (pathname === '/') {
			pathname = '/index.html';
		}


		// Construct the file path
		let filePath = join(DIST_DIR, pathname);

		// Check if the file exists
		if (existsSync(filePath)) {
			// If it's a directory, serve index.html from that directory
			if (statSync(filePath).isDirectory()) {
				filePath = join(filePath, 'index.html');
			}

			// Return the file
			return new Response(Bun.file(filePath));
		} else {
			// If file doesn't exist, try to serve 404.html
			const notFoundPath = join(DIST_DIR, '404.html');
			if (existsSync(notFoundPath)) {
				return new Response(Bun.file(notFoundPath), {
					status: 404,
				});
			}

			// Fall back to a plain text 404 message
			return new Response('404 - Not Found', {
				status: 404,
			});
		}
	},
});

console.log(`Server running at http://localhost:${PORT}`);