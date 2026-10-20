---
tags:
  - notes
cssclasses:
  - wide
---


> [!WARNING] DISCLAIMER
>  **Everything in here is assuming you put your project in the root folder of your server.**
> 
> 
> 
> ## What if i put my project in a subfolder?
> assuming your subfolder is named `project`
> just add `project/` to everything mentioning `localhost/` or `yourwebsite.com/`
> 
> it should look like this
> `localhost/project/` and/or `yourwebsite.com/project/`

# Source Config Files
this file is named `config.php` and sits inside the root folder of your website

## What does it do?
It basically gives your entire workspace something to reference to so that doing back links like `../../` is not required.

## The Code (`config.php`) copy this if you like
``` php
<?php
// defining variables
$dir = str_replace('\\', '/', __DIR__);
$docRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']);

$web_path = str_replace($docRoot, '', $dir);

define('BASE_URL', $web_path . '/'); //project directory
define('ROOT_DIR', __DIR__ . '/');//php server directory
?>
```
this is the most basic config file i could think of
this is dynamic so if you put the project in subfolders, it would still work!

## What's the difference between `BASE_URL` and `ROOT_DIR`
the main difference between the two is how they reference files
### `BASE_URL`
- translates to `yourwebsite.com/` or `localhost/`
- you use it to reference pages
### `ROOT_DIR`
- translates to `your/path/to/php/server/` or in LAMP it's `var/www/html/`
- 

## How to use?
``` html
<header>
        <h1>ESTRERA BOTANICALS</h1>
        <nav>
            <!-- if your website has an index.php on root you can use BASE_URL -->
            <!-- this basically translate to "yourwebsite.com/" or "localhost/"-->
            <a href="<?= BASE_URL ?>">HOME</a>

            <!-- this basically translate to "yourwebsite.com/about-us" or localhost/about-us-->
            <a href="<?= BASE_URL ?>about-us">ABOUT US</a>
            
            <!-- or if you prefer your files to be all in the root. you can do this -->
            <!-- this basically translate to "yourwebsite.com/shop.php" or "localhost/"-->
            <a class="heading-nav" href="<?= BASE_URL ?>shop.php">SHOP</a>

        </nav>
</header>
```
referencing webpages using `BASE_URL`
```html
<link rel="stylesheet" href="<?=BASE_URL?>style.css">
```


```php
<?php require ROOT_DIR . 'components/header.php' ?>
```
referencing files using `ROOT_DIR`. also discussed further in [[Personal Techniques#OOP on html|OOP on html]] and look at it's implementation



# OOP on html
one nice thing about php is that you can spawn an instance of an object in side your website.

this is very useful when dealing with html that is used on multiple pages and just copy pasting it.

let's call those objects as **Components**


> [!NOTE] Prerequisite
> under is assuming you learned about [[Personal Techniques#Source Config Files|Source Config Files]], if you havent' please look at it first before reading any further


## how it looks like
instead of copy and pasting a header in another website. you can simply put the entire component inside a php file. for example:

`header.php`
```html
<header>
        <h1>ESTRERA BOTANICALS</h1>
        <nav>
            <a class="heading-nav" href="<?= BASE_URL ?>">HOME</a>
            <a class="heading-nav" href="#none">SHOP</a>
            <a class="heading-nav" href="#none">BEST SELLERS</a>
            <a class="heading-nav" href="<?= BASE_URL ?>/about-us">ABOUT US</a>
            <a class="heading-nav" id="heading-cta-button" href="#none">Shop Now</a>
        </nav>
</header>
```
i want to put this on all my webpages

## how to implement it
```php
<?php
//do not forget config.php
require_once '../config.php';
?>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us</title>
    <link rel="stylesheet" href="../style.css">
    
</head>
<body>
    //<!-- an "AHA!" moment here. always loved oop -->
    <?php require ROOT_DIR . 'components/header.php' ?>
</body>
</html>
```
since the header is inside the body
we reference the component using `<?php require ROOT_DIR . 'components/header.php' ?>`
