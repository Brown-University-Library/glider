Glider
=================

This is the development area for [Glider](http://cds.library.brown.edu/projects/glider/), an open source project that aims to support those building display-wall applications. 

*Note that Glider is very much under development, so this code is really, really unstable!*

The Glider framework allows for multiple use cases, including:

* Interactive digital exhibits, with which viewers interact via a touch controller (kiosk-style) or cell phones
* Digitally enhanced collaborative classes, in which content and shared documents are pushed to students
* Participatory presentations, in which audiences receive supplemental materials as the lecture is delivered
* Digital repository viewing interfaces, in which users interactively select and display items on the display wall using their cell phone

Glider is a project of the [Brown University Library](http://library.brown.edu), and is being developed by Patrick Rasheigh (Brown University Library) and Joel Salisbury (University of Connecticut). It is funded by, and a proud member of, the Mellon-funded [Immersive Scholar project](https://www.immersivescholar.org/) at [NCSU Libraries](https://www.lib.ncsu.edu/).

Probably more than you want to know is available for perusal at [the Glider website](http://cds.library.brown.edu/projects/glider/), and please feel free to throw us an email: `patrick underscore rashleigh at brown dot edu`.

Installation
----------

I'm still learning my devops techniques, so eventually I'll have a proper installation process. For now, I use rollup to reconcile all the modules into a single file. Here's the script I run from the root directory in order to generate `dist/glider.js`:

```
curl https://www.gstatic.com/firebasejs/5.8.2/firebase.js > dist/glider.js
curl https://cdn.jsdelivr.net/npm/vue >> dist/glider.js
curl https://cdnjs.cloudflare.com/ajax/libs/vuex/3.1.0/vuex.min.js >> dist/glider.js
rollup src/main.js --format iife  --name "glider" >> dist/glider.js
```

API reference
----------

Coming soon - really! As the curious come by to check out Glider, I'll want to have a welcoming experience.

Links to live examples
----------

I have done up some simple examples in the `examples/` directory; for now, that's a place to start.

Contributing
----------

At the moment (Spring 2019) we're still developing Glider, so testing and feedback is probably the most useful thing. We're hoping to have a library of interesting Parts for launch in the Fall, so if you're interested in contributing there, please feel free.

