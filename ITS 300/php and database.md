---
tags:
  - notes
cssclasses:
  - wide
---

PHP talking to a database — the part that makes a website actually *work*. get data from the user, validate it, clean it, then save it to the database through PDO. that's basically every account system ever built.

# Getting data from the user
php grabs submitted form data through two built-ins — the difference is **how** it travels, not whether you can use it:

- **`$_GET`** — data rides along in the URL (`?name=Owen`). visible in the address bar, bookmark-able. fine for searches and filters, never for passwords.
- **`$_POST`** — data travels hidden inside the request body. this is the one for logins, form submissions, saving stuff.

```html
<!-- form jumps into $_GET -->
<form method="get" action="search.php">
  <input name="query">
  <button>Search</button>
</form>

<!-- form jumps into $_POST -->
<form method="post" action="signup.php">
  <input type="password" name="password">
  <button>Sign Up</button>
</form>
```

```php
$name = $_POST['name'];    // one array per method
$pass = $_POST['password'];
```

# Core validation techniques
the four checks every field should get:

- **required** — empty? reject. `trim()` + `empty()` are the tools here
- **type/format** — an email has to actually look like an email
- **length/range** — time to enforce a minimum, a maximum, or range
- **pattern** — regex for the weird formats (phone numbers, student IDs)

```php
// 1. required — reject empty
if (empty(trim($_POST['name']))) {
    $errors[] = "Name is required";
}

// 2. type/format
if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = "That email looks fake";
}

// 3. length/range
if (strlen($_POST['name']) < 2 || strlen($_POST['name']) > 50) {
    $errors[] = "Name must be 2–50 characters";
}

// 4. pattern — digits only
if (!preg_match('/^[0-9]+$/', $_POST['phone'])) {
    $errors[] = "Phone must be digits only";
}
```

# Sanitation and filter functions
validate decides if a value is *acceptable*. sanitize *cleans* it up. a good form does both. plus `htmlspecialchars()` before printing user input back onto a page so nobody injects HTML at your users.

Great helpers to know:
- `trim()` — strips whitespace from both ends
- `htmlspecialchars()` — converts special chars safely, for when you print input back out (a note in the server-side armor against XSS)
- `strip_tags()` — removes tags entirely
- `filter_var()` — validate or sanitize in one shot, just tell it what you're checking

```php
$dirty = "   user@example.com   ";

$email = trim($dirty);                                       // 1. trim the edges
$email = filter_var($email, FILTER_SANITIZE_EMAIL);          // 2. clean it
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {             // 3. now check it
    // good to go
}

// when you print it back out on a page:
echo htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
```

# Connecting with PDO
**PDO = PHP Data Objects** — the standard way for PHP to talk to a database. set it up like this:

1. create a `database` folder (yes, folder literally named `database` in your project)
2. inside it, create a `config.php`

the four variables every connection needs:

| variable | means |
| :--- | :--- |
| `$host` | ip of the host (`127.0.0.1` while developing on your machine) |
| `$db` | the database name |
| `$user` | username of the host-account |
| `$password` | the host account's password |

`database/config.php`:

```php
<?php
$host = "127.0.0.1";
$db = "webdev-db";
$user = "root";
$password = "root";

// DSN — one string that says: server, database, charset
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

$pdo = new PDO($dsn, $user, $password);

// shout at me when something breaks — exceptions over silence
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
?>
```

what's happening:
- the **DSN** (Data Source Name) is the connection address built in one string: `mysql:host=...;dbname=...;charset=...`
- `charset=utf8mb4` — so emojis and weird characters don't crash your queries
- `ERRMODE_EXCEPTION` — PDO fails loudly with exceptions instead of shutting up, which makes debugging way easier

use it from any page:

```php
require 'database/config.php';

$stmt = $pdo->query("SELECT * FROM products");
$products = $stmt->fetchAll();

foreach ($products as $row) {
    echo htmlspecialchars($row['name']);
}
```

> [!note] heads up
> two different `config.php` files exist in this course and they do different jobs: this one (in `database/`) handles the **database connection**, while the one from [[Personal Techniques]] handles **.urls and paths**. both at the same time. i know. it confused me for a bit too lmao

# See also
- [[Personal Techniques]] — reusing the html around your php cleanly
- [[Docker]] — running MySQL/‌phpMyAdmin in containers instead of installing locally
- [[Midterm Website]] — where all of this actually gets used
- [[Symfony]] — the framework that wraps a lot of this for you
