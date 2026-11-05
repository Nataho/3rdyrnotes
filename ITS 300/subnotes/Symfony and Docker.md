---
tags:
  - notes
cssclasses:
  - wide
---

Unified note combining [[Symfony]] and [[Docker]] so you only have to go through it once.

# Symfony

> [!example] Prerequisite
> needs `PHP 8.3` and above, and internet for the setup.

## Create new project
```bash
symfony new [Project Name] --webapp
```

## Start project
```bash
symfony server:start
```
if you want to start the server on all available ip addresses on your network, add `--allow-all-ip`.

## Create new controller
```bash
symfony console make:controller [Controller Name]
```

> [!hint] Example scenario
> dev wants to make a `DashboardController`.
> dev runs this: `symfony console make:controller DashboardController`
>
> this creates a file in `/src/Controller/` and a folder with a file in `/templates/`.
>
> to access the controller, it defaults to `127.0.0.1:800x/dashboard` — the route lives in
> `/src/Controller/DashboardController.php` and looks like this:
>
> ```php
> <?php
>
> namespace App\Controller;
>
> use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
> use Symfony\Component\HttpFoundation\Response;
> use Symfony\Component\Routing\Attribute\Route;
>
> final class DashboardController extends AbstractController
> {
> 	// this is the part that maps the url to the controller
>     #[Route('/dashboard', name: 'app_dashboard')]
>
>     public function index(): Response
>     {
>         return $this->render('dashboard/index.html.twig', [
>             'controller_name' => 'DashboardController',
>         ]);
>     }
> }
> ```

## Using templates
previously in [[#Create new controller]] there was a mention of `/templates/dashboard` — this is where you edit your html.

in the generated file you'll see these lines: `{% block body %} {% endblock %}`.
they're called **twig blocks**. they are used by the `base.html.twig`. inside that block is the html used for the body — and if you look at `/templates/base.html.twig`, you will see this:

```twig
    <body>

        {% block body %}{% endblock %}

    </body>
```

this is where the contents of your controller's `{% block body %} {% endblock %}` will appear in the actual website.

you don't have to edit `base.html.twig` for per-page stuff — that one is for reusable elements like the top navigation bar, the sidebar, or the footer.

> [!tip] Example scenario
> you want to add a simple hello world to the dashboard page. simply go to `/templates/dashboard/index.html.twig` and put it inside the `{% block body %}{% endblock %}`:
>
> ```twig
> {% block body %}
>
> <h1>Hello World</h1>
>
> {% endblock %}
> ```

### How to reuse elements
if you have elements like the top navigation bar, the sidebar, or the footer, you don't have to copy and paste them into every file over and over again.

instead, change what's written in `/templates/base.html.twig`. what happens is `base.html.twig` loads first, then adds the `{% block %}` content after it.

> [!tip] Example scenario
> dev wants the reusable part to be just the sidebar, with the page contents living elsewhere.
> the sidebar would be one `<aside>` tag:
>
> ```twig
> <body>
>
>     <div class="layout">
>
>         <aside class="sidebar">
>             <div class="sidebar-header">
>                 <h2>My App</h2>
>             </div>
>
>             <nav>
>                 <ul>
>                     <li>
>                         <a href="{{ path('app_dashboard') }}">Dashboard</a>
>                     </li>
>
>                     <li>
>                         <a>Users</a>
>                     </li>
>
>                     <li>
>                         <a>Settings</a>
>                     </li>
>                 </ul>
>             </nav>
>         </aside>
>
>         <main class="content">
>             {% block body %}{% endblock %}
>         </main>
>
>     </div>
>
> </body>
> ```

by changing what's inside the `<body>` in `base.html.twig` we have essentially created a reusable element.

### How to make and use partial templates
partial templates are templates that don't have controllers. they're basically small components you can add to an existing `.twig` file.

in the previous example in [[#How to reuse elements]], the sidebar took too much space in the body. let's fix that with partial templates.

> [!tip] Example scenario
> dev wants the previous code to look cleaner.
> 1. dev creates a folder named `partials` in `/templates/`
> 2. in `/templates/partials/`, dev creates a file to hold the sidebar, named `sidebar.html.twig`
> 3. `/templates/partials/sidebar.html.twig` gets:
>
> ```twig
> <aside class="sidebar">
>     <div class="sidebar-header">
>         <h2>My App</h2>
>     </div>
>
>     <nav>
>         <ul>
>             <li>
>                 <a href="{{ path('app_dashboard') }}">Dashboard</a>
>             </li>
>
>             <li>
>                 <a>Users</a>
>             </li>
>
>             <li>
>                 <a>Settings</a>
>             </li>
>         </ul>
>     </nav>
> </aside>
> ```
>
> 4. since the file has been created, in `/templates/base.html.twig` replace the sidebar in the body with `{% include '[path to partials]' %}` — in our case, `{% include 'partials/sidebar.html.twig' %}`
>
> `/templates/base.html.twig` will look something like this:
>
> ```twig
> <body>
>     <div class="layout">
>         {% include 'partials/sidebar.html.twig' %}
>         <main class="content">
>             {% block body %}{% endblock %}
>         </main>
>     </div>
> </body>
> ```

this way the sidebar lives in its own file and `base.html.twig` is back to being tidy.

# Docker

## What is Docker?
docker is an app that makes migrating systems, servers, databases, etc. a lot easier.
the way docker does it is with **images** and **containers**.
just let the next machine **install docker only**, and it's ready to migrate!

## What if we don't use docker?
if you don't use docker when migrating, the system might break.
it could be because of:
- outdated / unstable software,
- no prerequisite packages,
- inconsistent configuration,
- and more.

## Images
images are one of the key features of docker. images are packages that are ready to be copied and deployed to your container so it can be used immediately.

> [!note] Analogy
> think of an image as a photo of a document. you can still read the document right? but you can't edit it, just scan it.
> once the image has been scanned, it can then be edited again and be used again.
>
> in plainer terms: the image is the frozen package — you don't touch it yourself. you **run** it, and what's running it is the container. one image can spawn as many copies of a container as you want.

## Containers
containers are also one of the key features of docker. containers are basically tiny virtual machines with their own apps and services running — and those services would be your running images.

# Setting up docker
## Images needed
- mysql
- php

## Create network
```bash
docker network create [name of network]
```
> [!tip] Example
> ```bash
> docker network create webdev-network
> ```

## most basic command to create a container
> [!danger] DISCLAIMER
> **NOT RECOMMENDED TO RUN THIS BY ITSELF**
```bash
docker run -d [name of container]
```
> [!warning] why it's not recommended
> a bare `run` like this has no network, no volume, no environment variables, nothing. the full versions below include all of those — use those instead.

## command to find if a port is used (windows)
```bash
netstat -ano | findstr [portnumber]
```
> [!tip] Example
> ```bash
> netstat -ano | findstr 3306
> ```
> if something is using port `3306`, you get output like this. if the port is free, the command just prints nothing.
> ```
>   TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING       18196
>   TCP    [::]:3306              [::]:0                 LISTENING       18196
> ```

## Creating containers
## MySQL container
```bash
docker run -d --name [ContainerName] --network [NetworkName] -v [Volume Name]:[Volume Location] -e MYSQL_ROOT_PASSWORD=[Mysql Password] -e MYSQL_DATABASE=[DatabaseName] -p [host port]:[container port] [image to be installed]
```
> [!tip] Example
> ```bash
> docker run -d --name webdev-mysql --network webdev-network -v webdev-db-data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=webdev-db -p 3310:3306 mysql:8.0
> ```

## phpMyAdmin container
```bash
docker run -d --name [ContainerName] --network [NetworkName] -e PMA_HOST=[MysqlContainerName] -p [host port]:[container port] [image to be installed]
```
> [!tip] Example
> ```bash
> docker run -d --name webdev-phpmyadmin --network webdev-network -e PMA_HOST=webdev-mysql -p 3311:80 phpmyadmin
> ```

## My command
> [!danger] DISCLAIMER
> **DO NOT COPY THIS. THIS COMMAND IS IRRELEVANT TO YOUR PROJECTS**
```bash
docker run -d --name EB_mysql --network EB_Network -v EB-db-data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=EB_shop -p 6967:3306 mysql:8.0
```

```bash
docker run -d --name EB_phpmyadmin --network EB_Network -e PMA_HOST=EB_mysql -p 6969:80 phpmyadmin
```

# Extra docker commands
from the notes of Sir Ariel Bensing.

## Build an image from a dockerfile
```bash
docker build -t symfony-app .
```
the `.` at the end matters — it points to the dockerfile in the **current folder**.

## Build the container based on the image
```bash
docker run --name symfony-app-demo --network platform-network -p 8000:8000 symfony-app
```

## Create a network
```bash
docker network create platform-network
```

## Build a container for MySQL
```bash
docker run -d --name symfony-db --network platform-network -v symfony-db-data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=app_db -p 3310:3306 mysql:8.0
```

## Build a container for phpMyAdmin
```bash
docker run -d --name symfony-pma --network platform-network -p 8081:80 -e PMA_HOST=symfony-db phpmyadmin
```

## Execute a command inside a running container
```bash
docker exec -it symfony-app-demo "symfony command"
```

## Inspect a network
```bash
docker network inspect [network name]
```

## Delete a network
```bash
docker network rm [network name]
```

## Delete a container
```bash
docker rm [container name]
```

## Delete an image
```bash
docker rmi [image name]
```

## Stop a container
```bash
docker stop [container name]
```
<span style="opacity:.5">took me a while to realize `stop` is for containers, not networks lmao. networks don't stop, they just exist until you `rm` them.</span>

# Connecting Symfony to the database
on symfony to connect to your database you have to open your `.env` file on the root folder.

## Making variables
```env
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_IP=
MYSQL_PORT=
MYSQL_DATABASE=
```
> [!tip] Example
> my database has these variables to connect to. it doesn't mean you can copy this and make it work on yours — you have to provide your own values.
> ```env
> MYSQL_USER=root
> MYSQL_PASSWORD=
> MYSQL_IP=127.0.0.1
> MYSQL_PORT=3306
> MYSQL_DATABASE=eb_shop
> ```

## Connecting to database
using the variables from [[#Making variables]] to connect to the database:
```env
DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_IP}:${MYSQL_PORT}/${MYSQL_DATABASE}?serverVersion=10.11.2-MariaDB&charset=utf8mb4"
```
you can copy this one if you want.

drop database:
```bash
symfony console doctrine:database:drop --force
```

create database:
```bash
symfony console doctrine:database:create
```

# Using `compose.yaml`
> [!warning] spelling
> the file is named `compose.yaml` — **compose**, not **composer**. composer is the PHP package thing, easy to mix up. both files exist in a symfony project and they do totally different jobs.

using `compose.yaml` is one of the great things of [[Symfony]] and docker.
it allows you to create containers when needed and delete them when not used or powered off.
it also allows you to migrate your project easily, because the whole setup is stored in the project itself and not inside a separate database. it's all in one file.

> [!tip] IMPORTANT
> change your `compose.override.yaml` to `compose.override-disabled.yaml` or basically delete it so that it doesn't interfere with your development.

## Editing `compose.yaml`
everything inside this file is the same thing the manual `docker run` commands did earlier.
what this basically does is create 2 containers named `webdev-mysql` and `webdev-phpmyadmin`, and their images are in the name.

```yaml
services:
  webdev-mysql:
    image: mysql:8.0
    container_name: webdev-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "6666:3306"
    volumes:
      - webdev-db-data:/var/lib/mysql
    networks:
      - webdev-network
  webdev-phpmyadmin:
    image: phpmyadmin
    container_name: webdev-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: webdev-mysql
    ports:
      - "7777:80"
    networks:
      - webdev-network

volumes:
  webdev-db-data:

networks:
  webdev-network:
```
this file is also connected to the `.env` file — that's why you see those `${MYSQL_DATABASE}` things.

## Essential commands for compose to work
> [!danger] DISCLAIMER
> the following commands **WILL NOT WORK** if the `terminal` you are using is **NOT** inside the root folder of the project.

> [!note] see original
> for the exact compose command list, check [[Docker]] — this part of the original note wasn't fully captured when this note was made.

# See also
- [[Symfony]] — the framework the containers run on the original note
- [[Docker]] — the original standalone note
- [[php and database]] — the vanilla connect-and-save this framework replaces
- [[Midterm Website]] — where symfony is used for the admin panel
