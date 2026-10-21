---
tags:
  - notes
---

transforms move, rotate, scale, or skew an element **without touching the layout around it** — nothing else on the page shifts because of the transform.

the slide showing the transform functions table:

![[Pasted image 20260728073824.png]]

in the wild — my buttons tilt on hover:

```css
.button:hover {
	transform: rotate(-10deg);
}
```

# See also
- [[Pseudo classes]] — the `:hover` doing the triggering
- [[CSS transitions]] — makes the tilt animated instead of instant
