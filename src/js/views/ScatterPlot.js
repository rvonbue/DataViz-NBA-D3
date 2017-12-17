import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import * as d3 from "d3";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../util";
import ScatterPlotTemplate from "./ScatterPlot.html";
import BaseChart from "./BaseChart";

let ScatterPlot = BaseChart.extend({
  className: "chart scatter-plot",
  initialize: function (options) {
    this.data = options.data;
    this.getThreePointData(options.data);
    this.margin = {top: 20, right: 20, bottom: 50, left: 60, textTop: 10, textLeft: 0};
    this.addListeners();
  },
  start: function () {
    this.size = this.setSize();
    console.log("SIZE:", this.size);
    this.createSvg();
    this.buildChart();
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
    let elemEnter = this.svg.selectAll("g")
       .data(this.data)
       .enter().append("g")
       .attr("class", "chartPoints");

    this.viewScaleX = this.getScaleX(this.data, "fg3Pct");
    this.viewScaleY = this.getScaleY(this.data, "fG3M");

    this.addAxesX("3-Point Percentage");
    this.addAxesY("3-Pointers Made");
    this.addToolTip();
    this.addZoom();
    this.addShapeSVG(elemEnter, this.viewScaleX, this.viewScaleY);
    this.addTextSVG(elemEnter);
  },
  addShapeSVG: function (elemEnter) {
    let r = 10;
    let self = this;

    let circle = elemEnter.append("circle")
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
      .on('mouseout', this.tip.hide);

    circle
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
      .attr("opacity", 1);

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
    this.svg.selectAll("g.chartPoints").attr("transform", d3.event.transform);
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

  }
});

module.exports = ScatterPlot;
