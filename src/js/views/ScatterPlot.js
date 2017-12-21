import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../util";
import ScatterPlotTemplate from "./html/ScatterPlotHoverLabel.html";
import ChartLabelTemplate from "./html/chartTitle.html";
import BaseChart from "./BaseChart";

let ScatterPlot = BaseChart.extend({
  className: BaseChart.prototype.className + " scatter-plot",
  label: "Scatter Plot",
  description: "3-point Shooting",
  initialize: function(){
     this.margin = { top: 20, right: 20, bottom: 50, left: 60, textTop: 10, textLeft: 0 };
   },
  start: function (data) {
    this.getThreePointData(data);
    this.size = this.setSize();
    this.createSvg();
    this.buildChart();
    this.animate();
  },
  resize: function (resize) {
    this.size =  { w:resize.width, h: resize.height };

    this.svg
      .selectAll("g, text")
      .data([])
      .exit().remove()
      .attr("width", this.size.w)
      .attr("height", this.size.h);

    this.buildChart();
    this.animate();
  },
  getThreePointData: function (dataDump) {
    let objKey = _.keys(dataDump);  // data dump return POJO with one value an array
    let sorted3pa = _.sortBy(dataDump[objKey], "fg3mRank");

    sorted3pa.forEach( function (d, i) {
      if ( d.gpRank > 300 ) sorted3pa.splice(i, 1);  // remove players who don't play alot of games
    });
    sorted3pa.length = 50;  // get top 30 players

    let simpleData = [];
    _.each(sorted3pa, function (player) {
      simpleData.push(
        {
          playerName: player.playerName,
          fG3A: player.fG3A,
          fG3M: player.fG3M,
          fg3Pct: player.fg3Pct,
          fg3PctRank: player.fg3PctRank,
        }
      )
    });
    this.data = simpleData;
  },
  buildChart: function () {
    this.viewScaleX = this.getScaleX(this.data, "fg3Pct");
    this.viewScaleY = this.getScaleY(this.data, "fG3M");

    this.chartPointsSVG = this.svg.selectAll("g")
       .data(this.data)
       .enter().append("g")
       .attr("class", "zoomPoint")
       .append("g")
       .attr("class", "chartPoints")
       .each((d) => { d.initPos = {x: this.viewScaleX(d.fg3Pct), y: this.viewScaleY(d.fG3M)}; })
       .attr("transform", (d) => { return this.getTranslation( d.initPos.x, d.initPos.y ); })
       .attr("opacity", 0)
       .call(this.getDragBehavior())

    this.addAxesX("3-Point Percentage");
    this.addAxesY("3-Pointers Made");
    this.addToolTip();
    this.addZoom();
    this.addShapeSVG(this.chartPointsSVG, this.viewScaleX, this.viewScaleY);
    this.addTextSVG(this.chartPointsSVG);
  },
  animate: function () {
    this.animateGroupEnd();
    this.animateCircleEnd();
    this.animateText();
  },
  animateGroupEnd: function () {
    this.chartPointsSVG
      .attr("transform", (d,i) => { return this.getTranslation( 0, this.size.h ); })
      .transition()
        .duration( d => { return this.getAnimationDuration(this.viewScaleX(d.fg3Pct) * 1.5); })
        .attr("transform", d => { return this.getTranslation( d.initPos.x, d.initPos.y ); })
        .attr("opacity", 1)
  },
  animateCircleEnd: function () {
    let r = Math.min((this.size.w / 90), 10);

    this.circleSVG
      .transition()
        .duration( (d) => { return this.getAnimationDuration(this.viewScaleX(d.fg3Pct) * 1.5); })
        .attr("r", r)
        .attr("opacity", 1)
        .style("fill","#ff6600")
        .style("stroke-width", 1);

  },
  animateText: function () {
    this.playerTextSVG
      .transition()
        .delay((d) => { return this.getAnimationDuration(this.viewScaleX(d.fg3Pct) * 2); })
        .duration( (d) => { return 500; })
  },
  addShapeSVG: function (elemEnter) {
    let r = Math.min((this.size.w / 90), 10);

    this.circleSVG = elemEnter.append("circle")
      .attr("r", r )
      .attr("stroke", "#000000")
      .attr("class", "circleH")
      .style("stroke-width",1)
      .style("fill","#00FF00")
      .on('mouseover', this.tip.show)
      .on('mouseout', this.tip.hide);
  },
  addTextSVG: function (elemEnter) {
    this.playerTextSVG = elemEnter.append("text")
      .text(function(d){ return d.playerName.split(" ")[1] }) // Last Name
      .attr("text-anchor", "middle").attr("font-size", "12").attr("opacity", 1)
      .attr("class", "playerText")
      .attr("dy", () => -this.margin.textTop);
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
        .scaleExtent([1, 3])
        .translateExtent([[0, 0], [this.size.w , this.size.h ]])
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
  addAxesX: function (label) {
    let axisGX = this.svg.append("g")
        .attr("class", "axisX")
        .attr("fill", "#000000")
        .attr("transform", "translate(0," + (this.size.h - this.margin.bottom) + ")");

    axisGX
      .append("rect")
      .attr("width", this.size.w)
      .attr("height", this.margin.bottom)
      .attr("fill", "#FFFFFF");

    axisGX.
      append("text")
        .attr("class", "label")
        .attr("transform",
               "translate(" + (this.size.w / 2) + " ," +
                              (this.margin.bottom - this.margin.textTop) + ")")
        .style("text-anchor", "middle")
        .text(label);

    this.axisX = d3.axisBottom(this.viewScaleX)
    axisGX.call(this.axisX);

    this.addFadeIn(axisGX);
  },
  addAxesY: function (label) {
    let axisGY = this.svg.append("g")
      .attr("class", "axisY")
      .attr("transform", "translate(" + this.margin.left + "," + 0 + ")");

    axisGY.append("rect")
      .attr("width", this.margin.left)
      .attr("height", this.size.h)
      .attr("x", -this.margin.left )
      .attr("fill", "#FFFFFF");

      // text label for the y axis
    axisGY.append("text")
      .attr("transform", "rotate(-90)")
      .attr("class", "label")
      .attr("y", 0 - this.margin.left - this.margin.textLeft)
      .attr("x",0 - (this.size.h / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(label);

    this.axisY = d3.axisLeft(this.viewScaleY)
    axisGY.call(this.axisY);
    this.addFadeIn(axisGY);
  },
  createSvg: function () {
    this.svg = d3.select(this.chartLayoutContainerEl[0]) //passing in this.chartLayoutContainerEl[0]  doens't work for some reason
      .append("svg")
      .attr("width", this.size.w)
      .attr("height", this.size.h);
  },
  render: function () {
    BaseChart.prototype.render.apply(this, arguments);
    return this;
  }
});

module.exports = ScatterPlot;
