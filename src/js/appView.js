import eventController from "./controllers/eventController";
import template from "./appView.html";
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
    this.$el.append(template);
    let statControllerView  = new StatControllerView();
    this.$el.append(statControllerView.render().el);
    // statControllerView.start();
    return this;
  }
});

module.exports = AppView;
