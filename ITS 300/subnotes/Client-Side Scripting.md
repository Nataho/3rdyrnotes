How Javascript turns a static page into an interactive one - reading, changing, creating, and removing page content, and responding to what the user does.

1. [[Client-Side Script]]
2. [[The DOM]]
3. [[Dom Manipulation]]
4. [[Events]]
5. [[Building a modal]]
6. [[Implementation Steps]]


```javascript
document.getElementByID("main-title");
document.getElementsByClassName("description").innerHTML = "wow"; only gets one
document.querySelectorAll(".btn"); gets multiple
```

# Change Content
```javascript
const test_var = document.getElementByid("testing");
test_var.textContent = "text";
test_var.innerHTML = <h1>text<\h1>
```

# Create and remove
```js
const li = document.createElement
```

# Events
```js
modal.addEventListener("click", (e) => {
	if (e.target == myModal){
	closeModal();
	}
});
modal.addEventListener("keydown", (e) => {
	if (e.key == "escape"){
	closeModal();
	}
});
```


---
# Client-Side Scripting: DOM Manipulation & Events

> **Course:** Web Development 1 (IT 3rd Year)  
> **Topic:** Client-Side Scripting, DOM Manipulation, and Event Handling in JavaScript

---

## 1. Client-Side Scripting Overview

### What Is Client-Side Scripting?
Client-side scripting is code—almost always **JavaScript**—that runs inside the user's web browser after the web page has been downloaded, rather than on the web server.

It enables interactive web features such as:
- Validating form inputs before submission
- Updating page content dynamically
- Animating elements
- Responding to user clicks and keystrokes instantly without page reloads

### Client-Side vs. Server-Side

| Feature | Client-Side | Server-Side |
| :--- | :--- | :--- |
| **Runs On** | The user's browser | The web server |
| **Languages** | JavaScript | PHP, Python, Java, Node.js, C#, etc. |
| **Triggers** | Page loads, clicks, input, key presses | HTTP requests |
| **Speed** | Instant, no page reloads | Depends on network latency |
| **Access** | Only data sent to the browser | Databases, server files, secret keys |
| **Example Use** | Form validation, DOM updates, UI animations | User login authentication, saving to database |

### The Three Pillars of Web Development
- **HTML:** Defines the **Structure** of the web page.
- **CSS:** Defines the **Presentation** and styling.
- **JavaScript:** Controls the **Behavior** and interactivity.

---

## 2. The Document Object Model (DOM)

### What Is the DOM?
The **Document Object Model (DOM)** is the browser's live, in-memory object representation of an HTML document. When a browser loads HTML, it converts every tag into an **object** arranged in a hierarchical tree structure.

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

### Node Types in the DOM Tree
- **Document Node:** The root node representing the entire web page (`document`).
- **Element Nodes:** HTML tags like `<html>`, `<body>`, `<h1>`, `<p>`, `<button>`.
- **Container Nodes:** Elements containing nested tags.
- **Text Nodes:** The actual text content inside tags (e.g., `"Hello!"`).

> [!NOTE] Key Concept
> **HTML** is what the server sends once. The **DOM** is what the browser maintains and updates live. Modifying the DOM instantly updates what is displayed on the screen.

---

## 3. DOM Manipulation

### Step 1: Selecting Elements

Before JavaScript can modify or read an element, it must first locate it in the DOM tree.

#### Selection Methods

1. `document.getElementById("idName")`
   - **Description:** Finds the single element with the specified ID.
   - **Returns:** A single `Element` object, or `null` if not found.
   - **Best for:** Fast, direct selection when an ID is known.

2. `document.querySelector("cssSelector")`
   - **Description:** Finds the **first** element that matches any CSS selector (e.g., `.class`, `#id`, `tag`).
   - **Returns:** The first matching `Element`, or `null`.

3. `document.querySelectorAll("cssSelector")`
   - **Description:** Finds **all** elements matching the given CSS selector.
   - **Returns:** A `NodeList` (a list-like collection of elements).

```javascript
// Selecting elements by ID, class, and query selector
const mainTitle = document.getElementById("main-title");
const primaryBtn = document.querySelector(".btn");
const allNotes = document.querySelectorAll(".note");

// Checking selections in the browser DevTools console
console.log(mainTitle);
```

---

### Step 2: Changing Content

JavaScript provides two main properties to alter element content:

- `textContent`: Gets or sets plain text. It does **not** parse HTML tags, making it fast and safe from cross-site scripting (XSS) attacks.
- `innerHTML`: Gets or sets HTML markup inside an element. It parses HTML tags.

> [!WARNING] Security Caution
> Avoid assigning un-sanitized user inputs directly to `innerHTML` as it opens vulnerability vectors for Cross-Site Scripting (XSS). Use `textContent` for plain text.

```html
<!-- HTML -->
<h1 id="title">Old Heading</h1>
<div id="box"></div>
```

```javascript
// JavaScript
const title = document.getElementById("title");
const box = document.getElementById("box");

// Safely updating text
title.textContent = "Welcome Back!";

// Updating with HTML markup
box.innerHTML = "<strong>Loaded</strong> successfully";
```

---

### Step 3: Changing Styles & Attributes

You can dynamically update an element's inline styles, attributes, or CSS classes.

| Method / Property | Usage | Description |
| :--- | :--- | :--- |
| `element.style.propertyName` | `box.style.color = "red";` | Sets inline CSS directly (uses camelCase like `backgroundColor`). |
| `element.setAttribute(name, value)` | `img.setAttribute("src", "a.png");` | Sets or updates any HTML attribute. |
| `element.classList.add("className")` | `box.classList.add("active");` | Adds a CSS class (preferred way to restyle via stylesheets). |

```html
<!-- HTML -->
<p id="msg">Status</p>

/* CSS */
.active {
  color: green;
  font-weight: bold;
}
```

```javascript
// JavaScript
const msg = document.getElementById("msg");

// Add CSS class and set hover attribute
msg.classList.add("active");
msg.setAttribute("title", "Saved successfully");
```

---

### Step 4: Creating & Removing Elements

JavaScript allows you to build new DOM elements from scratch and remove existing ones.

- `document.createElement("tagName")`: Instantiates a new element in memory.
- `parentElement.appendChild(childElement)`: Appends the element as the last child of a parent.
- `element.remove()`: Deletes an element directly from the DOM tree.

```html
<!-- HTML -->
<ul id="list">
  <li id="temp">Temporary Item</li>
</ul>
```

```javascript
// JavaScript
const list = document.getElementById("list");

// 1. Create a new <li> element
const newLi = document.createElement("li");
newLi.textContent = "Fresh Milk";

// 2. Append it to the list container
list.appendChild(newLi);

// 3. Remove an old element
const tempItem = document.getElementById("temp");
tempItem.remove();
```

---

## 4. DOM Events & Event Handling

### What Is an Event?
An **event** is a signal sent by the browser indicating that an action has occurred—such as a user clicking a button, typing in an input field, scrolling the page, or the page finishing loading.

### The Event-Driven Lifecycle
1. **User Action:** User clicks, types, or scrolls.
2. **Event Fires:** The browser emits an event signal (e.g., `"click"`).
3. **Listener Catches It:** `addEventListener()` intercepts the event.
4. **Handler Runs:** The associated callback function executes.

---

### Handling Events with `addEventListener()`

Modern JavaScript uses `addEventListener()` to bind event handlers to DOM elements.

```javascript
// Syntax
element.addEventListener("eventType", function(event) {
    // Handler code executed when event triggers
});
```

#### Why `addEventListener()` instead of inline `onclick` attributes?
- Separates JavaScript behavior from HTML markup.
- Allows attaching multiple event listeners to the same element without overwriting existing ones.

---

### Interactive Example: Counter Button

```html
<!-- HTML -->
<button id="likeBtn">♡ Like</button>
<p id="count">0 likes</p>
```

```javascript
// JavaScript
const btn = document.getElementById("likeBtn");
const count = document.getElementById("count");

let likes = 0;

btn.addEventListener("click", () => {
    likes++;
    count.textContent = `${likes} likes`;
});
```

---

### Common DOM Event Types

| Event Type | Triggers When... | Common Target Elements |
| :--- | :--- | :--- |
| `click` | User clicks/taps an element | `button`, `a`, `div` |
| `dblclick` | User double-clicks rapidly | `img`, `canvas` |
| `mouseover` / `mouseout` | Pointer enters or leaves element bounds | Cards, menu items, `div` |
| `keydown` / `keyup` | Keyboard key is pressed down or released | `input`, `textarea`, `document` |
| `input` | Value of input change on every keystroke | `input`, `textarea` |
| `change` | Form input value is committed / loses focus | `select`, `checkbox`, `radio` |
| `submit` | Form is submitted | `form` |
| `load` | Page or resource finishes loading | `window`, `img` |
| `scroll` | User scrolls element or page | `window`, `div` |

> [!TIP]
> Always pass event names as plain lower-case strings without the `"on"` prefix (e.g., `"click"`, `"submit"`, `"input"`).

---

### The Event Object (`e`) & `preventDefault()`

When an event handler runs, the browser automatically passes an **Event object** (`e` or `event`) containing details about what happened.

#### Key Event Properties & Methods
- `e.target`: References the exact element where the event originated.
- `e.preventDefault()`: Cancels default browser behavior (such as page reloads on form submission or link navigation).

```html
<!-- HTML -->
<form id="signup">
  <input type="email" id="email" placeholder="Enter email" />
  <button type="submit">Sign Up</button>
</form>
```

```javascript
// JavaScript
const form = document.getElementById("signup");

form.addEventListener("submit", (e) => {
    // Prevent the default browser page reload
    e.preventDefault();
    
    console.log("Form target element:", e.target);
    alert("Thanks for signing up!");
});
```

---

## 5. Mini Project: Interactive To-Do List

Combining element selection, event handling, DOM element creation, and resetting values:

```html
<!-- HTML -->
<input id="taskInput" placeholder="Enter new task..." />
<button id="addBtn">Add Task</button>
<ul id="taskList"></ul>
```

```javascript
// JavaScript
const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("taskList");

addBtn.addEventListener("click", () => {
    // 1. Validate input (ignore empty or whitespace-only text)
    if (input.value.trim() === "") return;

    // 2. Create new <li> element
    const li = document.createElement("li");
    li.textContent = input.value;

    // 3. Append to list
    list.appendChild(li);

    // 4. Reset input field
    input.value = "";
});
```

### Execution Flow:
1. **Select:** Input, button, and list references are saved upfront.
2. **Listen:** Click event attached to the button.
3. **Validate:** `trim()` checks for empty inputs.
4. **Create:** New `<li>` node built with text from input.
5. **Insert:** `appendChild()` puts the new item at the end of `<ul>`.
6. **Reset:** Input field cleared for next entry.

---

## 6. Implementation Workflow in Web Projects

1. **Structure HTML:** Create markup and assign clean, descriptive `id` or `class` attributes to interactive elements.
2. **Link Script:** Embed script with `<script src="app.js" defer></script>` before `</body>` or in `<head>` with `defer`.
3. **Select Elements:** At top of JavaScript file, query DOM elements.
4. **Attach Event Listeners:** Register `addEventListener()` for user actions.
5. **Manipulate DOM:** Inside event callbacks, update text, styles, or add/remove nodes.
6. **Test & Debug:** Use Browser Developer Tools (F12) Console and Elements panels.

---

## 7. Building UI Components: Modal Pattern

A **modal** is a dialog box sitting on top of page content over a backdrop. Instead of creating complex elements on the fly, modals are usually pre-built in HTML/CSS and toggled using CSS classes via JavaScript.

### Modal HTML & CSS Setup

```html
<!-- Modal HTML Structure -->
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
/* Modal CSS Styles */
.modal-overlay {
  display: none; /* Hidden by default */
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-overlay.open {
  display: flex; /* Displayed when 'open' class is added */
  align-items: center;
  justify-content: center;
}
```

### Complete Modal JavaScript Implementation

```javascript
const openBtn = document.getElementById("openBtn");
const modal = document.getElementById("myModal");
const closeBtn = modal.querySelector(".close");

// 1. Open modal on button click
openBtn.addEventListener("click", () => {
    modal.classList.add("open");
});

// 2. Close modal on close button click
closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
});

// 3. Close modal when clicking the backdrop overlay
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("open");
    }
});

// 4. Close modal on Escape key press
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        modal.classList.remove("open");
    }
});
```

### Code Explanation:
- `modal.querySelector(".close")`: Scopes the search specifically inside the modal container.
- `e.target === modal`: Ensures the modal closes only when clicking the backdrop overlay directly, not when clicking inside the content box.
- `e.key === "Escape"`: Listens on the global `document` so pressing Escape works regardless of where keyboard focus currently sits.
- `classList.add()` / `classList.remove()`: Explicitly manages visual state cleanly.

---

## 8. Summary & Key Takeaways

- **Client-Side Scripting** runs in the browser, providing instant interactive feedback without server requests.
- The **DOM** is a dynamic live object tree representing your page HTML.
- **Select** elements with `getElementById()` or `querySelector()`.
- **Modify** content using `textContent` (plain text) or `innerHTML` (HTML markup).
- **Style** elements with `style`, `setAttribute()`, or `classList`.
- **Create/Delete** elements using `createElement()`, `appendChild()`, and `remove()`.
- **Handle Events** with `element.addEventListener("type", handler)` (avoid inline HTML handlers).
- Build interactive UI components (modals, dropdowns, tooltips) by toggling CSS state classes in response to user actions.

