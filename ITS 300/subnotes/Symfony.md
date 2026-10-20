---
cssclasses:
  - wide
---

> [!EXAMPLE] Prerequisite
> Needs `PHP 8.3` and above
# Create new project
Need Internet
```bash
symfony new [Project Name] --webapp
```

# Start Project
```bash
symfony server:start
```
if you want to start the server on all available ip addresses on your network. add `--allow-all-ip`
# Create New Controller
```bash
symfony console make:controller [Controller Name]
```


```
symfony console make:controller HomeController
```


> [!hint] Example Scenario
> dev wants to make a "DashboardController".
> dev runs this command `symfony console make:controller DashboardController`
> 
> this will create a file on `/src/Controller/` and a folder with a file in `/templates/`
> 
> to access the controller. it has defaulted to `127.0.0.1:800x/dashboard` and this is located on
> `/src/Controller/DashboardController.php` on line 11
> looks like `#[Route('/dashboard', name: 'app_dashboard')]`
> 
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
> 	//this one right here
>     #[Route('/dashboard', name: 'app_dashboard')]
> 	//this one right here
> 	
>     public function index(): Response
>     {
>         return $this->render('dashboard/index.html.twig', [
>             'controller_name' => 'DashboardController',
>         ]);
>     }
> }
> ```


# Using Templates
previously on [[#Create new controller]] there was a mentioned `/templates/dashboard`. this is where you edit your HTML or PHP.

in your file you will see these lines `{% block body %} {% endblock %}`.
i don't know what these are called yet but they are used by the `base.html.twig` that we're gonna show later.
inside that block is the HTML that is used for the body and if you look at `/templates/base.html.twig` you will see this
```twig
    <body>

        {% block body %}{% endblock %}

    </body>
```
this is where the inside of your controller's `{% block body %} {% endblock %}` will appear in the actual website

> [!tip] Example Scenario
> you want to add a simple hello world to the DashboardController
> simply go to `/templates/dashboard/index.html.twig` and replace what's inside the `{% block body %}{% endblock %}` with what you want
> in this case it will be
> ```twig
> {% block body %}
> 
> <h1>Hello World</h1>
> 
> {% endblock %}
> ```

you don't have to edit `base.html.twig` because that's for reusable elements like the top navigation bar or the side bar, or even the footer.

## How to Reuse Elements
if you have elements like the `top navigation bar`, the `Side Bar` or the `footer`. you don't have to copy and paste the elements to other files over and over again.

instead what you can do is change what is written in `/templates/base.html.twig`
what happens here is `base.html.twig` loads first, then adds the `{% block %}`s after

in our discussion our teacher gave us an example
> [!tip] Example Scenario
> dev wants the reusable part to be just the side bar and the contents be in another location.
> the side bar would be one with the `<aside>` tag
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

by changing what's inside the `<body>` in the `base.html.twig` we have essentially created a reusable element.

though this kinda looks intimidating. but when we use partial templates later. this script will look less intimidating.

# How to make and use `Partial Templates`
Partial templates are templates that don't have controllers. there are basically small components you can add to an exsisting `.twig` file.

in the previous example on [[#How to Reuse Elements]], the side bar took too much space on the body. let's change that by making `Partial Templates`
> [!tip] Example Scenario
> dev wants previous code to look more cleaner.
> dev creates a folder named `partials` on `/templates/`
> 
> in `/templates/partials/`, dev creates a file to store the side bar. which will be named `sidebar.html.twig`
> 
> inside `/templates/partials/sidebar.html/twig`
> dev will write the following
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
> since the file has been created. in `/templates/base.html.twig` replace what was written in the body with `{% include '[path to partials]' %}`,
> in our case, it will be `{% include 'partials/sidebar.html.twig' %}`
> 
> `/templates/base.html.twig` will look something like this
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

this way your code is separated and looks cleaner than before

