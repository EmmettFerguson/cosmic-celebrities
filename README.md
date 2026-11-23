# Cosmic Celebrities · Cornell Data Journal

An interactive article built as a 3D solar system. Each celebrity (the Sun, the planets
and Titan) holds one page of the article. Clicking one flies the camera in, with the
body on the left and the text on the right. Readers start on the Sun page.

**Live site:** https://emmettferguson.github.io/cosmic-celebrities/

---

## Editing the article (no coding needed)

Every page is one Markdown file in [`content/`](content/). Edit it right on GitHub:
open the file, click the pencil icon, change the text, then click **Commit changes**.
The live site updates about a minute later.

| Page | File |
|---|---|
| 01 Sun (intro, title, byline) | `content/sun.md` |
| 02–10 Mercury … Neptune, plus Titan | `content/<name>.md` |

### The header block
Each file begins with a short header between `---` lines:

```
---
title: The Ringed Diva          ← optional; defaults to the tagline in js/bodies.js
deck: One-line summary under the headline
byline: By Jane Doe and John Roe · Cornell Data Journal
---
```

### Text
Ordinary Markdown: blank line between paragraphs, `**bold**`, `*italic*`,
`## Section heading`, `### SMALL LABEL HEADING`, `> pull quote`, `[link text](https://…)`.

### Footnotes (click-to-open)
```
Saturn is the only planet [[less dense than water|Its density is about 0.69 g/cm³. Source: [NASA](https://science.nasa.gov/saturn/facts/)]].
```
`[[highlighted text|footnote text]]`: the highlighted text gets a violet underline,
and clicking it opens the note. For a long note, give it a name and write it at the
bottom of the file:
```
…the [[Cassini mission|^cassini]] ended in 2017.

[^cassini]: A long note can go here, as long as you like.
```
Notes are numbered automatically and also listed under **Notes** at the end of the page.

### Stat cards
````
```stats
Known moons | 274 | most of any planet
Density, g/cm³ | 0.69 | water = 1.00
```
````
One card per line: `label | big number | small note`.

### Interactive charts
Put the data in a CSV file in [`data/`](data/), then add:
````
```chart
{
  "type": "bar",
  "data": "data/giant-moons.csv",
  "x": "planet",
  "y": "moons",
  "highlight": "Saturn",
  "title": "Known moons of the giant planets",
  "source": "NASA"
}
```
````
- `type`: `bar`, `barh` (horizontal bars), `line` or `scatter`
- `y` can be a list for several series: `"y": ["2020", "2025"]` (a legend appears automatically)
- Optional: `xlabel`, `ylabel`, `unit` (shown on hover), `note`, `height` (pixels)
- Every chart gets hover values and a **Data table** toggle for accessibility.

### Images
Put the file in [`img/`](img/), then:
```
![Caption shown under the image](img/my-chart.png "Source: who made it")
```

---

## Changing the solar system itself
[`js/bodies.js`](js/bodies.js) is the single config: names, hover taglines, sizes,
orbits, and which objects are clickable pages (`page: true`) or label-only.

## Previewing locally
The site loads the Markdown files with `fetch`, so it has to be served rather than
opened as a file:
```
python -m http.server 8000
```
Then open http://localhost:8000.

## Controls
Drag to orbit, scroll or pinch to zoom, click a celebrity. In a close-up: ← / → move to
the previous or next page, and Esc returns to the solar system. Readers who turn on
"reduce motion" get instant cuts instead of camera flights.

See [CREDITS.md](CREDITS.md) for texture and library licenses.
