# Portfolio

Portfolio site for Rahmat Fajar (uzuki-P). React 19, Vite, Tailwind CSS v4 and
[shadcn-m3e](https://github.com/Crysta1221/shadcn-m3e) (Material 3 Expressive).

- `src/data.ts`: the featured CRM and every side project (copy, links, shapes, screenshots)
- `src/App.tsx`: the page; `src/index.css`: the few styles outside the M3E tokens
- `src/components/m3e/`, `src/lib/m3e/`: shadcn-m3e source copied from the registry
  (upstream commit `98f011bc8e5932be4d5199419f69d224c936c3aa`, shadcn CLI 4.23)
- `public/shots/`: screenshots as WebP
- `tools/`: scripts that produced some screenshots

Theme: seed `#1F6E5C`, `expressive` scheme variant. System, Light and Dark modes
live in the top bar menu and are saved in `localStorage` under `color-mode`.

## Commands

```sh
pnpm install
just dev          # Vite dev server
just dev-share    # dev server on this project's private tailnet route
just build        # typecheck and build dist/
just preview      # serve dist/
just icons        # run after using a new Material Symbols name
```

## Publish on GitHub Pages

`.github/workflows/pages.yml` builds with pnpm and deploys `dist/` on every push to `main`.

```sh
git init -b main && git add . && git commit -m "Initial portfolio"
gh repo create uzuki-P.github.io --public --source . --push
```

Then set the repo's **Settings → Pages → Source** to **GitHub Actions**. A repo named
`uzuki-P.github.io` is served at https://uzuki-p.github.io; any other name is served
at `https://uzuki-p.github.io/<repo>/`. The build uses relative asset paths, so both work.

## Screenshot sources

| Project | Source |
| --- | --- |
| OneCore CRM | capital-crm mocked Playwright fixtures (made-up data) |
| TabQuest | public runtime on a throwaway DB seeded by `tools/tabquest-seed.ts` (made-up players) |
| Spendr | `spendr-kt/docs/screenshots/spendr-kt/` |
| Pray Time | `pray-time-promo/public/app/` |
| Gokapi | `just desktop-mock` in gokapi-android (fake server) |
| Lyrics Float, Wave Player | each repo's README images |
| Vision API | playground dev server with mocked API responses (`just capture vision`) |
| Viewport Find | the real extension in headless Chromium (`just capture find`) |
