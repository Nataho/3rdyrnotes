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
## [[ID Selector]]
use the selector whenever you only need one element to be edited by css
```HTML
---how to create ID---
<h2 id="about_me"> </h2>
<h3 id="about_me"> </h3> %% dili pwede kaduha, ID is unique %%
<h4 id = "this_class"> </h4>

```
```
```
## [[Class Selector]]
use `<h2 class:"classname">` when you want multiple elements to update when one class is edited
```CSS
#about_me: { %% singular %%
}
.this_class {
%% multiple %%
}
```

## [[Element Selector]]
``` CSS
h2{
/* uses the tag and automatically sets */
}
```

## [[attribute selector]]
```CSS
input[type]{
}
```

## [[Grouping Selector]]
can add any other kind of selector
```CSS
.this,h1,h2{

}
```

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
ADDME - TABLE

# [[CSS Box Model]]
ADDME - download and attach the CSS box model

# [[CSS Background Properties]]
ADDME - table for background properties

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