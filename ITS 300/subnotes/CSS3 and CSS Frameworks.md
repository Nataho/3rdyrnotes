---
tags:
  - notes
date: 2026-07-24
cssclasses:
  - wide
---
# What is CSS
- is a language used to specify the formatting of an HTML document

# [[CSS Syntax]]
- Selector `h1, h, p, div, head`
- Declaration block `{}`
- Property `color, font-size, etc`
- Value `color:blue`
- `h1 {color:blue; font-size:12px}`

>

# [[types of selectors]]
# Embedding a style
## external
style definitions are defined on an external file
embedded to an HTML document using the link tag
```HTML
<link rel="stylesheet" href="file/loc">
```
## internal
```html
<head>
<style>
.classname{}
</style>
</head>
```
## inline
```html
<h2 style="color:red;"></h2>
```

### extra
there is a cascading thing if there is no other styles
1st inline
2nd internal
3rd external
browser defaults

# [[CSS Variables]]
the var() function is used to insert the value of CSS variable
CSS variables can have a global or local scope
To create a global variable, declare it inside the :root selector, the :root selector matches the document's root element.
A CSS variable name must begin with `--` 
```css
:root{
--primary-color:red;
}

h1{
color:var(--primary-color)
}
```

# [[Measurement Units]]
Are the units of measurements used in css

# [[CSS Box Model]]
a box that wraps around every HTML element

# [[CSS Background Properties]]
Background properties of elements

# [[CSS Transforms]]
ADDME - add css transforms table

# [[CSS Transitions]]
ADDME - add css transition properties

# [[CSS Animation]]
this is a manual animation
not advisable

# [[Pseudo Classes]]
is used to define a state of an element
```css
selector:pseudo-classes{color:white}

h2:first_child{
color:red
}
```


# viewport

# [[media types]]
All - All used for all media types devices
Print - used for printers
**Screen** - used for computer screens, tablets, smartphones
Speesh - used for screen readers that "reads" the page out loud

```
@media [type of media] and (minimum) and (maximum)
```

``` CSS
@media screen and (min-width:400px){
}
```


# [[CSS Frameworks]]
## Bootstrap 5 (Component first)
- it gives you pre-built components out of the box
- used for prototyping and generic websites
## Tailwind CSS 4.3 (Utility first)
- used for complex and customizable elements and components.