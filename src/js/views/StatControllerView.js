import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
const NBA = require("nba");
import ScatterPlot from "./ScatterPlot";
import Sunburst from "./Sunburst";
import ChartLabelTemplate from "./html/chartTitle.html";
window.NBA = NBA;

let StatControllerView = Backbone.View.extend({
  id: "stat-view",
  events: {
    "click .chart-label": "showChart"
  },
  initialize: function (options) {
    _.bindAll(this, "showChart");
    this.childViews = [
      new Sunburst(),
      new ScatterPlot()
    ];
    this.getPlayerStats();
    $( window ).resize(_.bind( _.debounce(this.resize, 200), this));
  },
  start: function () {
    this.buildChartLabels();
    this.setSize();
  },
  resize: function () {
    let resize = this.setSize();
    this.resizeChart(resize);
  },
  setSize: function () {
    let resize = {
      height: $(window).height() - this.chartLayoutContainerEl.offset().top,
      width: $(window).width()
    }
    this.chartLayoutContainerEl.height(resize.height);
    return resize;
  },
  getPlayerStats: function () {
    let self = this;

    NBA.stats.playerStats().then(function (res, err) {
        self.sortPlayerStats(res);
    });
  },
  sortPlayerStats: function (dataDump) {
    this.data = dataDump;
    this.start();
  },
  loadChart: function (simpleData) {
    // this.loadScatterPlot(this.data);
    // this.loadSunburst();
    this.startCharts();
  },
  buildChartLabels: function () {
    this.childViews.forEach( view => { this.chartLabelContainerEl.append(ChartLabelTemplate(view)); });
  },
  resizeChart: function (resize) {
    if (this.selectedView) this.selectedView.resize(resize);
  },
  showChart: function (d) {
    let currentTarget = $(d.currentTarget);

    this.unsetSelectedChart();
    this.setSelectedChart(currentTarget.index(), currentTarget);
    if (!this.selectedView.rendered) {
      this.chartLayoutContainerEl.append(this.selectedView.render().el);
      this.selectedView.start(this.data);
    }
  },
  setSelectedChart: function (index, currentTarget) {
    this.selectedView = this.childViews[index];
    this.selectedView.show();
    currentTarget.addClass("selected");
  },
  unsetSelectedChart: function () {
    if (!this.selectedView) return;
    this.selectedView.hide();
    this.chartLabelContainerEl.find(".selected").removeClass("selected");
  },
  render: function () {
    this.chartLayoutContainerEl = $("<div class='stat-view-container'></div>");
    this.chartLabelContainerEl = $("<div class='chart-label-container'></div>");
    this.$el.append(this.chartLabelContainerEl);
    this.$el.append(this.chartLayoutContainerEl);

    return this;
  }
});

module.exports = StatControllerView;
