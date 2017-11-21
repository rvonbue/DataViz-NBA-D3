import eventController from "./controllers/eventController";
import template from "./appView.html";
import StatsView1 from "./StatsView1";

let AppView3d = Backbone.View.extend({
  className: "appView",
  initialize: function (options) { },
  addListeners: function () { },
  attachedToDOM: function () {
    console.log("AttachedToTheDOM");
    new StatsView1();
  },
  getWidthHeight: function () {
    return {w: this.$el.width(), h: this.$el.height() };
  },
  resize: function () {
    let size = this.getWidthHeight();
  },
  render: function () {
    this.$el.append(template);
    return this;
  }
});

module.exports = AppView3d;
