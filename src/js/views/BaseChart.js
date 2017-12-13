import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import * as d3 from "d3";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../util";
import ScatterPlotTemplate from "./ScatterPlot.html";
window.d3 = d3;
window.util = util;

let BaseChart = Backbone.View.extend({
  initialize: function (options) {
    this.data = options.data;
    this.parentEl = options.parentEl;
    this.margin = {top: 20, right: 20, bottom: 50, left: 50, textTop: 15};

    var throttled = _.debounce(this.resizeChart, 200);

    $( window ).resize(_.bind(throttled, this));
    let size = this.setSize();
    this.createSvg(size);
    this.buildChart(options.data, size);
  },
  setSize: function () {
    this.size = commandController.request(commandController.GET_SCREEN_SIZE);
    return this.size;
  },
  resizeChart: function () {
    this.setSize();

    this.svg
      .selectAll("g, text")
      .data([])
      .exit().remove()
      .attr("width", this.size.w)
      .attr("height", this.size.h);

    this.buildScatterPlot();
  },
  buildChart: function () {
    // // console.log("simpleData", simpleData);
    //
    // let elemEnter = this.svg.selectAll("g")
    //    .data(this.data)
    //    .enter().append("g");
    //
    // this.viewScaleX = this.getScaleX(this.data, this.size);
    // this.viewScaleY = this.getScaleY(this.data, this.size);
    //
    // this.addAxesX(this.size);
    // this.addAxesY(this.size);
    // this.addToolTip();
    // this.addZoom();
    // this.addShapeSVG(elemEnter, this.viewScaleX, this.viewScaleY);
    // this.addTextSVG(elemEnter);
  },
  getAnimationDuration: function (viewScale) {
    let duration = _.max([viewScale, 1000]);
    return _.min([3000,viewScale]);
  },
  getTranslation: function (x,y) {
    return "translate(" + x + " ," +  y  + ")";
  },
  addZoom: function () {
    let zoom = d3.zoom()
        .scaleExtent([1, 40])
        .translateExtent([[-100, -100], [this.size.w + 90, this.size.h + 100]])
        .on("zoom", _.bind(this.zoomed, this));
    this.svg.call(zoom);
  },
  zoomed: function () {
    console.log("Zoomed");
    this.svg.selectAll("g").attr("transform", d3.event.transform);
    // gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
    // gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
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
  addAxesX: function (size, label) {

    this.addFadeIn(
      this.svg.append("g")
        .attr("transform", "translate(0," + (size.h - this.margin.bottom) + ")")
        .call(d3.axisBottom(this.viewScaleX))
    );

    // text label for the x axis
    this.addFadeIn(
      this.svg.append("text")
        .attr("transform",
              "translate(" + (size.w / 2) + " ," +
                             (size.h - 15)  + ")")
        .style("text-anchor", "middle")
        .text(label)
    );
  },
  addAxesY: function (size, label) {

    this.addFadeIn(   // Add the y Axis
      this.svg.append("g")
      .attr("transform", "translate(" + this.margin.left + "," + 0 + ")")
      .call(d3.axisLeft(this.viewScaleY))
    );

    this.addFadeIn(   // text label for the y axis
      this.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - this.margin.left + 50)
        .attr("x",0 - (this.size.h / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(label)
    );

  },
  addFadeIn: function (d3Obj) {
    d3Obj.attr("opacity", 0)
      .transition()
      .duration(function () {
        return 1500;
      })
      .attr("opacity", 1);
  },
  createSvg: function () {
    this.svg = d3.select(this.parentEl[0])
      .append("svg")
      .attr("width", this.size.w)
      .attr("height", this.size.h);
  },
  render: function () { return this; }
});

module.exports = BaseChart;
