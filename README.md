# Portfolio

Portfolio site for Rahmat Fajar (uzuki-P), laid out as a Linux desktop session: projects are
desktop icons that open draggable windows, a top bar tracks open windows and plays the intro in a
Wave Player pill, and a Lyrics Float pill sings it in the corner. React 19, Vite and Tailwind CSS v4.

- `src/data.ts`: the featured CRM and every side project (copy, links, icons, screenshots)
- `src/App.tsx`: the desktop, windows, screenshot preview and top bar; `src/index.css`: themes and motion
- `src/player.ts`: the intro lyrics (Japanese, romaji, English), their timing, and the shared play clock
- `src/Lyrics.tsx`: the lyrics pill, with motion copied from Lyrics Float's `LyricsViewport.kt`
- `src/WavePill.tsx`: the top bar's Wave Player pill; its visualizer is also the progress bar
- `src/Theme.tsx`, `src/Weather.tsx`: the top bar's theme dropdown and Medan weather, both on the
  native popover in `src/Popover.tsx`. Weather comes from [Open-Meteo](https://open-meteo.com/)
  (no API key, metric units) in the visitor's browser and refreshes every 15 minutes; if it fails,
  the top bar leaves it out
- `src/components/m3e/icon*.ts(x)`: bundled Material Symbols, from
  [shadcn-m3e](https://github.com/Crysta1221/shadcn-m3e) (upstream commit
  `98f011bc8e5932be4d5199419f69d224c936c3aa`); the rest of `src/components/m3e/` and `src/lib/m3e/`
  is that library's source and is no longer used by the page
- `public/favicon.svg`: the glasses avatar, also used in the page and taskbar
- `public/shots/`: screenshots as WebP
- `tools/`: scripts that produced some screenshots

Colors: Material pink-500 `#E91E63` lights the wallpaper; buttons and links use pink-700
`#C2185B` so white text keeps AA contrast. Light and dark themes are CSS variables in
`src/index.css`; the top bar's theme dropdown offers System, Light and Dark and saves the choice in
`localStorage` under `color-mode` (index.html applies it before first paint).

Icon names must be written as `name="x"` or `icon: "x"` so `just icons` bundles them.
Screenshots open full screen on click. Below 1024px the page becomes a phone home screen instead of a desktop: the
about card, the lyrics and an app grid, where each app opens as a full-screen sheet that the
phone's Back gesture closes. Top bar items get tooltips from `src/Tooltip.tsx` via `data-tip`. Windows open side by side on wide screens and stack
newest-first on phones.

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
| Kalender Cuti | the live site, https://kalender-cuti.vercel.app, at 1440×900 in light mode |
| Spendr | `spendr-kt/docs/screenshots/spendr-kt/` |
| Pray Time | `pray-time-promo/public/app/` |
| Gokapi | `just desktop-mock` in gokapi-android (fake server) |
| Lyrics Float, Wave Player | each repo's README images |
| Vision API | playground dev server with mocked API responses (`just capture vision`) |
| Viewport Find | the real extension in headless Chromium (`just capture find`) |
