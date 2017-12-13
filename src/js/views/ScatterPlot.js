import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import * as d3 from "d3";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../util";
import ScatterPlotTemplate from "./ScatterPlot.html";
import BaseChart from "./BaseChart";

let ScatterPlot = BaseChart.extend({
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

    this.buildChart();
  },
  buildChart: function () {
    // console.log("simpleData", simpleData);

    let elemEnter = this.svg.selectAll("g")
       .data(this.data)
       .enter().append("g");

    this.viewScaleX = this.getScaleX(this.data, "fg3Pct");
    this.viewScaleY = this.getScaleY(this.data, "fG3M");

    this.addAxesX(this.size, "3-Point Percentage");
    this.addAxesY(this.size, "3-Pointers Made");
    this.addToolTip();
    this.addZoom();
    this.addShapeSVG(elemEnter, this.viewScaleX, this.viewScaleY);
    this.addTextSVG(elemEnter);
  },
  addShapeSVG: function (elemEnter) {
    let r = 10;
    let self = this;

    elemEnter.append("circle")
      .attr("r", 0 )
      .attr("stroke", "#000000")
      .attr("class", "circleH")
      .style("stroke-width",0)
      .each((d) => { d.initPos = {x: self.viewScaleX(d.fg3Pct), y: self.viewScaleY(d.fG3M)}; })
      .attr("transform", (d) => { return self.getTranslation( 0, d.initPos.y ); })
      .attr("fill", "#00FF00")
      .attr("opacity", 1)
      .call(this.getDragBehavior())
      .on('mouseover', this.tip.show)
      .on('mouseout', this.tip.hide)
      .transition()
      .duration( (d) => { return self.getAnimationDuration(self.viewScaleX(d.fg3Pct) * 2); })
      .attr("r", r)
      .attr("transform", (d) => { return  self.getTranslation( d.initPos.x, d.initPos.y ); })
      .style("fill","#ff6600")
      .style("stroke-width", 1);

  },
  addTextSVG: function (elemEnter) {
    let self = this;

    elemEnter.append("text")
      .text(function(d){ return d.playerName.split(" ")[1] }) // Last Name
      .attr("text-anchor", "middle").attr("font-size", "12").attr("opacity", 0)
      .attr("transform", function (d) {
        return self.getTranslation( self.viewScaleX(d.fg3Pct), self.viewScaleY(d.fG3M) - self.margin.textTop );
      })
      .transition()
      .delay((d) => { return self.getAnimationDuration(self.viewScaleX(d.fg3Pct) * 2); })
      .duration( (d) => { return 500; })
      .attr("opacity", 1)

  },
  addToolTip: function () {
    if (this.tip) return;

    this.tip = d3tip()
      .attr('class', 'd3-tip')
      .html(function(d) { return ScatterPlotTemplate(d) })
      .offset([-5, 0]);

    this.svg.call(this.tip);
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
  getDragBehavior: function () {
    return d3.drag()
             .on('start', this.onDragStart)
             .on('drag', this.onDrag)
             .on('end', this.onDragEnd);
  },
  onDragStart: function () {
    d3.select(this).raise();
    $("body").addClass("hide-tooltip");
  },
  onDrag: function (shape) {
    var dx = d3.event.sourceEvent.offsetX,
        dy = d3.event.sourceEvent.offsetY;

    d3.select(this)
      .attr("transform", function (d) {
        return  "translate(" + dx + " ," + dy  + ")";
      });
  },
  onDragEnd: function () {
    d3.select(this)
      .transition()
      .ease(d3.easeElasticOut)
      .attr("transform", function (d) {
        return  "translate(" + d.initPos.x + " ," + d.initPos.y + ")";
      });

    _.delay(function () {
      $("body").removeClass("hide-tooltip");
    }, 500);

  }
});

module.exports = ScatterPlot;
