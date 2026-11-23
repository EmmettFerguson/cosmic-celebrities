---
title: Cosmic Celebrities
deck: [One-sentence deck: what makes an object in space famous, and how the group measured it.]
byline: By Elinor Tu, Maya Dixit, Emmett Ferguson, Saanvi Movva, Sophia Wang · Cornell Data Journal
kicker: THE SUN · START HERE
---

### How to read this piece

Why are things popular? Is it a bright color, unique shape, striking portrait, or some intangible hook that attracts us? We may define beauty differently, but despite our preferences, do we tend to chase patterns—the same properties, the same views—that reveal common inclinations in our perception?

We hope to unravel the mysteries shrouding popularity through astronomy. From ancient star charts to the night sky above rural scapes, the universe has encapsulated us with its stunning colors, dramatic appearances, and beautiful forms; astronomy's unwavering popularity and awe striking beauty inspired us to understand: how is the popularity of astronomical objects impacted? Are there patterns in these impacts? What makes an object perpetually popular? What causes extreme spikes in popularity? 

Popularity is complicated, though; how do you measure what is popular? How do you sift through objects routinely boasting thousands of views to ones with momentary spotlights? What do people actually see; is it different from what we think they see? Objects like the The Lemon Slice Nebula, which was named after a discolored image, has two views depending on which imaging technique is used, its viewcounts spiked by over 200% on a random Wednesday, and its name is much more cohesive than another nebula like NGC 1999. So how should we measure its popularity? 

We sought out our answers through quantifying popularities across time and analyzing how properties, events, and media impacted various objects’ viewcounts. We quantified popularity through the number of views an object’s Wikipedia page received through pageview analytics [[View | Which we may denote as 'veiws' through the rest of the article]], analyzing the frequency, consistency, and spikes in viewcounts over a span of several years. Our investigation initially focused on discovering if assigned characteristics and natural attributes affected the popularity of an object, considering tangible factors: did image coloring, object names, or physical properties impact celestial popularity?

We later guided our research through less tangible factors. Through manually selecting Science Olympiad seasons [[Science Olympiad | Science Olympiad is a grade school competition where students compete in events centered around scientific fields of study, such as astronomy.]]
, graphs for objects with ‘spikes,’ [[Spikes|We defined an object with a ‘spike’ to be an object whose view count surged by over 250% in one week
]]  and Social Media posts we tried to decipher which types of events or content bolstered popularity and why.

Our research routinely increased in complexity—every one explanation had exceptions or contradictions. Many trends we considered subverted our expectations. Many objects did not have large enough view pools to pull from—and we ultimately uncovered that no one factor can determine the popularity of an object. Rather, it was the combination of scientific events, physical anomalies, and social spotlights that culminated into the complicated science of celestial popularity.



In the Markdown file, write two opening square brackets, the term, a vertical bar, the note, then two closing square brackets (see README). Notes can include **formatting** and [links](https://science.nasa.gov/sun/).]] opens a footnote when you click it.

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
