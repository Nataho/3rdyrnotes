---
tags:
  - notes
---

a pseudo class is a keyword added to a selector that **styles an element based on its specific state or condition**, rather than its static position in the document tree.

the classic one — a button that reacts when you hover it:

```css
/* base button layout */
button {
  background-color: darkblue;
  color: white;
  transition: background-color 0.3s ease;
}

/* color swap while hovered */
button:hover {
  background-color: royalblue;
}

/* shrink button effect while pressed down */
button:active {
  transform: scale(0.95);
}
```

# the usual suspects
| pseudo class | styles the element while... |
| :--- | :--- |
| `:hover` | the pointer is over it |
| `:active` | it is being pressed down |
| `:focus` | it is selected (clicked or tabbed to) |
| `:first-child` | it is the first child of its parent |
| `:last-child` | it is the last child of its parent |
| `:checked` | a checkbox / radio is on |
| `:visited` | a link has already been visited |

# See also
- [[types of selectors]] — the thing pseudo classes attach themselves to
- [[CSS transitions]] — makes the hover change smooth instead of an instant snap
- [[CSS transforms]] — what `scale(0.95)` up there is from
