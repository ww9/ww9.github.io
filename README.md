# Bruno's Blog

A simple, static site blog generator using Markdown, Bun, and TypeScript.

## TODO

- Write a short sentence about what you have learned from each book you read.

## Features

- Written in TypeScript and powered by Bun
- Generates static HTML from Markdown content
- Syntax highlighting using highlight.js
- Responsive design with mobile support
- Dark theme inspired by GitHub dark mode
- Sitemap generation
- Automatic deployment to GitHub Pages

## Setup

### Prerequisites

- Install [Bun](https://bun.sh/): `curl -fsSL https://bun.sh/install | bash`
- Git

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/blog.git
   cd blog
   ```

2. Install dependencies:

   ```
   bun install
   ```

3. Update site configuration:
   Edit `src/build.ts` and update the `SITE_CONFIG` object with your information.

## Usage

### Adding blog posts

Edit the `posts.md` file to add or modify posts. The format is:

```markdown
# Post Title

YYYY-MM-DD (optional: updated on YYYY-MM)
tag1, tag2, tag3

Post content goes here...

## Subheading

More content...
```

Posts are manually ordered in the file, with the newest posts at the top.

### Development

To build and preview the blog locally:

```
bun run preview
```

This will build the blog and start a local server at `http://localhost:3000`.

To only build the blog:

```
bun run build
```

To only start the development server (after building):

```
bun run serve
```

### Deployment

The blog automatically deploys to GitHub Pages when you push changes to the `main` branch.

1. Make sure GitHub Pages is enabled in your repository settings, using the GitHub Actions deployment option.
2. Push changes to the `main` branch.
3. GitHub Actions will build and deploy your site.

## Customization

- **CSS Styling**: Edit `static/style.css` to customize the appearance
- **Site Configuration**: Update the `SITE_CONFIG` object in `src/build.ts`
- **Static Assets**: Add images and other static files to the `static/` directory

## License

MIT
