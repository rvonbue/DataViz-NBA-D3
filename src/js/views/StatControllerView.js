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
    this.childViewsDataPending = [];
    this.getPlayerStats();
  },
  start: function () {
    this.loadChart();
  },
  getPlayerStats: function () {
    let self = this;

    NBA.stats.playerStats().then(function (res, err) {
        self.sortPlayerStats(res);
    });
  },
  sortPlayerStats: function (dataDump) {
    this.data = dataDump;
    this.childViewsDataPending.forEach( (view)=> {
      view.start(dataDump);
    });
  },
  loadScatterPlot: function (data) {
    let scatterPlot = new ScatterPlot();
    this.$el.append(scatterPlot.render().el);

    if (!this.data) this.childViewsDataPending.push(scatterPlot);
  },
  loadSunburst: function () {
    let sunburst = new Sunburst();
    this.$el.append(sunburst.render().el);
    this.childViews.push(sunburst);
  },
  loadChart: function (simpleData) {
    this.loadScatterPlot(this.data);
    this.loadSunburst();
    this.startCharts();
  },
  startCharts: function () {
    this.childViews.forEach( (view)=> {
      view.start();
    });
  },
  render: function () {
    return this;
  },
});

module.exports = StatControllerView;
