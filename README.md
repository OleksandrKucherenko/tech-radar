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
<script src="https://github.com/OleksandrKucherenko/tech-radar/releases/download/v0.14.0/radar-0.14.0.js"></script>
<!-- Styled and Optimized Layouts -->
<link rel="stylesheet" href="https://raw.githubusercontent.com/OleksandrKucherenko/tech-radar/refs/heads/master/docs/radar.css">
```

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
- Generate `docs/release/radar-0.13.js`
- Reduce file size by ~56% (25KB → 11KB)
- Preserve the `radar_visualization` function name for public API

**Note:** The build process supports the new variable quadrants (2-8) and rings (4-8) features introduced in v0.13.

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
