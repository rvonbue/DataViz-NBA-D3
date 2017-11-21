import eventController from "./controllers/eventController";
// import template from "./appView.html";
import nba from 'nba.js';

let StatView1 = Backbone.View.extend({
  className: "stat-view-1",
  initialize: function (options) {
    window.nba = nba;
  },
  addListeners: function () { },
  render: function () {
    // this.$el.append(template);
    return this;
  }
});

module.exports = StatView1;
