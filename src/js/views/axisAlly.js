import eventController from "../controllers/eventController";
import template from "./axisAlly.html";

let axisAlly = Backbone.View.extend({
  className: "info-pane-hover",
  events: {
    "mouseenter .power-hover": "powerMouseEnter",
    "mouseleave .power-hover": "powerMouseLeave"
  },
  powerMouseEnter: function (evt) {
    eventController.trigger(eventController.HOVER_ALL_AXIS_OR_ALLY, $(evt.currentTarget).index(".power-hover") );
  },
  powerMouseLeave: function (evt) {
    eventController.trigger(eventController.UNSET_ALL_HOVER_MODELS);
  },
  render: function () {
    this.$el.append(template);
    return this;
  }
});

module.exports = axisAlly;
