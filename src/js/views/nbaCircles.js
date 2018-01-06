import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import util from "../util";
import NBAcircleTemplate from "./html/nbaCircle.html";

let NBACircles = Backbone.View.extend({
  className: "NBA-circles-container",
  events: {
    "mouseenter .circle.team-selector": "mouseEnterEvt",
    "mouseleave .circle.team-selector": "mouseExitEvt"
  },
  initialize: function(){},
  mouseEnterEvt: function (el) {
    eventController.trigger(eventController.TEAM_SELECTOR_ENTER, $(el.currentTarget).attr('data-team'));
  },
  mouseExitEvt: function (el) {
    eventController.trigger(eventController.TEAM_SELECTOR_EXIT, $(el.currentTarget).attr('data-team'));
  },
  render: function () {
    _.each( util.teamColors, (v,k)=> {
      if (k === "nba") return;
      this.$el.append(NBAcircleTemplate({text: k, color: v, fontColor: util.getTextColor(null, v[0])}));
    })
    return this;
  }
});

module.exports = NBACircles;
