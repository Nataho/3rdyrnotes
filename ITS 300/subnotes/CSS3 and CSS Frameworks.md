---
tags:
  - notes
date: 2026-07-24
cssclasses:
  - wide
---

the css master note — what css is, how syntax works, and where every html element gets styled with it. css is a language used to specify the formatting of an html document. html gives the page its structure, css decides what everything looks like.

# CSS syntax
a css rule is built out of four pieces:

- **selector** — which element(s) to target: `h1`, `h2`, `p`, `div`, `.btn`, `#title`
- **declaration block** — the `{ }` that holds your declarations
- **property** — what you're changing (`color`, `font-size`, etc.)
- **value** — what you're changing it to (`color: blue`)

```css
h1 { color: blue; font-size: 12px; }
```

# [[types of selectors]]
how you grab the element(s) to style — by id, class, tag, attribute, or all of them at once. covered in detail in [[types of selectors]].

# Embedding a style
## external
style definitions live on their own file, embedded into the html document with the link tag.
```html
<link rel="stylesheet" href="file/loc">
```
## internal
```html
<head>
<style>
  .classname {}
</style>
</head>
```
## inline
```html
<h2 style="color:red;"></h2>
```

### the cascade
when more than one style targets the same element, the cascade decides who wins. priority order:

1. inline
2. internal
3. external
4. browser defaults

# [[CSS variables]]
- the `var()` function is used to insert the value of a css variable
- css variables can have a global or local scope
- to create a **global** variable, declare it inside the `:root` selector — `:root` matches the document's root element
- a css variable name must begin with `--`

```css
:root {
  --primary-color: red;
}

h1 {
  color: var(--primary-color);
}
```
full notes in [[CSS variables]], including a real palette from my own site.

# [[Measurement Units]]
the units of measurement used in css. the slide table is in [[Measurement Units]].

# [[CSS box model]]
a box that wraps around every html element — content, padding, border, margin.

# [[CSS background properties]]
background properties of elements.

# [[CSS transforms]]
> [!todo] to do
> add the css transforms table from the lecture.

# [[CSS transitions]]
> [!todo] to do
> add the css transition properties. [[CSS transitions]] is still a stub.

# CSS animation
there's a proper css animation route too, but doing it the manual way is not advisable — you place every movement by hand instead of letting keyframes do the in-betweens.

# [[Pseudo classes]]
used to define a state of an element — hover, active, focus and friends. detail and examples in [[Pseudo classes]].

```css
selector:pseudo-class { color: white; }

h2:first-child {
  color: red;
}
```

# viewport
the viewport tag tells a mobile browser to treat the screen width as the actual width, instead of pretending it's a desktop and zooming out. responsive styling ([[media types|media queries]]) depends on it.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

# [[media types]]
- `all` — used for all media types and devices
- `print` — used for printers
- **`screen`** — used for computer screens, tablets, smartphones
- `speech` — used for screen readers that "read" the page out loud

syntax:
```css
@media [media type] and (min-width) and (max-width) {
}
```

```css
@media screen and (min-width: 400px) {
}
```

the full guide lives in [[media types]].

# CSS frameworks
## bootstrap 5 (component-first)
- gives you pre-built components out of the box
- used for prototyping and generic websites

## tailwind css 4.3 (utility-first)
- used for complex and customizable elements and components

# See also
- [[Client-Side Scripting]] — the javascript that hooks into everything above
- [[php and database]] — what happens on the other side of the form
- [[Pseudo classes]] — element states, where hover lives
