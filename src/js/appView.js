import eventController from "./controllers/eventController";
import StatControllerView from "./views/StatControllerView";

let AppView = Backbone.View.extend({
  id: "appView",
  initialize: function (options) {
  },
  addListeners: function () { },
  attachedToDOM: function () {
    // console.log("AttachedToTheDOM");
  },
  resize: function () {
    let size = this.getWidthHeight();
  },
  render: function () {
    let statControllerView  = new StatControllerView();
    this.$el.append(statControllerView.render().el);
    return this;
  }
});

module.exports = AppView;
