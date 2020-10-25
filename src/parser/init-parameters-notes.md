
# Glider parameter notes

"Parameters" in this context are the inputs to the Glider display. They are derived from:

* HTML FlightPlan markup
* Glider definitions markup
* URL parameters

This document defines the input format for each.

## Flightplan markup

The _Flightplan_ is the term for the markup that forms the content of the Glider presentation. It is HTML with a layer of Glider sauce.

### A note on HTML IDs

All Flightplan markup elements have an ID (in the form of an `id` attribute). 

If the element doesn't have one, one will be assigned that is based on its position in the document -- thereby ensuring that across all clients the IDs will be the same.

### Glider Root

The root element of a Flightplan can be either:

* an element with classname `glider-root`
* the body element (if this is the case, then a `<template>` element is automatically inserted as the direct child of `<body>` to act as a root)

Note
> Unless explicitly designared otherwise, the glider-root is a parallel timecontainer, so that all children run simultaneously. To have each child appear in order as a "slideshow", the `phase-type` attribute must be set to `SEQ`.

### Phases

> NOTE: The model for Glider Phases is a simplified version of the SMIL standard.

Flightplan elements can act as either:

* _TimeContainers_, are either of type `PAR` (parallel), or `SEQ` (sequence) and contain other Phases.
    * Child Phases of a `PAR` are active simultaneously
    * Child Phases of a `SEQ` run one after another
* _Leafs_, which do not have any children.

### Parts

Parts are invisible; they are not rendered but are containers for Views. If you want to "see" a Part, you need to give it a View. 

Parts have the state - that is, they contain the variables that are shared between the Glider clients.

Parts also have the relationship with _Phases_; it is the Part that is activated and de-activated by a Phase, not the Part Views. This ensures that Part Views are all activated and de-activated together.

### Part Views

_Part Views_ are what you see on a display (or, in Glider terminology, in a _Place_).

In the markup, Part Views are the immediate children of Parts. They are designated by the  `part-view` attribute, e.g.

```
<div part-type=”myPart”>
  <div part-view=”myView”>
    ...
  </div>
</div>
```

If a direct child of a Part doesn't have a view assigned, then it's given a View type of `_default`. The Part definition can designate one of its Views as the default.

If the Part doesn't have any children, then a default Part View is created.

## Definitions markup

## URL parameters
