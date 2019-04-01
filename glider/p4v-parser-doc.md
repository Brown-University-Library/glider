# Process overview

* Starts with init()
* Calls `parseFlightPlans` with the starting DOM node
  * ...which in turn calls `parseFlightPlan` (allows for the possibility of multiple flight plans in a single doc)
* `parseFlightPlan` initializes a PPP register, which keeps 
  track of the current coordinate in PPP space -- this gets
  inherited down from parent DOM Elem to child
  * Then creates a default SEQ Phase for the root DOM elem and recurses down into the DOM children
  * Each DOM child gets passed to `parseDomElem`
* `parseDomElem` receives
  the DOM element and the PPP_Register. (There is also an
  optional flag, `forceNewPhase`, which is only set for the Phase 
  children of a PAR or SEQ phase)
  * `parseDomElem` takes the element and passes it to 
  `getDataFromDomElem`, which returns a data structure with the
  information from the DOM element itself (e.g. its attributes, 
  etc.)
  * Based on the data from `getDataFromDomElem`, `parseDomElem` now 
  creates new Parts, Places, and Phases (if indicated by the DOM)
  and accordingly updates the PPP_Register. Once all changes 
  to the register are complete, the PPP_Register is asked to
  notify PPPPv of a new PPP coordinate point.
  * `parseDomElem` now recurses to the children of the DOM Element,
  calling `parseDomElem` in turn on each, and passing the new
  PPP_Register.
* Repeat until done
* The return value for the parsing process is the PPPPv instance,
  which is a data structure that represents the definitions for
  all the Glider Parts, Part Views, Phases, and Places.

# Markup

This current version allows for multiple FlightPlans on a 
single page. In practice, this may never occur, but it could
allow for e.g. a webpage with several embedded Flights, or
a dashboard of controllers for several Flights.

This could, of course, be also achieved with iframes.

Currently, the only Flight that is run is the first one encountered.

Note: much of the parsing takes place in `getPartDataFromDomElem()`,
      `getPhaseDataFromDomElem()`, and `getPlaceDataFromDomElem()`.
      These functions look at the passed DOM node and extract
      the markup and translate it into a data structure.

## Phases

* The root Phase-type is SEQ by default unless specified otherwise
* Immediate children of SEQ and PAR are themselves Phases, even
  if not explicitly indicated (they need to be, because those
  children need to activate/deactivate, etc.)
* A new Phase is created from a DOM node IFF one or more of
  the following are true:
    * there is a duration specified
    * there is a delay specified
    * a phase-type is specified

## Parts

* A new Part is created from a DOM node IFF one or more of:
  * there is a `@part-type` or class `part-*` OR (failing that)
  * the element identifies a Phase, so it must also
    identify a new Part (because SOMEthing needs to
    receive messages from the Phase). In this case, the
    Part is `DEFAULT_PART_NAME` (aka an HTML pass-through part)
* The part ID is taken from
  * the `@part-id` attribute OR (failing that)
  * the `@part-ref` attribute OR (failing that)
  * the `@id` attribute
* The Part type is taken from:
  * the `@part-type` attribute OR (failing that)
  * a `.part-*` classname OR (failing that)
  * the default part type (defined in the `PARSING_CONSTANTS` data structure as `DEFAULT_PART_NAME`)

## Part Views

* Must be defined as an immediate child of a Part-defining
  element.
* Is defined through the use of:
  * `@part-view`
  * CSS classname `part-<PART TYPE>-<VIEW NAME>`
      (Note that the inclusion of the Part Type in the 
        classname does NOT instantiate a Part -- that must be
        done in the parent element)
* If the Part element has NO View-defining children, then all
  element content is put into a default View
* If the child of a Part element does not define a View,
  then that element goes into the default View 
  (_there is a question of how to handle multiple child nodes, some of which are Part Views and some of which aren't. Is this an error?_)

## Part References (not implemented)

* Defined through `@part-ref` -- e.g. `part-ref="#abc"`
* They serve to: 
  * associate a previously used Part with a (new) Phase
  * change a Part's state (as options) at a given Phase
* They do NOT:
  * Introduce or change Views -- they only work with Parts
    (this could potentially change, if we decide that 
      the author should be able to move Views to different 
      Places)

## Places

* Places have two aspects, arranged in a hierarchy
  * The Role (level 1) -- this is the equivalent of a 
    'display/device class', e.g. "The DSL wall", 
    "audience phones", etc.
  * The Region (level 2) -- this is the area of the
    display to put the Part. What exactly this means depends 
    on the Place-type.
* The Flight root starts with a null Place -- that is,
    one in which Role and Region are set to UNDEFINED
    (the content will go to all Roles, and Region is not set)
* The Role/Region is/are set according to the following
  order (from highest precedent to lowest):
  * the `@place-role` and `@place-region` attributes OR (failing that)
  * the `@place` attribute (of form `<ROLENAME>-<REGIONNAME>`) 
    OR (failing that)
  * a classname of format `place-<ROLENAME>-<REGIONNAME>` 
    (where `REGIONNAME` is optional)
* If you have a bunch of elements that all are for a single Role,
  you can define the Role in a parent element and then
  defined the Regions (if needed) in the descendents without
  re-stating the Role -- in other words, the Role is inherited.
  * NOTE THAT for now, a Role assigned by an element
    can NOT be reassigned by an ancestor -- you're stuck with it!