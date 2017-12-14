import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import * as d3 from "d3";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../util";
import ScatterPlotTemplate from "./ScatterPlot.html";
import BaseChart from "./BaseChart";
import data from "../data/sunburst";

let Sunburst = BaseChart.extend({
  initialize: function (options) {
    this.data = data;
    this.parentEl = options.parentEl;
    this.margin = {top: 20, right: 20, bottom: 35, left: 50, textTop: 15};
    this.size = this.setSize();
    this.size.w = 500;
    this.size.h = 500;
    this.size.radius = Math.min(this.size.w, this.size.h) / 2;
    this.color = d3.scaleOrdinal(d3.schemeCategory20b);
    console.log("SIZE:", this.size);
    this.addListeners();
    this.createSvg();
    this.formatData();
    this.buildChart();
  },
  createSvg: function () {
    this.svg = d3.select(this.parentEl[0])
      .append("svg")
      .attr("class", "sunburst")
      .attr("width", this.size.w)
      .attr("height", this.size.h)
      .append('g')  // <-- 3
      .attr('transform', 'translate(' + this.size.w / 2 + ',' + this.size.h / 2 + ')');  //
  },
  formatData: function () {
    this.partition = d3.partition()
      .size([2 * Math.PI, this.size.radius]);

    this.root = d3.hierarchy(data)  // Find the Root Node
      .sum(function (d) { return d.size});

    this.partition(this.root);  // Calculate each arc
    let color = d3.scaleOrdinal(d3.schemeCategory20);
    let arc = d3.arc()
      .startAngle(function (d) { return d.x0 })
      .endAngle(function (d) { return d.x1 })
      .innerRadius(function (d) { return d.y0 })
      .outerRadius(function (d) { return d.y1 });

    console.log("ARC:", arc);
    this.svg.selectAll('path')
      .data(this.root.descendants())
      .enter()
      .append('path')
      .attr("display", function (d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .style('stroke', '#fff')
      .style("fill", function (d) { return color((d.children ? d : d.parent).data.name); });

  },
  buildChart: function () {

  },

});

module.exports = Sunburst;
