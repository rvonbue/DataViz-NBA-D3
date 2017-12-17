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
    // this.loadChart();
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
    let scatterPlot = new ScatterPlot({ data: this.data, parentEl: this.$el });
    this.$el.append(scatterPlot.render().el);
    scatterPlot.start();

    let sunburst = new Sunburst();
    this.$el.append(sunburst.render().el);
    sunburst.start();
  },
  render: function () {
    return this;
  },
});

module.exports = StatControllerView;
