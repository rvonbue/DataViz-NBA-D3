import eventController from "../../controllers/eventController";
import commandController from "../../controllers/commandController";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../../util";
import ScatterPlotHoverTemplate from "../html/ScatterPlotHoverLabel.html";
import BaseChart from "./BaseChart";

let BarChart = BaseChart.extend({
  className: BaseChart.prototype.className + " bar-chart",
  label: "Bar Chart",
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
  addTextSVG: function (g, barWidth) {
    g
      .append("text")
        .attr("x", (barWidth / 2) - 5)
        .attr("y", (d)=> { return this.size.height + this.margin.textBottom })
        // .attr("font-size", ()=> {
        //   console.log("textScale",this.textScale(this.size.width) )
        //   return this.textScale(this.size.width)+ "%" })
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
  select: function () {

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
  addToolTip: function () {
    if (this.tip) return;

    this.tip = d3tip()
      .attr('class', 'd3-tip')
      .html(function(d) { return ScatterPlotHoverTemplate(d) })
      .offset([-5, 0]);

    this.svg.call(this.tip);
  },
  addZoom: function () {

    let zoom = d3.zoom()
        .scaleExtent([1, 3])
        .translateExtent([[0, 0], [this.size.width , this.size.height ]])
        .on("zoom", _.bind(this.zoomed, this));

    this.svg.call(zoom);
  },
  zoomed: function () {
    this.svg.selectAll("g.zoomPoint").attr("transform", d3.event.transform);
    this.svg.select("g.axisX").call(this.axisX.scale(d3.event.transform.rescaleX(this.viewScaleX)));
    this.svg.select("g.axisY").call(this.axisY.scale(d3.event.transform.rescaleY(this.viewScaleY)));
  },
  onDragStart: function () {
    d3.select(this).raise();
    $("body").addClass("hide-tooltip");
  },
  onDrag: function () {
    var dx = d3.event.sourceEvent.offsetX,
        dy = d3.event.sourceEvent.offsetY;

    d3.select(this)
      .attr("transform", function (d) { return  "translate(" + dx + " ," + dy  + ")"; });
  },
  onDragEnd: function () {
    d3.select(this)
      .transition()
      .ease(d3.easeElasticOut)
      .attr("transform", function (d) {
        return  "translate(" + d.initPos.x + " ," + d.initPos.y + ")";
      });

    _.delay(function () { $("body").removeClass("hide-tooltip"); }, 500);

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
