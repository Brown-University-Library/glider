
import { PARSING_CONSTANTS } from '../../../system-settings.js';

// The default Part is an HTML pass-through
// @todo erase data (just for testing)

let part = {
  data() {
    return {
      testVar: "This is from the HTML Part"
    }
  },
  render: function() { 
    return this.$slots.default 
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
