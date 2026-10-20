---
tags:
  - notes
cssclasses:
  - wide
---

JavaScript is what turns a static page into an actually interactive one — reading, changing, creating, and removing page content, and reacting to whatever the user does. and the best part: all of that happens live, in the browser, with zero page reloads.

# Client-Side vs Server-Side
quick before anything else — "client side" just means it runs in the *user's browser*, not on the server.

| | Client-Side | Server-Side |
| :--- | :--- | :--- |
| **runs on** | the user's browser | the web server |
| **language** | JavaScript | PHP (and its friends) |
| **what triggers it** | clicks, typing, scrolling | HTTP requests |
| **speed** | instant, no reload | whatever the network gives you |
| **access** | only what's already in the page | databases, server files, secrets |
| **typical use** | form validation, UI, animations | login, saving to the database |

the three pillars, in one line each:
- **HTML** — the structure
- **CSS** — the looks
- **JavaScript** — the behavior

# The DOM
when the browser loads your HTML, it doesn't keep the file as-is. it turns every single tag into an **object** and arranges them into a tree. that tree is the **DOM** — the Document Object Model. it's a live version of your page that JavaScript can touch, and when you change the DOM, the screen updates instantly.

```
                  document
                     |
                   <html>
                 /        \
            <head>        <body>
                          /  |  \
                      <h1>  <p>  <button>
                       |
                   "Hello!"
```

### the node types
- **document node** — the root, it IS the whole page (`document`)
- **element nodes** — the actual tags (`<html>`, `<body>`, `<h1>`, `<p>`, `<button>`)
- **container nodes** — elements that hold other elements
- **text nodes** — the text inside the tags (`"Hello!"`)

> [!note] key idea
> HTML is what the server sends **once**. the DOM is what the browser keeps updating **live**. modify the DOM and the page changes on the spot.

# DOM manipulation
basically the whole day's lesson in 4 steps: select → change → style → create/remove.

## selecting elements
before JavaScript can do anything to an element, it has to find it first.

| method | what it does | returns |
| :--- | :--- | :--- |
| `document.getElementById("idName")` | finds the one element with that ID | single element, or `null` |
| `document.querySelector(".btn")` | finds the **first** match of any CSS selector | single element, or `null` |
| `document.querySelectorAll(".btn")` | finds **all** matches | a `NodeList` (basically a list of elements) |

```js
// select by id, by css selector, and all of a kind
const mainTitle = document.getElementById("main-title");
const primaryBtn = document.querySelector(".btn");
const allNotes = document.querySelectorAll(".note");

// check yourself in the browser console (F12)
console.log(mainTitle);
```

> [!tip] quick note
> `getElementById` — "Id", not `getElementByID` or `getElementByid`. it's case sensitive and this typo will get you. also if you keep getting `null`, your selector spelled something wrong.

## changing content
two properties, two different jobs:
- **`textContent`** — plain text only. it does not parse HTML. fast, and safe.
- **`innerHTML`** — actually parses HTML tags. use it when you mean to put markup in, not for raw user input.

```html
<h1 id="title">Old Heading</h1>
<div id="box"></div>
```

```js
const title = document.getElementById("title");
const box = document.getElementById("box");

// plain text
title.textContent = "Welcome Back!";

// with markup
box.innerHTML = "<strong>Loaded</strong> successfully";
```

> [!warning] security — don't throw user input into `innerHTML`
> unsanitized user input straight into `innerHTML` = people can inject scripts into your page (XSS). if it's just text, use `textContent`.

## changing styles & attributes
| method / property | usage | what it does |
| :--- | :--- | :--- |
| `element.style.propertyName` | `box.style.color = "red";` | inline CSS, camelCase (`backgroundColor`) |
| `element.setAttribute(name, value)` | `img.setAttribute("src", "a.png");` | sets any HTML attribute |
| `element.classList.add("className")` | `box.classList.add("active");` | adds a CSS class — the cleanest way to restyle, since the actual look stays in your stylesheet |

```html
<p id="msg">Status</p>
```

```css
.active {
  color: green;
  font-weight: bold;
}
```

```js
const msg = document.getElementById("msg");

msg.classList.add("active");          // restyle through the class
msg.setAttribute("title", "Saved");   // any attribute
```

## creating and removing elements
```js
// 1. create a new element (in memory for now)
const newLi = document.createElement("li");
newLi.textContent = "Fresh Milk";

// 2. append it to a parent
const list = document.getElementById("list");
list.appendChild(newLi);

// 3. remove something else
document.getElementById("temp").remove();
```

- `document.createElement("tagName")` — makes a new element
- `parent.appendChild(child)` — puts it in as the last child
- `element.remove()` — deletes it from the tree

# Events
an **event** is a signal the browser fires when something happens: a click, a keypress, typing in a field, scroll, the page finishing load, all of it.

the lifecycle is short and sweet:
1. user does something (clicks, types, scrolls)
2. browser fires an event (`"click"`)
3. `addEventListener()` catches it
4. your handler function runs

## `addEventListener()`
```js
element.addEventListener("eventType", function (event) {
    // runs when the event fires
});
```

why this instead of inline `onclick` attributes?
- keeps JavaScript out of the HTML (behavior separate from markup)
- you can stack **multiple** listeners on one element without one overwriting the other

## example: like counter
```html
<button id="likeBtn">♡ Like</button>
<p id="count">0 likes</p>
```

```js
const btn = document.getElementById("likeBtn");
const count = document.getElementById("count");

let likes = 0;

btn.addEventListener("click", () => {
    likes++;
    count.textContent = `${likes} likes`;
});
```

## the common events
| event | fires when... | usually on |
| :--- | :--- | :--- |
| `click` | user clicks/taps | `button`, `a`, anything really |
| `dblclick` | double click | images, canvases |
| `mouseover` / `mouseout` | pointer enters / leaves | cards, menu items |
| `keydown` / `keyup` | key pressed / released | `input`, `document` |
| `input` | every keystroke changes the value | `input`, `textarea` |
| `change` | value committed / loses focus | `select`, `checkbox`, `radio` |
| `submit` | form submitted | `form` |
| `load` | page/resource finished loading | `window`, `img` |
| `scroll` | user scrolls | `window`, `div` |

> [!tip] callout tip
> event names are plain lowercase strings, **no `"on"` prefix**. it's `"click"`, `"submit"`, `"input"` — not `"onClick"`.

## the event object (`e`)
when a handler runs, the browser hands it an **event object** — everyone just names it `e`. the two you'll actually use:
- **`e.target`** — the exact element where the event happened
- **`e.preventDefault()`** — cancel the browser's default behavior (the big one: stopping forms from reloading the page)

```html
<form id="signup">
  <input type="email" id="email" placeholder="Enter email" />
  <button type="submit">Sign Up</button>
</form>
```

```js
const form = document.getElementById("signup");

form.addEventListener("submit", (e) => {
    e.preventDefault();              // no page reload
    console.log(e.target);           // the form itself
    alert("Thanks for signing up!");
});
```

# Mini project: to-do list
all of the above in one place — select, listen, validate, create, insert, reset.

```html
<input id="taskInput" placeholder="Enter new task..." />
<button id="addBtn">Add Task</button>
<ul id="taskList"></ul>
```

```js
const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("taskList");

addBtn.addEventListener("click", () => {
    if (input.value.trim() === "") return;   // reject empty input

    const li = document.createElement("li"); // 1. build the item
    li.textContent = input.value;            // 2. give it text
    list.appendChild(li);                    // 3. slot it at the end
    input.value = "";                        // 4. clear the field
});
```

the flow: select everything first, listen to the button, `trim()` guards empty input, `createElement` builds the `<li>`, `appendChild` inserts it, then the field is cleared and ready for the next one.

# Building a modal
the classic modal pattern. modals are almost never built from scratch at click-time — they're **pre-built** in HTML/CSS, hidden by default, and JavaScript just **toggles a class** to show them.

## the HTML + CSS
```html
<button id="openBtn">Open Modal</button>

<div class="modal-overlay" id="myModal">
  <div class="modal">
    <button class="close">&times;</button>
    <h2>Modal Title</h2>
    <p>Modal content goes here...</p>
  </div>
</div>
```

```css
.modal-overlay {
  display: none;              /* hidden by default */
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-overlay.open {
  display: flex;              /* shows up when .open is added */
  align-items: center;
  justify-content: center;
}
```

## the JavaScript
```js
const openBtn = document.getElementById("openBtn");
const modal = document.getElementById("myModal");
const closeBtn = modal.querySelector(".close");

// 1. open on the button
openBtn.addEventListener("click", () => {
    modal.classList.add("open");
});

// 2. close on the × button
closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
});

// 3. close when clicking the dark backdrop (make sure the click
//    is on the overlay itself, NOT inside the modal content)
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("open");
    }
});

// 4. close on Escape — listening on `document` so it works
//    no matter where keyboard focus currently is
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        modal.classList.remove("open");
    }
});
```

why each line works:
- `modal.querySelector(".close")` — searches **inside the modal only**, not the whole page
- `e.target === modal` — the backdrop click check. clicks inside the content box don't match, so the modal only closes when you click the outside area
- `e.key === "Escape"` on `document` — global keyboard escape hatch
- `classList.add()` / `classList.remove()` — the state lives in your CSS, JavaScript just flips it

# Implementation steps in a real project
1. **structure the HTML** — clean, descriptive `id`/`class` on everything interactive
2. **link the script** — `<script src="app.js" defer></script>` so the DOM exists before the script runs (works both in `<head>` with `defer` or before `</body>`)
3. **select your elements** — top of the JS file, all your queries together
4. **attach the listeners** — one per user action
5. **manipulate the DOM** — inside the callbacks: text, styles, classes, new elements
6. **test it** — devtools (F12): Console for errors, Elements panel to watch the DOM change live

# Summary
- client-side = runs in the browser, instant feedback, no server round trips
- the **DOM** is the live object tree of your page
- **select** with `getElementById()` / `querySelector()`
- **change content** with `textContent` (plain) or `innerHTML` (markup, trusted input only)
- **restyle** with `style`, `setAttribute()`, or best: toggle classes with `classList`
- **create / delete** with `createElement()`, `appendChild()`, `remove()`
- **react** with `element.addEventListener("click", handler)` — lowercase event names, never inline `onclick`
- modals and interactive UI = prebuilt HTML/CSS + class toggling
