---
tags:
  - subnotes
---

## [[ID Selector]]
use the selector whenever you only need one element to be edited by css
prefix: `#`
```HTML
---how to create ID---
<h2 id="about_me"> </h2>
<h3 id="about_me"> </h3> %% dili pwede kaduha, ID is unique %%
<h4 class = "this_class"> </h4>
<h2 class = "this_class"></h2> 
<body class ="two_times"></body>

```
## [[Class Selector]]
use `<h2 class:"classname">` when you want multiple elements to update when one class is edited
prefix `.`
```CSS
#about_me: { %% singular %%
}
.this_class {
font-size: 40px
}

.two_times{
scale:2em
}
```

## [[Element Selector]]
``` CSS
h2{
/* uses the tag and automatically sets */
}
```

## [[attribute selector]]
```CSS
input[type]{
}
```

## [[Grouping Selector]]
can add any other kind of selector
```CSS
.this,h1,h2{

}
```

universal
