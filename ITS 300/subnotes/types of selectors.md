---
tags:
  - notes
---

selectors are how you tell css **which** element(s) to style. same declarations, different targets.

## ID selector
use the id selector whenever you only need **one** element to be edited by css. prefix: `#`

```html
<!-- correct — one element, one id -->
<h2 id="about_me"></h2>

<!-- wrong — dili pwede kaduha, ID is unique. (an id must appear only once per page) -->
<h3 id="about_me"></h3>
```

## Class selector
use the class selector when you want **multiple elements** to update when one class is edited. prefix: `.`

```html
<h4 class="this_class"></h4>
<h2 class="this_class"></h2>
<body class="two_times"></body>
```
the same class can sit on as many tags as you want — that's the point of it.

```css
#about_me {}            /* singular — only grabs the one id */

.this_class {           /* grabs every tag wearing this class */
  font-size: 40px;
}

.two_times {
  scale: 2em;
}
```

## Element selector
uses the tag name and automatically sets every instance of it on the page:

```css
h2 {
  /* every <h2>, no id or class needed */
}
```

## Attribute selector
grabs elements that carry a specific attribute:

```css
input[type] {
  /* any <input> that has a type attribute at all */
}
```

## Grouping selector
stack any other kind of selector together with commas — they all receive the same declarations:

```css
.this, h1, h2 {}
```

## Universal selector
targets everything on the page:

```css
* {}
```
