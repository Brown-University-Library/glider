
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

Therefore: currently _if the Glider markup is modified prior to parsing, then either (a) it has to be modified consistently between clients, *OR* (b) explicit IDs need to be provided._

### Glider Root

The root element of a Flightplan can be either:

* an element with classname `glider-root`
* the body element (if this is the case, then a `<template>` element is automatically inserted as the direct child of `<body>` to act as a root)

Note
> Unless explicitly designated otherwise, the `glider-root` is a parallel timecontainer, so that all children run simultaneously. To have each child appear in order as a "slideshow", the `phase-type` attribute must be set to `SEQ`.

### Phases

> NOTE: Glider Phases is a highly simplified version of [the SMIL standard](https://www.w3.org/TR/2008/REC-SMIL3-20081201/smil-timing.html).

Currently, for simplicity, _all Glider markup elements have a Phase assigned_, even if it's a trivial instance of `[begin time = 0, duration = Infinity, type = PAR or LEAF]`. (In the future, these Phases - which basically don't do anything - may be filtered out)

Flightplan elements can act as either:

* _TimeContainers_, are either of type `PAR` (parallel), or `SEQ` (sequence) and contain other Phases.
    * Child Phases of a `PAR` are active simultaneously
    * Child Phases of a `SEQ` run one after another
* _Leafs_, which do not have any children.

A Phase can have the following attributes:

* `phase-type`: one of "PAR", "SEQ", "LEAF". (default: "PAR")
* `phase-begin`: the time (in seconds) after which the Phase begins (default: 0)
* `phase-duration`: how long after the start does a Phase last? (default: Infinity)

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


