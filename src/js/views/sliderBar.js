import eventController from "../controllers/eventController";
import template from "./sliderBar.html";

let SliderBar = Backbone.View.extend({
  className: "slider-bar",
  events: {
    "mouseenter .power-hover": "powerMouseEnter",
  },
  initialize: function (options) {

  },
  addListeners: function () {
    this.$el.find("input").on('input', function() {
      eventController.trigger(eventController.TIMELINE_MANAGER_UPDATE, $(this).val());
    });
  },
  removeListeners: function () {
  },
  render: function () {
    this.$el.append(template);
    this.addListeners();
    return this;
  }
});

module.exports = SliderBar;
