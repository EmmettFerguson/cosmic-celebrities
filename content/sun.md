---
title: Cosmic Celebrities
deck: [One-sentence deck: what makes an object in space famous, and how the group measured it.]
byline: By [Author names] · Cornell Data Journal
kicker: THE SUN · START HERE
---

[Intro paragraph. Set up the article's question: which objects in our solar system are the biggest "celebrities", and by what measures? Readers start here on the Sun, and can click **← System** at any time to see the whole solar system and pick a celebrity.]

### How to read this piece

Click any planet in the solar system to fly to its page, or use the arrows to read in order. A term that is [[highlighted like this|This is a footnote. In the Markdown file, write two opening square brackets, the term, a vertical bar, the note, then two closing square brackets (see README). Notes can include **formatting** and [links](https://science.nasa.gov/sun/).]] opens a footnote when you click it.

Longer notes can be written at the bottom of the file and pointed to by name, like this [[second example|^long-note]].

## A demo of the building blocks

*(Delete this section when the real text goes in. It shows each kind of graph your group can use.)*

### Stat cards

```stats
Share of the solar system's mass | 99.8% | everything else: 0.2%
Light travel time to Earth | ~8 min 20 s | at 1 AU
Diameter | ~109 Earths | 1.39 million km
```

### Interactive chart

```chart
{
  "type": "bar",
  "data": "data/sample-fame.csv",
  "x": "object",
  "y": "mentions",
  "highlight": "Saturn",
  "title": "Sample chart · placeholder numbers",
  "ylabel": "Mentions (placeholder)",
  "note": "PLACEHOLDER DATA: replace data/sample-fame.csv with the group's real numbers.",
  "source": "[your source]"
}
```

### Image with caption

![Sample figure: put your own PNG or SVG in the img/ folder](img/sample-figure.svg "Source: [credit line]")

[^long-note]: Footnotes written this way can be as long as you like and can span several lines. Each one is also listed under "Notes" at the end of the page.
