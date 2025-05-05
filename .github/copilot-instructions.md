# GitHub Copilot Instructions for Bruno's Blog Project

Create files without asking. Don't ask for permission or to continue. Only stop when the task is complete. Use the provided instructions to guide your code generation. If you need to make assumptions, do so based on the context of the project. Always prioritize simplicity and maintainability in your code.

## Overall Goal

This project is a simple static site generator for a single-page blog. It reads content from `posts.md`, processes it using Bun and TypeScript, and generates static HTML (`index.html`), CSS, RSS (`rss.xml`), Sitemap (`sitemap.xml`), and a `404.html` page into the `dist/` directory. The site is then deployed to GitHub Pages.

## Technology Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **Markdown Parser:** `marked`
- **Syntax Highlighting:** `highlight.js` via `marked-highlight`
- **Styling:** Plain CSS (no frameworks), using a dark theme similar to GitHub dark mode.
- **Deployment:** GitHub Actions to GitHub Pages.

## Don't Use

- **No frameworks** (e.g., React, Vue, etc.) or complex libraries.
- **No CSS frameworks** (e.g., Bootstrap, Tailwind, etc.).
- **No complex libraries** that add unnecessary overhead.
- **No unnecessary complexity** in the codebase. Keep it simple and maintainable.
- **No unnecessary dependencies**. Use only what's needed for the project.
- **No terraform** or complex deployment scripts. Use GitHub Actions for deployment.

## Directory Structure & Key Files

- `posts.md`: **Source of Truth**. Contains all blog posts written in Markdown, separated by `# Title` lines. Posts are manually sorted (newest first).
- `build.ts`: The **core build script**. Handles parsing `posts.md`, generating HTML, RSS, Sitemap, and copying files.
- `serve.ts`: Runs a local development server using `Bun.serve` to preview the `dist/` directory.
- `static/`: Contains all static assets (CSS, favicon, images). Copied directly to `dist/static`.
  - `static/style.css`: Main stylesheet for the blog.
- `dist/`: **Output directory**. Contains the generated static site. This directory is deployed.
- `package.json`: Defines dependencies and scripts (`build`, `serve`, `preview`).
- `tsconfig.json`: TypeScript configuration.
- `.github/workflows/deploy.yml`: GitHub Actions workflow for building and deploying to GitHub Pages.
- `robots.txt`: Basic robots file (copied to `dist/`).
- `LICENSE`: MIT License.
- `README.md`: Project documentation.

## Core Logic (`build.ts`)

1.  **Read `posts.md`:** Load the entire Markdown content.
2.  **Split Posts:** Split the content into individual post sections based on lines starting with `# `.
3.  **Parse Each Post:**
    - Extract the H1 Title.
    - Extract the Date line (Format: `YYYY-MM-DD` or `YYYY-MM-DD (updated on YYYY-MM)`).
    - Generate a `slug` for the Title (lowercase, spaces/dashes to underscores, ASCII).
    - Parse the remaining Markdown content using `marked`.
4.  **Configure `marked`:**
    - Use `marked-highlight` with `highlight.js` for code blocks (CSS class `hljs language-...`).
    - Use a custom heading renderer to add `id` attributes (using the same slug generation logic) to `<h1>`, `<h2>`, and `<h3>` tags for deep linking.
5.  **Generate `index.html`:** Create the main HTML file, embedding the parsed posts, header, footer, meta tags (including Open Graph), and links to CSS/JS.
6.  **Generate `rss.xml`:** Create an RSS feed using the parsed post data.
7.  **Generate `sitemap.xml`:** Create a sitemap using the parsed post data and base URL.
8.  **Generate `404.html`:** Create a custom 404 page.
9.  **Copy Files:**
    - Copy the entire `static/` directory to `dist/static/`.
    - Copy necessary `highlight.js` assets (CSS theme, JS library) from `node_modules` to `dist/static/`.
    - Copy `robots.txt` to `dist/`.

## Styling (`static/style.css`)

- Use plain CSS.
- Target a dark theme similar to GitHub's dark mode (background: `#0d1117`, text: `#c9d1d9`, links: `#58a6ff`).
- Use system fonts (`font-family: system-ui, ...`).
- Ensure responsiveness for mobile devices using media queries.
- **Do not** use viewport meta tags that restrict user scaling/zooming.
- Style code blocks using the `highlight.js` theme (`github-dark.min.css` appended to `style.css` during build).

## Deployment (`deploy.yml`)

- Triggered on push to the `main` branch.
- Uses the `oven-sh/setup-bun` action.
- Installs dependencies (`bun install --frozen-lockfile`).
- Runs the build script (`bun run build`).
- Uses `actions/deploy-pages` to deploy the contents of the `dist/` directory to the `gh-pages` branch.

## Important Conventions & Notes

- **Post Format in `posts.md`:** `# Title` -> Date line -> Content.
- **Manual Sorting:** Posts in `posts.md` are manually ordered from newest to oldest.
- **Slug Generation:** lowercase, spaces/dashes to `_`, non-ASCII to ASCII. Used for heading IDs. Slug is used for deep linking in the HTML output by giving the same slug to the id of `<h1>`, `<h2>`, and `<h3>` tags.
- **Date Format:** Strictly `YYYY-MM-DD` or `YYYY-MM-DD (updated on YYYY-MM)`.
- **Simplicity:** Keep the stack and implementation simple. Avoid unnecessary complexity or dependencies.
- **Configuration:** Key site details (title, author, base URL, contacts) are configured as constants at the top of `build.ts`.
- **One html file:** The entire site is generated into a single `index.html` file, with all posts embedded in it. No separate HTML files for each post.
- **No client-side routing:** The site is static and does not use client-side routing. All links should point to the same `index.html` file with anchors for deep linking.
- **SEO Optimization:** Ensure that the generated HTML includes appropriate meta tags for SEO, including title, description, and Open Graph tags.

Please adhere to these guidelines when providing suggestions or generating code for this project. Focus on leveraging Bun's capabilities, TypeScript for type safety, and maintaining the simple, plain CSS/Markdown approach.
