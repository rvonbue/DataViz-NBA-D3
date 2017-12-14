import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
const NBA = require("nba");
import ScatterPlot from "./ScatterPlot";
import Sunburst from "./Sunburst";

window.NBA = NBA;

let StatControllerView = Backbone.View.extend({
  id: "stat-view",
  initialize: function (options) {
    this.getStats();
    this.addListeners();
  },
  addListeners: function () {
    commandController.reply(commandController.GET_SCREEN_SIZE, this.getWidthHeight, this);
  },
  getWidthHeight: function () {
    return {w: this.$el.width(), h: this.$el.height() };
  },
  getStats: function () {
    let self = this;

    NBA.stats.playerStats().then(function (res, err) {
        self.sortPlayerStats(res);
    });
  },
  sortPlayerStats: function (dataDump) {
    this.data = dataDump;
    this.loadChart();
  },
  loadChart: function (simpleData) {
    // this.$el.append(template(sorted3pa[0]));
    // new ScatterPlot({ data: this.data, parentEl: this.$el });
    this.$el.append(new Sunburst({ data: this.data, parentEl: this.$el }).render().el);
  },
  appendHtml: function () {

  },
  render: function () {
    return this;
  },
});

module.exports = StatControllerView;
