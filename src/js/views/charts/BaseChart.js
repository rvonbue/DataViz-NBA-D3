import eventController from "../../controllers/eventController";
import commandController from "../../controllers/commandController";
import * as d3 from "d3";
import util from "../../util";
window.d3 = d3;
window.util = util;

let BaseChart = Backbone.View.extend({
  className: "chart",
  buildLabels: false,
  rendered: false,
  description: "DEAFUTLKASD  ",
  hide: function () { this.$el.hide(); },
  show: function () { this.$el.show(); },
  setSize: function () {
    return this.getWidthHeight();
  },
  getWidthHeight: function () {
    return {w: this.$el.width(), h: this.$el.height() };
  },
  select: function () {

  },
  resize: function () {
    this.size =  { w:resize.width, h: resize.height };
    this.svg
      .selectAll("g, text")
      .data([])
      .exit().remove()
      .attr("width", this.size.w)
      .attr("height", this.size.h);

    this.buildChart();
  },
  buildChart: function () { },
  getAnimationDuration: function (viewScale) {
    let duration = _.max([viewScale, 1000]);
    return _.min([3000,viewScale]);
  },
  getTranslation: function (x,y) {
    return "translate(" + x + " ," +  y  + ")";
  },
  addZoom: function () {
    let zoom = d3.zoom()
        .scaleExtent([1, 5])
        .translateExtent([[-100, -100], [this.size.w + 90, this.size.h + 100]])
        .on("zoom", _.bind(this.zoomed, this));
    this.svg.call(zoom);
  },
  zoomed: function () {
    this.svg.selectAll("g").attr("transform", d3.event.transform);
  },
  getScaleX: function (simpleData, propKey) {
    let xMax = _.max(simpleData, function(d){ return d[propKey]; });
    let xMin = _.min(simpleData, function(d){ return d[propKey]; });
    return d3.scaleLinear().domain([ xMin[propKey] * 0.95 , xMax[propKey] * 1.05 ]).range([ this.margin.left, this.size.w - this.margin.right ]);
  },
  getScaleY: function (simpleData, propKey) {
    let xMax = _.max(simpleData, function(d){ return d[propKey]; }) ;
    let xMin = _.min(simpleData, function(d){ return d[propKey]; });
    return d3.scaleLinear().domain([ xMax[propKey] * 1.2, 0 ]).range([ this.margin.top, this.size.h - this.margin.bottom ]);
  },
  getDragBehavior: function () {
    return d3.drag()
       .on('start', this.onDragStart)
       .on('drag', this.onDrag)
       .on('end', this.onDragEnd);
  },
  onDragStart: function () {},
  onDrag: function () {},
  onDragEnd: function () { },
  addFadeIn: function (d3Obj) {
    d3Obj.attr("opacity", 0)
      .transition()
      .duration(function () { return 1500;})
      .attr("opacity", 1);
  },
  render: function () {
    if ( this.buildLabels ) this.$el.append(ChartLabelTemplate({ label: this.label, description: this.description }));
    this.rendered = true;
    this.chartLayoutContainerEl = $(`<div class='chart-layout-container'></div>`);
    this.$el.append(this.chartLayoutContainerEl);
    return this; }
});

module.exports = BaseChart;
