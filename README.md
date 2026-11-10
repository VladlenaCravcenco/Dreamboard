
  # Dreamboard interactive web app

  This is a code bundle for Dreamboard interactive web app. The original project is available at https://www.figma.com/design/I1OpM2BGIWDALOUc82m8qG/Dreamboard-interactive-web-app.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
  ## SEO

  `npm run build` also runs `scripts/prerender.mjs`: the guest landing page (`src/app/screens/LandingScreen.tsx`) is rendered into `dist/index.html` for `/`, and every other route is served from `dist/app.html` with `noindex`. When the site moves to its own domain, update `publicOrigin` in `src/app/lib/shareMetadata.mjs`, `public/robots.txt` and `public/sitemap.xml`.
