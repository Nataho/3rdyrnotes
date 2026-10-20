---
cssclasses:
  - wide
tags:
  - notes
---

# What is "Docker"?
docker is an app that makes migrating systems, servers, databases, etc. a lot easier.
the way docker does it is with [[#Images]] and [[#Containers]].
just let the next machine **install docker only**, and it's ready to migrate!

# What if we don't use docker?
if you don't use docker when migrating. the system might break
it could be because of
- outdated / unstable software,
- no prerequisite packages.
- inconsistent configuration.
- and more.

# Images
[[#Images]] are one of the key features of [[Docker]]. [[#Images]] are packages that are ready to be copied and deployed to your [[#Containers|Container]] so it can be used immediately.
> [!note] Analogy
> think of an [[#Images|Image]] as a photo of a document. you can still read the document right? but you can't edit it, just scan it.
> once the [[#Images|Image]] has been scanned. it can then be edited again and be used again

# Containers
[[#Containers]] are also one of the key features of [[Docker]]. [[#Containers]] are basically tiny virtual machines with their own apps and services running. and those services would be your running [[#Images]].

# Setting up docker
## Images needed
- mysql
- php

## Create Network
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


# Creating Containers
in this part is where [[#Containers]] are created
the commands at the very bottom of this section are the commands you can use for our class and just rename them to what you want to make

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

****

# Extra Docker Commands
From the notes of Sir Ariel Bensing

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

*****

# Extra
on symfony to connect to your database you have to open your `.env` file on the root folder.

## Making Variables
```env
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_IP=
MYSQL_PORT=
MYSQL_DATABASE=
```
> [!tip] Example
> My database has these variables to connect to. it doesn't mean you can copy this and make it work on yours. you have to provide your own values
> ```env
> MYSQL_USER=root
> MYSQL_PASSWORD=
> MYSQL_IP=127.0.0.1
> MYSQL_PORT=3306
> MYSQL_DATABASE=eb_shop
> ```

## Connecting to database
on [[#Making Variables]] we'll use the created variables there to connect to the database.
```env
DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_IP}:${MYSQL_PORT}/${MYSQL_DATABASE}?serverVersion=10.11.2-MariaDB&charset=utf8mb4"
```
you can copy this if you want

Drop database
```bash
symfony console doctrine:database:drop --force
```

Create Database
```bash
symfony console doctrine:database:create
```

# using `compose.yaml`
> [!warning] spelling
> the file is named `compose.yaml` — **compose**, not **composer**. composer is the PHP package thing, easy to mix up. both files exist in a symfony project and they do totally different jobs.

using `compose.yaml` is one of the great things of [[Symfony]] and [[Docker]].
it allows you to create containers when needed and delete them when not used or powered off.
it also allows you to migrate your project easily because it is stored in the project itself and not inside a separate database. it's all in one file.

> [!tip] IMPORTANT
> change your `compose.override.yaml` to `compose.override-disabled.yaml` or basically delete it so that it doesn't interfere with your development

## Editing `compose.yaml`
everything you see inside this is what the previous discussion had.
what this basically does is create 2 containers named `webdev-mysql` and `webdev-phpmyadmin` and their images are in the name.
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
this file is also connected to the `.env` file. that's why you see these `${MYSQL_DATABASE}` things

## Essential commands for compose to work
> [!danger] DISCLAIMER
> The following commands **WILL NOT WORK** if the `terminal` you are using is **NOT** inside the root folder of your project

### start the containers
```bash
docker compose up -d
```

### stop the containers
```bash
docker compose stop
```

### stop them and remove everything (containers + volumes)
```bash
docker compose down -v
```

# how to create an entity
entities are tables inside the database. (this part is still a work in progress, to be filled in properly after more discussions)

```bash
symfony console make:entity Category
```

```bash
symfony console make:migration
```

```bash
symfony console doctrine:migrations:migrate
```

```bash
symfony console make:crud Category
```

## how to connect 2 tables
when making the second entity (`Product`), the prompt asks what it is related to — these are the answers to hit:
```bash
symfony console make:entity Product

category      <- field name

ManyToOne     <- the relation

Category      <- the other entity

no            <- store the whole object?

yes           <- is it nullable?

symfony console make:migration

symfony console doctrine:migrations:migrate

symfony console make:crud Product
```
