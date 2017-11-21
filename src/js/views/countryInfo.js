import eventController from "../controllers/eventController";
import template from './countryInfo.html';

let CountryInfo = Backbone.View.extend({
  className: "country-info",
  initialize: function () {
    this.addListeners();
  },
  addListeners: function () {
    eventController.on(eventController.HOVER_NAVIGATION, this.mouseHover, this);
  },
  mouseHover: function (raycast) {
    this.$el.empty();
    if (raycast && raycast.object)  this.$el.append(template({name: this.jsUcfirst(raycast.object.name)}));
  },
  jsUcfirst: function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
  },
  render: function () {
    // this.$el.append(template({name: "DEFAULT NAME"}));
    return this;
  }
});

module.exports = CountryInfo;
