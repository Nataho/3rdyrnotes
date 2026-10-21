---
tags:
  - notes
---

# CSS3 @media Queries Guide

Media queries (`@media`) in CSS3 allow you to apply specific styles based on a device's characteristics—such as screen width, height, orientation, or user preferences like dark mode. 

They are the foundation of **responsive web design**, ensuring your site looks great on smartphones, tablets, and desktop displays alike.

---

## 1. Don't Forget the Viewport Tag First
Before `@media` queries will work properly on mobile devices, you **must** include this `<meta>` tag inside your HTML `<head>` section:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

> [!NOTE]
> Without this, mobile browsers will pretend they are desktop browsers and zoom out, breaking your responsive layouts.

---

## 2. Basic Syntax

A media query consists of a **media type**, optional **logical operators**, and **media features** inside parentheses:

```css
@media media-type and (media-feature) {
  /* CSS rules go here */
}
```

* **Media Types:** `screen` (computer/phone screens), `print` (print preview/paper), `all` (default for all devices).
* **Media Features:** `min-width`, `max-width`, `orientation`, `prefers-color-scheme`, etc.

---

## 3. How to Structure Media Queries

### Approach A: Mobile-First (Recommended)
Write base styles for mobile screens first, then use `min-width` queries to add or adjust styles as the screen gets wider.

```css
/* Base styles (Mobile) */
.container {
  width: 100%;
  padding: 10px;
}

/* Tablet and larger (768px and up) */
@media screen and (min-width: 768px) {
  .container {
    width: 80%;
    padding: 20px;
  }
}

/* Desktop and larger (1024px and up) */
@media screen and (min-width: 1024px) {
  .container {
    width: 1200px;
    margin: 0 auto;
  }
}
```

### Approach B: Desktop-First
Write base styles for large screens first, then use `max-width` queries to adjust styles as the viewport shrinks.

```css
/* Base styles (Desktop) */
.sidebar {
  width: 300px;
  float: left;
}

/* Mobile (767px or smaller) */
@media screen and (max-width: 767px) {
  .sidebar {
    width: 100%;
    float: none;
  }
}
```

---

## 4. Common Breakpoint Quick Reference

While exact breakpoints depend on your design, these industry standards are a great starting point:

| Device Category | Recommended Breakpoint | Example Query |
| :--- | :--- | :--- |
| **Small Phones** | `< 480px` | Default (Mobile-first base styles) |
| **Mobiles / Small Tablets** | `481px – 768px` | `@media (min-width: 481px)` |
| **Tablets / Small Laptops** | `769px – 1024px` | `@media (min-width: 769px)` |
| **Desktops** | `1025px – 1200px` | `@media (min-width: 1025px)` |
| **Large Screens / TV** | `> 1200px` | `@media (min-width: 1201px)` |

---

## 5. Useful Advanced Examples

### Combining Conditions (`and`, `,`)
* Use `and` to combine rules:
  ```css
  /* Applies only if screen is between 600px and 900px */
  @media screen and (min-width: 600px) and (max-width: 900px) {
    body { background-color: lightblue; }
  }
  ```
* Use a comma `,` to act as an `OR` operator:
  ```css
  /* Applies if screen is in landscape OR width is at least 1200px */
  @media (orientation: landscape), (min-width: 1200px) {
    .hero { height: 100vh; }
  }
  ```

### Modern Feature Queries
* **Dark Mode Preference:**
  ```css
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #121212;
      color: #ffffff;
    }
  }
  ```
* **Print Styles:**
  ```css
  @media print {
    .no-print { display: none; }
    body { color: #000; }
  }
  ```

---

# See also
- [[CSS3 and CSS Frameworks]] — the master css note this sits inside
- [[Measurement Units]] — px, em, rem — what the breakpoints are made of
- [[CSS Variables]] — keeping palettes consistent across breakpoints