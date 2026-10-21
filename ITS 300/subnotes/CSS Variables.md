---
tags:
  - notes
---

css variables store a value once and reuse it everywhere. define them with `--name`, drop them in with `var(--name)`. change the variable once, and every place using it updates with it.

- global variables are declared inside `:root` (the document's root element)
- local ones can be declared inside any other selector
- the name must begin with `--`

```css
:root {
  --primary-color: red;
}

h1 {
  color: var(--primary-color);
}
```

# the real thing, from my site
below is the actual palette and header styling from my website — every color lives in a variable up top, so a re-theme means changing four lines, not forty.

```css
@import url('https://cdn.jsdelivr.net/npm/@fontsource/adwaita-mono@5.0.0/index.css');

:root {
	--palette-darker: #321E48;
    --palette-dark: #43637E;
    --palette-light: #65DCD5;
    --palette-lighter: #D9FFF4;
    --transparent-darker: #0000003F; /* 25% transparent black */
}

html {
    scroll-behavior: smooth;
}

body {
    background-color: var(--palette-darker);
    font-family: 'Adwaita Mono', monospace;
    margin: 0;
    padding: 20px;
}

header {
    background-color: var(--transparent-darker);
    border-radius: 20px;
    padding: 40px;
    
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

nav {
    font-family: inherit;
    margin-top: 20px;
}

p {
    color: var(--palette-lighter);
}

h1 {
    font-size: 2.5em;
    color: var(--palette-light);
    margin: 0;
}

.heading-text{
    flex: 1;
}

.heading-nav {
    background-color: var(--palette-dark);
    font-size: 20px;
    padding: 10px 20px;
    display: inline-block;
    text-decoration: none;
    border-radius: 20px;
    color: var(--palette-darker);
    transition: background-color 0.2s ease; /* Smooth hover transition */
}

.heading-nav:hover {
    background-color: var(--palette-light);
}

.heading-img {
    width: 250px;
    height: auto;
    object-fit: cover; /* Keeps image from stretching */
    flex-shrink: 0;
    border-radius: 10px;

    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 40%);
    mask-image: linear-gradient(to right, transparent 0%, black 40%);
}
```

what to look at:
- the `--palette-*` names keep the four shades sorted from darker → lighter, so you don't have to remember the hexes
- `--transparent-darker` is a hex with an alpha channel — `3F` = 25% transparent black
- `mask-image` fades the right edge of the header image out with a gradient, so it blends into the background instead of ending as a hard box
- `.heading-nav:hover` — the hover part is a [[Pseudo classes|pseudo class]]; the transition makes the swap smooth

# See also
- [[CSS3 and CSS Frameworks]] — the master css note this belongs to
- [[Pseudo classes]] — the `:hover` used above
- [[Measurement Units]] — the `2.5em`, `250px` and friends used above
