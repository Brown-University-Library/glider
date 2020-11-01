
// The default Part is an HTML pass-through

let part = {
  data() {
    return {
      blue: "This is from the HTML Part"
    }
  }
};

let views = [{
  partviewName: PARSING_CONSTANTS.PART.DEFAULT_VIEW_NAME,
  render(h) { 
    return h(
      this.$vnode.data.tag,
      { attrs: { id: this.id }},
      this.$slots.default
    ) 
  }
}];

export { part, views }
