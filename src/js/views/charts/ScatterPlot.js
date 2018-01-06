import eventController from "../../controllers/eventController";
import commandController from "../../controllers/commandController";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../../util";
import OptionsTemplate from "./scatterPlot.html";
import ScatterPlotHoverTemplate from "../html/ScatterPlotHoverLabel.html";
import ChartLabelTemplate from "../html/chartTitle.html";
import BaseChart from "./BaseChart";

let ScatterPlot = BaseChart.extend({
  className: BaseChart.prototype.className + " scatter-plot",
  label: "Scatter Plot",
  description: "3-point Shooting",
  events: {
    "click .stat-list.main-stat": "clickStatList",
    "click .options-icon": "showHideOptions",
    "click .stat-list.playerNum": "clickPlayerNum"
  },
  initialize: function(){
     _.bindAll(this, "clickStatList", "clickPlayerNum", "highlightNode", "unhighlightNode");
     this.margin = { top: 20, right: 20, bottom: 50, left: 60, textTop: 10, textLeft: 0 };
     this.totalPlayerNum = 50;
     this.statList = {
       threePoint: {
         mainLabel: "Three Point %",
         sortBy: "fg3mRank",
         x: "fg3Pct",
         y: "fG3M",
         xLabel: "3-Point Percentage",
         yLabel: "3 Pointers Made"
       },
       rebounding: {
         mainLabel: "Offensive / Defensive Rebounds",
         sortBy: "rebRank",
         x: "oreb",
         y: "dreb",
         xLabel: "Offensive Rebounds",
         yLabel: "Defensive Rebounds"
       },
       defense: {
         mainLabel: "Block / Steal",
         sortBy: "blkRank",
         x: "blk",
         y: "stl",
         xLabel: "Blocks/game",
         yLabel: "Steals/game"
       },
       plusMinus: {
         mainLabel: "Plus Minus / Win Pct%",
         sortBy: "plusMinusRank",
         x: "plusMinus",
         y: "wPct",
         xLabel: "plusMinus",
         yLabel: "wPct"
       }
     }

     this.statName = "threePoint";

   },
  addListeners: function () {
     eventController.on(eventController.TEAM_SELECTOR_ENTER, this.highlightNode);
     eventController.on(eventController.TEAM_SELECTOR_EXIT, this.unhighlightNode);
  },
  highlightNode: function (teamAbbr) {
    this.svg.selectAll(`g.zoomPoint`)
    .filter(function(d) { return d.teamAbbreviation !== teamAbbr })
    .transition()
      .duration(()=> 250)
      .attr("opacity", 0.5);

    this.svg.selectAll(`g.zoomPoint.${teamAbbr}`)
      .raise()
      .attr("opacity", 1)
      .selectAll("circle, text")
      .attr("transform","scale(2)")

  },
  unhighlightNode: function (teamAbbr) {
    this.svg.selectAll(`g.zoomPoint`)
      .transition()
      .duration(()=> 250)
      .attr("opacity", 1);

    this.svg.selectAll(`g.zoomPoint.${teamAbbr}`)
      .selectAll("circle, text")
      .attr("transform","scale(1)");
  },
  start: function () {
    this.data = this.getData();
    this.size = this.setSize();
    this.createSvg();
    this.buildChart();
    this.animate();
    this.addListeners();
  },
  showHideOptions: function () {
    this.optionsEl.toggleClass("show")
  },
  clickStatList: function (el) {
    let text = $(el.currentTarget).data().stat;
    this.statName = text;
    this.data = this.getData();
    this.clearRebuild();
  },
  clickPlayerNum: function (el) {
    let number = Number($(el.currentTarget).text());
    this.totalPlayerNum = number;
    this.data = this.getData();
    this.clearRebuild();
  },
  clearRebuild: function () {
    this.clearSvg();
    this.buildChart();
    this.animate();
  },
  getData: function () {
    return commandController.request(commandController.GET_DATA_PLAYERS_BY_STAT, this.statList[this.statName].sortBy, this.totalPlayerNum);
  },
  resize: function (resize) {
    this.size =  { w: resize.width, h: resize.height };
    this.clearRebuild();
  },
  clearSvg: function () {
    this.svg
      .selectAll("g, text")
      .data([])
      .exit().remove();

    this.svg
      .attr("width", this.size.w)
      .attr("height", this.size.h);
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
  buildChart: function () {
    this.viewScaleX = this.getScaleX(this.data, this.statList[this.statName].x);
    this.viewScaleY = this.getScaleY(this.data, this.statList[this.statName].y);

    this.chartPointsSVG = this.svg.selectAll("g")
       .data(this.data)
       .enter().append("g")
       .attr("class",  (d)=> { return "zoomPoint " + d.teamAbbreviation; })
       .append("g")
       .attr("class", (d)=> { return "chartPoints " + d.teamAbbreviation; })
       .each((d) => {
         d.initPos = { x: this.viewScaleX(d[this.statList[this.statName].x]), y: this.viewScaleY(d[this.statList[this.statName].y]) };
         let fillstyle = util.getTeamColorFromAbbr(d.teamAbbreviation, 0 );
         d.color = {
           text: util.getTextColor(d, fillstyle),
           fill: fillstyle,
           stroke: util.getTeamColorFromAbbr(d.teamAbbreviation, 1)
         };
        })
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
        .duration( d => { return this.getAnimationDuration(this.viewScaleX(d[this.statList[this.statName].x]) * 1.5); })
        .attr("transform", d => { return this.getTranslation( d.initPos.x, d.initPos.y ); })
        .attr("opacity", 1)
  },
  getCirleRadius: function () {
    return Math.min((this.size.w /100), 10);
  },
  animateCircleEnd: function () {

    this.circleSVG
      .transition()
        .duration( (d) => { return this.getAnimationDuration(this.viewScaleX(d[this.statList[this.statName].x]) * 1.5); })
        .attr("r", this.getCirleRadius())
        .attr("opacity", 1)
        .style("fill",(d) => { return d.color.fill; })
        .style("stroke",(d) => { return d.color.stroke; })
        .style("stroke-width", 1);

  },
  animateText: function () {
    this.playerTextSVG
      .transition()
        .delay((d) => { return this.getAnimationDuration(this.viewScaleX(d[[this.statList[this.statName].x]]) * 2); })
        .duration( (d) => { return 500; })
  },
  addShapeSVG: function (elemEnter) {
    this.circleSVG = elemEnter.append("circle")
      .attr("r", this.getCirleRadius() )
      .attr("stroke", "#000000")
      .attr("class", (d)=> { return "circleH " + d.teamAbbreviation; })
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
      .html( (d)=> { return ScatterPlotHoverTemplate({ player: d, stats: this.statList[this.statName] }) })
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
        .text(this.statList[this.statName].xLabel);

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
      .text(this.statList[this.statName].yLabel);

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
    this.optionsEl = $(OptionsTemplate({ statList: this.statList }));
    this.$el.prepend(this.optionsEl[0]);
    return this;
  }
});

module.exports = ScatterPlot;
