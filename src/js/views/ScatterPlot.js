import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import * as d3 from "d3";

window.d3 = d3;

let ScatterPlot = Backbone.View.extend({
  initialize: function (options) {
    this.data = options.data;
    this.parentEl = options.parentEl;
    this.margin = {top: 20, right: 20, bottom: 50, left: 50};

    let size = this.setSize();
    this.createSvg(size);
    this.buildScatterPlot(options.data, size);
  },
  setSize: function () {
    this.size = commandController.request(commandController.GET_SCREEN_SIZE);
    // let size = {
    //   w: this.size.w - this.margin.left - this.margin.right,
    //   h: this.size.h - this.margin.top - this.margin.bottom
    // }
    return this.size;
  },
  buildScatterPlot: function (simpleData, size) {
    // console.log("simpleData", simpleData);
    let r = 10;
    var elem = this.svg.selectAll("g myCircleText")
       .data(simpleData);

    console.log("size", size);

    let viewScaleX = this.getScaleX(simpleData, size);
    let viewScaleY = this.getScaleY(simpleData, size);

    this.addAxesX(size, viewScaleX);
    this.addAxesY(size, viewScaleY);

    let elemEnter = elem.enter()
	    .append("g");

    var circleInner = elemEnter.append("circle")
      .attr("r", r )
      .attr("stroke", "#000000")
      .attr("cx", function (d, i) { return viewScaleX(d.fg3Pct)})
      .attr("cy", function (d, i) { return viewScaleY(d.fG3M)})
      .attr("fill", "#ff6600")
      .attr("opacity", 1);

    // elemEnter.append("text")
    //   .text(function(d){ return d.fg3Pct })
    //   .attr("text-anchor", "middle")
    //   .attr("font-size", "10")
    //   .attr("dx", function (d, i) {  return viewScaleX(d.fg3Pct)})
    //   .attr("dy", function (d, i) { return viewScaleY(d.fg3PctRank)});

  },
  getScaleX: function (simpleData, size) {
    let xMax = _.max(simpleData, function(d){ return d.fg3Pct; });
    let xMin = _.min(simpleData, function(d){ return d.fg3Pct; });
    return d3.scaleLinear().domain([xMin.fg3Pct * 0.95 , xMax.fg3Pct * 1.1]).range([ this.margin.left, this.size.w - this.margin.right ]);
  },
  getScaleY: function (simpleData, size) {
    let xMax = _.max(simpleData, function(d){ return d.fG3M; });
    let xMin = _.min(simpleData, function(d){ return d.fG3M; });
    return d3.scaleLinear().domain([ xMax.fG3M * 1.1, xMin.fG3M * 0.95 ]).range([ this.margin.top, this.size.h - this.margin.bottom ]);
  },
  addAxesX: function (size, x) {
    this.svg.append("g")
      .attr("transform", "translate(0," + (size.h - this.margin.bottom) + ")")
      .call(d3.axisBottom(x));

    // text label for the x axis
    this.svg.append("text")
      .attr("transform",
            "translate(" + (size.w / 2) + " ," +
                           (size.h) + ")")
      .style("text-anchor", "middle")
      .text("3-Point Percentage");
  },
  addAxesY: function (size, y) {
    // Add the y Axis
    this.svg.append("g")
      .attr("transform", "translate(" + this.margin.left + "," + 0 + ")")
      .call(d3.axisLeft(y));
  // text label for the y axis
    this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left + 50)
      .attr("x",0 - (size.h / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("3-Pointers Made");
  },
  addTrans: function () {
    // .transition()
    // .duration(1500)
    // .attr("r", 50)
    // .style("fill","#ff6600")
    // .style("stroke-width",3);
  },
  createSvg: function () {

    this.svg = d3.select(this.parentEl[0])
      .append("svg")
      .attr("width", this.size.w)
      .attr("height", this.size.h);
  },
  render: function () {
    // this.$el.append(template);
    return this;
  }
});

module.exports = ScatterPlot;
