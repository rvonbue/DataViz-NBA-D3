import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
const NBA = require("nba");
import ChartLabelTemplate from "./html/chartTitle.html";
window.NBA = NBA;
import util from "../util.js";
import DataParserLoader from "../models/DataParser";
import NBACircles from "./nbaCircles";
import ScatterPlot from "./charts/ScatterPlot";
import Sunburst from "./charts/Sunburst";
import BarChartInteractive from "./charts/BarChartInteractive";

let StatControllerView = Backbone.View.extend({
  id: "stat-view",
  events: {
    "click .chart-label": "showChart"
  },
  initialize: function (options) {
    _.bindAll(this, "showChart");
    this.childViews = [
      new Sunburst(),
      new ScatterPlot(),
      new BarChartInteractive()
    ];

    this.DataParserLoader = new DataParserLoader();
    this.DataParserLoader.once("change:playerStats", ()=> this.start() );
    this.DataParserLoader.start();
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

    if (!this.selectedView.rendered) this.firstRender();
  },
  firstRender: function () {
    this.chartLayoutContainerEl.append(this.selectedView.render().el);          //append chart container
    this.selectedView.start();
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
    // this.$el.append(this.chartLabelContainerEl);
    this.$el.append(this.chartLayoutContainerEl);
    this.headerEl = $("<div class='header'></div>");
    this.headerEl.append("<div class='title-banner'>NBA Stats with d3js v4</div>");
    this.headerEl.append(this.chartLabelContainerEl);
    this.headerEl.append(new NBACircles().render().el);
    this.$el.prepend(this.headerEl);
    return this;
  }
});

module.exports = StatControllerView;
