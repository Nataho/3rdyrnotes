# Symfony and Docker Quiz

Built from [[Symfony]], [[Docker]], and [[Symfony and Docker]]. Fill in every answer field, then check yourself.

> [!success] Score: 17/20 - 85%

> [!question] 1. What PHP version does Symfony require, at minimum?
> - [x] A. PHP 7.4 and above
> - [ ] B. PHP 8.1 and above
> - [ ] C. PHP 8.3 and above
> - [ ] D. PHP 9.0 and above
>
> Answer:
> ```
>
> ```

> [!fail] 1. Wrong - you picked PHP 7.4 and above; correct is C. PHP 8.3 and above, because the Prerequisite callout in [[Symfony]] says it needs `PHP 8.3` and above.

> [!question] 2. Which command creates a new Symfony web project?
> - [ ] A. composer create-project
> - [x] B. symfony new [Project Name] --webapp
> - [ ] C. php artisan new
> - [ ] D. symfony start [Project Name]
>
> Answer:
> ```
>
> ```

> [!check] 2. Correct - symfony new [Project Name] --webapp

> [!question] 3. Which flag starts the Symfony server on all available IP addresses on your network?
> - [ ] A. --network-all
> - [ ] B. --all-interfaces
> - [x] C. --allow-all-ip
> - [ ] D. --open-network
>
> Answer:
> ```
>
> ```

> [!check] 3. Correct - --allow-all-ip

> [!question] 4. What command creates a new Symfony controller?
>
> Answer:
> ```
> symfony console make:controller
> ```

> [!check] 4. Correct - symfony console make:controller

> [!question] 5. When you run `symfony console make:controller DashboardController`, where is the controller file created?
> - [ ] A. /templates/Controller/
> - [x] B. /src/Controller/
> - [ ] C. /public/Controller/
> - [ ] D. /config/Controller/
>
> Answer:
> ```
>
> ```

> [!check] 5. Correct - /src/Controller/

> [!question] 6. In the DashboardController note, what URL does the controller default to when accessed?
> - [ ] A. 127.0.0.1:8000/home
> - [x] B. 127.0.0.1:800x/dashboard
> - [ ] C. localhost:8000/main
> - [ ] D. 127.0.0.1:8000/index
>
> Answer:
> ```
>
> ```

> [!check] 6. Correct - 127.0.0.1:800x/dashboard

> [!question] 7. What are these template lines called: `{% block body %} {% endblock %}`?

> Answer:
> ```
> i don't know
> ```

> [!fail] 7. Wrong - the answer field was "i don't know"; correct is **twig blocks**, per [[Symfony]]: "they're called twig blocks" and `base.html.twig` uses them to place your page's body html.

> [!question] 8. What is `base.html.twig` used for?
> - [ ] A. Per-page content only
> - [x] B. Reusable elements like the top navigation bar, sidebar, or footer
> - [ ] C. Database configuration
> - [ ] D. Defining the route to the controller
>
> Answer:
> ```
>
> ```

> [!check] 8. Correct - Reusable elements like the top navigation bar, sidebar, or footer

> [!question] 9. How does a `.twig` file pull in a partial template like the sidebar?
> - [ ] A. {% import 'partials/sidebar.html.twig' %}
> - [ ] B. {% render 'partials/sidebar.html.twig' %}
> - [x] C. {% include 'partials/sidebar.html.twig' %}
> - [ ] D. {% load 'partials/sidebar.html.twig' %}
>
> Answer:
> ```
>
> ```

> [!check] 9. Correct - {% include 'partials/sidebar.html.twig' %}

> [!question] 10. What is Docker?

> Answer:
> ```
> is a program to run images in containers
> ```

> [!check] 10. Correct - a program to run images in containers

> [!question] 11. Docker does its work using two key features: images and __________.

> Answer:
> ```
> containers
> ```

> [!check] 11. Correct - containers

> [!question] 12. Which statement about Docker images is true, per the analogy in the notes?
> - [ ] A. You edit the image directly and run it as-is
> - [x] B. The image is the frozen package; you run it, and the container is what's running it
> - [ ] C. Images and containers are the same thing
> - [ ] D. An image can spawn exactly one container
>
> Answer:
> ```
>
> ```

> [!check] 12. Correct - The image is the frozen package; you run it, and the container is what's running it

> [!question] 13. What are containers?
> - [x] A. Tiny virtual machines with their own apps and services running
> - [ ] B. The images themselves
> - [ ] C. Network connections between databases
> - [ ] D. Environment variables in `.env`
>
> Answer:
> ```
>
> ```

> [!check] 13. Correct - Tiny virtual machines with their own apps and services running

> [!question] 14. Which command creates a Docker network?

> Answer:
> ```
> docker network
> ```

> [!fail] 14. Wrong - you answered "docker network"; correct is `docker network create [name of network]` (example: `docker network create webdev-network`) — `create` is the part that actually makes it.

> [!question] 15. On Windows, which command finds out whether a port (e.g. 3306) is already in use?
> - [x] A. netstat -ano | findstr 3306
> - [ ] B. ipconfig /portscan 3306
> - [ ] C. ping -p 3306
> - [ ] D. docker port 3306
>
> Answer:
> ```
>
> ```

> [!check] 15. Correct - netstat -ano | findstr 3306

> [!question] 16. In the full MySQL container run command, which environment variable sets the root password?
> - [ ] A. MYSQL_PASSWORD
> - [ ] B. MYSQL_USER
> - [x] C. MYSQL_ROOT_PASSWORD
> - [ ] D. PMA_HOST
>
> Answer:
> ```
>
> ```

> [!check] 16. Correct - MYSQL_ROOT_PASSWORD

> [!question] 17. In the phpMyAdmin container run command, which environment variable points it at the MySQL container?
> - [ ] A. MYSQL_DATABASE
> - [x] B. PMA_HOST
> - [ ] C. MYSQL_HOST
> - [ ] D. PMA_PORT
>
> Answer:
> ```
>
> ```

> [!check] 17. Correct - PMA_HOST

> [!question] 18. Which file creates containers when needed and can delete them when not used, storing the whole setup in the project itself? Spell the file name exactly.

> Answer:
> ```
> the compose.yaml file
> ```

> [!check] 18. Correct - compose.yaml (spelled exactly right — "composer" would have been the trap)

> [!question] 19. What should you do with `compose.override.yaml` so it doesn't interfere with your development?
> - [ ] A. Edit its image versions
> - [x] B. Delete or rename it, e.g. to compose.override-disabled.yaml
> - [ ] C. Move it into /templates/
> - [ ] D. Nothing, it is required
>
> Answer:
> ```
>
> ```

> [!check] 19. Correct - Delete or rename it, e.g. to compose.override-disabled.yaml

> [!question] 20. In the `.env` file, which variable holds the full connection string Symfony uses to connect to the database?
> - [ ] A. MYSQL_CONNECTION
> - [x] B. DATABASE_URL
> - [ ] C. MYSQL_DATABASE
> - [ ] D. DB_LINK
>
> Answer:
> ```
>
> ```

> [!check] 20. Correct - DATABASE_URL

Ask the AI to evaluate your answers when you're done.