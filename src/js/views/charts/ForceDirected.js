import eventController from "../../controllers/eventController";
import commandController from "../../controllers/commandController";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../../util";
import ScatterPlotHoverTemplate from "../html/ScatterPlotHoverLabel.html";
import BaseChart from "./BaseChart";

let BarChart = BaseChart.extend({
  className: BaseChart.prototype.className + " bar-chart",
  label: "Force Directed",
  description: "NBA Age",
  initialize: function(){
     this.margin = { top: 50, right: 20, bottom: -60, left: 60, textTop: 10, textLeft: 0, textBottom: 25 };
   },
  start: function () {
    this.data = this.getData();
    this.size = this.setSize();

    this.fData = {
      ageCount: _.map(this.data, (d, i) => Number(d)),
      ageRange: _.map(this.data, (d, i) => Number(i))
    };

    this.createSvg();
    this.buildChart();
    this.animate();
  },
  getData: function () {
    return commandController.request(commandController.GET_DATA_AGE);
  },
  resize: function (resize) {
    this.size = this.setSize();

    this.svg
      .selectAll("g, text")
      .data([])
      .exit().remove();

    this.svg
      .attr("width", this.size.width)
      .attr("height", this.size.height);

    this.buildChart();
    this.animate();
  },
  getScaleY: function () {
    return d3.scaleLinear()
      .domain([0, d3.max(this.fData.ageCount, function(d) { return d; })])
      .range([ this.size.height, this.margin.top - this.margin.bottom ]);
  },
  getScaleColor: function () {
    return d3.scaleLinear()
      .domain(this.fData.ageCount)
      .range(d3.schemeCategory10);  // ["#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2", "#31a354", "#74c476", "#a1d99b", "#c7e9c0", "#756bb1", "#9e9ac8", "#bcbddc", "#dadaeb", "#636363", "#969696", "#bdbdbd", "#d9d9d9"]
  },
  buildChart: function () {
    let y = this.viewScaleY = this.getScaleY();
    this.textScale = d3.scaleLinear().domain([400, 1900]).range([40,100])
    this.scaleColor = this.getScaleColor();
    let barWidth = (this.size.width - (this.margin.left + this.margin.right)) / this.fData.ageRange.length;

    let group = this.svg.selectAll("g")
			.data(this.fData.ageCount)
			.enter()
      .append("g");



    this.addBars(group, barWidth);
    this.addTextSVG(group, barWidth, this.fData.ageRange);
    this.addAxesY("Number of Players");

    this.svg   //axesX
      .append("g")
      .append("text")
        .attr("class", "axisX")
        .attr("x", (d)=> { return (this.size.width - this.margin.left) / 2 })
        .attr("y", (d)=> { return this.size.height + (this.margin.bottom / 2) + 10})
        .text("AGE");
  },
  addBars: function (group, barWidth) {
    let sideMargins = this.margin.left + this.margin.right;

    group
      .attr("transform", (d, i)=> { return `translate(${sideMargins + (i * barWidth) },${this.margin.bottom})`; })
      .append("rect")
        .attr("class", "animate")
        .attr("y", (d) => { return this.size.height })//y(d); })
        .attr("height", (d) => { return 0  })//this.size.height - y(d); })
        .attr("width", barWidth - 5)
        .attr("fill", "#FFFFFF")
        .attr("stroke", "#000000")
        .attr("transform", (d, i)=> { return `rotate(360)`; })
  },
  addTextSVG: function (g, barWidth) {
    g
      .append("text")
        .attr("x", (barWidth / 2) - 5)
        .attr("y", (d)=> { return this.size.height + this.margin.textBottom })
        .attr("dy", -10)
        .text( (d,i) => { return this.fData.ageRange[i]; })
        .attr("fill", "#000")
        .attr("text-anchor", "middle");
  },
  animate: function () {
    this.svg.selectAll("rect.animate")
      .transition()
      .duration(1500)
      .attr("y", (d) => { return this.viewScaleY(d); })
      .attr("height", (d) => { return this.size.height - this.viewScaleY(d); })
      .attr("fill", (d,i)=> {  return this.scaleColor(this.fData.ageRange[i])})
  },
  addAxesY: function (label) {
    let axisGY = this.svg.append("g")
      .attr("class", "axisY")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.bottom + ")");

    axisGY.append("rect")
      .attr("width", this.margin.left)
      .attr("height", this.size.height)
      .attr("x", -this.margin.left )
      .attr("fill", "#FFFFFF");

      // text label for the y axis
    axisGY.append("text")
      .attr("transform", "rotate(-90)")
      .attr("class", "label")
      .attr("y", 0 - this.margin.left - this.margin.textLeft)
      .attr("x",0 - (this.size.height / 2))
      .attr("dy", "1em")
      .attr("fill", "#FFF")
      .style("text-anchor", "middle")
      .text(label);

    this.axisY = d3.axisLeft(this.viewScaleY)
    axisGY.call(this.axisY);
  },
  createSvg: function () {
    this.svg = d3.select(this.chartLayoutContainerEl[0]) //passing in this.chartLayoutContainerEl[0]  doens't work for some reason
      .append("svg")
      .attr("width", this.size.width)
      .attr("height", this.size.height);
  },
  getWidthHeight: function () {
    return {width: this.$el.width(), height: this.$el.height() };
  },
  render: function () {
    BaseChart.prototype.render.apply(this, arguments);
    return this;
  }
});

module.exports = BarChart;
