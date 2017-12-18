import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
const NBA = require("nba");
import ScatterPlot from "./ScatterPlot";
import Sunburst from "./Sunburst";

window.NBA = NBA;

let StatControllerView = Backbone.View.extend({
  id: "stat-view",
  initialize: function (options) {
    this.childViews = [];
  },
  start: function () {
    // this.getStats();
    this.loadChart();
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
  loadScatterPlot: function (data) {
    let scatterPlot = new ScatterPlot({ data: data });
    this.$el.append(scatterPlot.render().el);
    scatterPlot.start();
    this.childViews.push(scatterPlot);
  },
  loadSunburst: function () {
    let sunburst = new Sunburst();
    this.$el.append(sunburst.render().el);
    sunburst.start();
    this.childViews.push(sunburst);
  },
  loadChart: function (simpleData) {
    // this.loadScatterPlot(this.data);
    this.loadSunburst();
  },
  render: function () {
    return this;
  },
});

module.exports = StatControllerView;
