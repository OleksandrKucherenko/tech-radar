# Motivation

[![codecov](https://codecov.io/gh/zalando/tech-radar/branch/master/graph/badge.svg)](https://codecov.io/gh/zalando/tech-radar)

The Tech Radar is a tool to help engineering teams align on technology choices.
It is based on the [pioneering work by ThoughtWorks](https://www.thoughtworks.com/radar).

This repository contains the code to generate the visualization:
[`radar.js`](/docs/radar.js) (based on [d3.js v7](https://d3js.org)).
Feel free to use and adapt it for your own purposes.

> [!NOTE]
> Since v0.12, we're using d3.js v7. See [related PR](https://github.com/zalando/tech-radar/pull/197/files)
> if you need to apply changes in your fork.

## Usage

1. include `d3.js` and `radar.js`:

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://github.com/OleksandrKucherenko/tech-radar/releases/download/v0.19.0/radar-0.19.0.js"></script>
<!-- Optional: Responsive layout enhancements (since v0.19.0, critical styles are inlined in JS) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/OleksandrKucherenko/tech-radar@v0.19.0/docs/radar.css">
```

> [!IMPORTANT]
> **CSS loading:** Do **not** use `raw.githubusercontent.com` for CSS — GitHub raw URLs serve
> `Content-Type: text/plain` and browsers reject them as stylesheets. Use
> [jsDelivr](https://www.jsdelivr.com/) (`cdn.jsdelivr.net/gh/user/repo@tag/path`) which serves
> repository tree files with correct MIME types, or use GitHub Pages.
> Since v0.19.0, all critical layout styles are inlined in the JS, so the CSS file is optional.
>
> **JS loading:** GitHub Release download URLs (`github.com/.../releases/download/...`) work fine
> for `<script>` tags — browsers are lenient about MIME types for scripts.
>
> **Note:** jsDelivr serves files from the **git repository tree** (branches/tags), not GitHub
> Release assets. The JS file must be loaded from GitHub Releases directly.

2. insert an empty `svg` tag:

```html
<div class="radar-container">
  <svg id="radar"></svg>
</div>
```

3. configure the radar visualization:

```js
radar_visualization({
  repo_url: "https://github.com/zalando/tech-radar",
  svg_id: "radar",
  width: 1450,
  height: 1000,
  scale: 1.0,
  colors: {
    background: "#fff",
    grid: "#bbb",
    inactive: "#ddd"
  },
  // Some font families might lead to font size issues
  // Arial, Helvetica, or Source Sans Pro seem to work well though
  font_family: "Arial, Helvetica",
  title: "My Radar",
  quadrants: [
    { name: "Bottom Right" },
    { name: "Bottom Left" },
    { name: "Top Left" },
    { name: "Top Right" }
  ],
  rings: [
    { name: "INNER",  color: "#5ba300" },
    { name: "SECOND", color: "#009eb0" },
    { name: "THIRD",  color: "#c7ba00" },
    { name: "OUTER",  color: "#e09b96" }
  ],
  print_layout: true,
  links_in_new_tabs: true,
  entries: [
   {
      label: "Some Entry",
      quadrant: 3,          // 0,1,2,3 (counting clockwise, starting from bottom right)
      ring: 2,              // 0,1,2,3 (starting from inside)
      moved: -1             // -1 = moved out (triangle pointing down)
                            //  0 = not moved (circle)
                            //  1 = moved in  (triangle pointing up)
                            //  2 = new       (star)
   },
    // ...
  ]
});
```

Entries are positioned automatically so that they don't overlap. The "scale" parameter can help
in adjusting the size of the radar.

As a working example, you can check out `docs/index.html`.

### Embedding in Confluence

The Tech Radar can be embedded in Confluence pages using the
[HTML macro](https://confluence.atlassian.com/doc/html-macro-38273085.html) (Confluence Server/Data Center)
or a third-party HTML embed app (Confluence Cloud).

Since v0.19.0, all layout-critical styles are inlined in the JavaScript, so the radar renders
correctly **without an external CSS file**. Only two `<script>` tags are needed (D3.js + radar.js
from GitHub Releases). This is important for Confluence because:

- Confluence HTML macros run inside restricted containers or iframes
- External CSS from `raw.githubusercontent.com` is blocked (browsers reject `text/plain` MIME type for stylesheets)
- jsDelivr works for CSS (serves repo tree files with correct MIME types) but is an extra dependency
- Content Security Policy (CSP) headers may block external resources

#### Working Confluence HTML Snippet

Paste this into a Confluence HTML macro:

```html
<!-- Load D3.js (required) -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- Load Tech Radar (v0.19.0+) -->
<script src="https://github.com/OleksandrKucherenko/tech-radar/releases/download/v0.19.0/radar-0.19.0.js"></script>

<!-- Radar container -->
<div class="radar-container">
  <svg id="radar"></svg>
</div>

<script type="text/javascript">
  radar_visualization({
    repo_url: "https://github.com/zalando/tech-radar",
    svg_id: "radar",
    colors: {
      background: "#ffffff",
      grid: "#bbbbbb",
      inactive: "#dddddd"
    },
    title: "My Organisation Tech Radar",
    quadrants: [
      { name: "Techniques" },
      { name: "Tools" },
      { name: "Platforms" },
      { name: "Languages & Frameworks" }
    ],
    rings: [
      { name: "Adopt",     color: "#5ba300" },
      { name: "Trial",     color: "#009eb0" },
      { name: "Assess",    color: "#c7ba00" },
      { name: "Hold",      color: "#e09b96" }
    ],
    print_layout: true,
    links_in_new_tabs: true,
    entries: [
      { label: "Kubernetes",  quadrant: 2, ring: 0, moved: 0 },
      { label: "TypeScript",  quadrant: 3, ring: 0, moved: 1 },
      { label: "GraphQL",     quadrant: 1, ring: 1, moved: 0 },
      { label: "Terraform",   quadrant: 2, ring: 1, moved: 0 }
    ]
  });
</script>
```

#### Confluence with Extended Rings (5-8 rings)

Tech Radar supports 4 to 8 rings. Here is an example with 7 rings:

```html
<!-- Load D3.js (required) -->
<script src="https://d3js.org/d3.v7.min.js"></script>

<!-- Load Tech Radar (v0.19.0+) -->
<script src="https://github.com/OleksandrKucherenko/tech-radar/releases/download/v0.19.0/radar-0.19.0.js"></script>

<!-- Radar container -->
<div class="radar-container">
  <svg id="radar"></svg>
</div>

<script type="text/javascript">
  radar_visualization({
    repo_url: "https://github.com/zalando/tech-radar",
    svg_id: "radar",
    colors: {
      background: "#ffffff",
      grid: "#bbbbbb",
      inactive: "#dddddd"
    },
    title: "My Organisation Tech Radar",
    quadrants: [
      { name: "Techniques" },
      { name: "Tools" },
      { name: "Platforms" },
      { name: "Languages & Frameworks" }
    ],
    rings: [
      { name: "Invest",       color: "#4CAF50" },
      { name: "Evaluate",     color: "#8BC34A" },
      { name: "Maintain",     color: "#CDDC39" },
      { name: "Hold",         color: "#FFC107" },
      { name: "Decommission", color: "#FF9800" },
      { name: "Discarded",    color: "#FF5722" },
      { name: "Retire",       color: "#9E9E9E" }
    ],
    print_layout: true,
    links_in_new_tabs: true,
    entries: [
      { label: "OpenAI GPT-4.1",         quadrant: 1, ring: 0, moved: 1 },
      { label: "Azure OpenAI",           quadrant: 0, ring: 0, moved: 0 },
      { label: "RAG Architecture",       quadrant: 3, ring: 0, moved: 1 },
      { label: "LangChain",              quadrant: 2, ring: 1, moved: 0 },
      { label: "Llama 3",                quadrant: 1, ring: 1, moved: 0 },
      { label: "Semantic Caching",       quadrant: 3, ring: 1, moved: 0 },
      { label: "Azure Cognitive Search", quadrant: 0, ring: 2, moved: 0 },
      { label: "TensorFlow",             quadrant: 1, ring: 2, moved: -1 },
      { label: "Custom NLP models",      quadrant: 1, ring: 3, moved: -1 },
      { label: "Legacy ML pipelines",    quadrant: 0, ring: 3, moved: 0 }
    ]
  });
</script>
```

#### Confluence Troubleshooting

| Problem | Solution |
|---------|----------|
| Radar doesn't render at all | Check browser console for errors. Ensure D3.js loads before radar.js. Use v0.19.0+. |
| CSS not applied / unstyled layout | Use `cdn.jsdelivr.net` for CSS, never `raw.githubusercontent.com`. Since v0.19.0, CSS is optional. |
| `print_details` not recognized | This is not a valid config option. Use `description` field on entries for detail modals. |
| Legends missing | Ensure `print_layout: true` is set in the configuration. |
| Script blocked by CSP | Ask your Confluence admin to allowlist `d3js.org` and `github.com` domains. |
| Modal appears outside visible area | Upgrade to v0.19.0+ which includes inline modal styles. |

## Deployment

Tech Radar is a static page that can be deployed using any hosting provider offering static page hosting.

### Automatic GitHub Pages Deployment

This repository includes automated GitHub Actions workflows that deploy to GitHub Pages:

#### Main Site Deployment

The main site is **automatically deployed** from the `master` branch to GitHub Pages:

- **Trigger:** Every push to `master` branch
- **Workflow:** `.github/workflows/deploy-pages.yml`
- **URL:** `https://{owner}.github.io/{repo}/`
- **Content:** Deploys all files from `/docs` directory

#### PR Preview Deployments

Pull requests get **automatic preview deployments** for testing before merge:

- **Trigger:** When PR is opened, updated, or reopened
- **Workflow:** `.github/workflows/pr-preview.yml`
- **URL:** `https://{owner}.github.io/{repo}/pr-{number}/`
- **Cleanup:** Previews are automatically removed when PR is closed/merged
- **Features:**
  - Preview URL posted as PR comment (auto-updated on new commits)
  - No comment spam - same comment is reused for updates
  - Preview URL displayed in GitHub Actions job summary

#### Initial Setup (One-Time)

After merging the workflow files, configure GitHub Pages in your repository:

1. Go to **Repository Settings → Pages**
2. Under "Build and deployment":
   - **Source:** Select **"Deploy from a branch"**
   - **Branch:** Select **`gh-pages`** and **`/ (root)`**
3. Click **Save**

The first workflow run will automatically create the `gh-pages` branch if it doesn't exist.

#### Workflow Features

- ✅ Automatic `gh-pages` branch creation on first run
- ✅ Main site and PR previews coexist on same GitHub Pages site
- ✅ Clickable deployment URLs in Actions job summaries
- ✅ PR comments with preview links (anti-spam: updates same comment)
- ✅ Automatic cleanup when PRs are closed or merged

See [CLAUDE.md](CLAUDE.md) for detailed workflow documentation.

## Local Development

**Requirements:** [Bun runtime](https://bun.sh) must be installed.

1. install dependencies:

```bash
bun install
```

2. start local dev server:

```bash
bun start
```

3. your default browser should automatically open and show the url

```
http://localhost:3000/
```

## Building for Production

To create a minified version for production use:

```bash
bun run build
```

This will:
- Minify `radar.js` using Bun + terser
- Generate `docs/release/radar-{version}.js`
- Reduce file size by ~48% (80KB → 41KB)
- Preserve the `radar_visualization` function name for public API

**Note:** The build process supports variable quadrants (2-8) and rings (4-8).

## License

```
The MIT License (MIT)

Copyright (c) 2017-2025 Zalando SE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
