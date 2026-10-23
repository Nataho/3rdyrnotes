---
tags:
  - notes
cssclasses:
  - wide
---
 
> [!example] Prerequisite
> needs `PHP 8.3` and above, and internet for the setup.

# Create new project
```bash
symfony new [Project Name] --webapp
```

# Start project
```bash
symfony server:start
```
if you want to start the server on all available ip addresses on your network, add `--allow-all-ip`.

# Create new controller
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

# Using templates
previously in [[#Create new controller]] there was a mention of `/templates/dashboard` — this is where you edit your html.

in the generated file you'll see these lines: `{% block body %} {% endblock %}`.
i think they're called **twig blocks** but i still don't know the deep details yet. anyway, they are used by the `base.html.twig` shown below. inside that block is the html used for the body — and if you look at `/templates/base.html.twig`, you will see this:

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

## How to reuse elements
if you have elements like the top navigation bar, the sidebar, or the footer, you don't have to copy and paste them into every file over and over again.

instead, change what's written in `/templates/base.html.twig`. what happens is `base.html.twig` loads first, then adds the `{% block %}` content after it.

from our discussion, the example our teacher gave:
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

it kind of looks intimidating right now, but when partial templates come in, this will look a lot cleaner.

# How to make and use partial templates
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

# See also
- [[Docker]] — this is the framework its containers run, including the `.env` and `compose.yaml` setup
- [[php and database]] — the vanilla connect-and-save this framework replaces
- [[Midterm Website]] — where symfony is used for the admin panel
