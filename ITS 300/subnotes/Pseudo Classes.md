a keyword added to a selector that **styles an element based on its specific state or condition** rather than its static position in the document tree

```css
/* Base button layout */
button {
  background-color: darkblue;
  color: white;
  transition: background-color 0.3s ease;
}

/* Color swap on hover */
button:hover {
  background-color: royalblue;
}

/* Shrink button effect while pressed down */
button:active {
  transform: scale(0.95);
}

```
