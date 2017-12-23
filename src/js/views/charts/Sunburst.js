import BaseChart from "./BaseChart";
import commandController from "../../controllers/commandController";
// import dataSunburst from "../data/sunburst";
import SunburstOptionsTemplate from "./sunburst.html";
import ChartLabelTemplate from "../html/chartTitle.html";
import utils from "../../util";
import teamNameTemplate from "../html/addTeamNameTemplate.html";

let Sunburst = BaseChart.extend({
  className: BaseChart.prototype.className + " sunburst",
  label: "Sunburst Chart",
  description: "NBA Rosters",
  events: {
    "click .team-abbreviation-container": "destroyElRemoveTeam",
    "click .team-name": "clickSelectTeam",
    "click #load-teams": "resetChart",
    "click .chart-label": "showHideChart"
  },
  initialize: function (options) {
    _.bindAll(this, "destroyElRemoveTeam", "clickSelectTeam", "resetChart");
  },
  destroyElRemoveTeam: function (d) {
    let el = $(d.currentTarget);
    let array = this.clickData.teams; // Test
    let search_term = el.find(".team-abbreviation:first").text();

    this.clickData.teams = _.filter(this.clickData.teams, d => { return d !== search_term; });
    el.remove();
  },
  removeAllGroups: function () {
    this.svg
      .selectAll("g")
      .data([])
      .exit().remove();
  },
  resize: function (resize) {
    this.removeAllGroups();

    this.chartLayoutContainerEl.empty();
    this.initSize({ w: resize.width, h: resize.height });
    this.setScale();
    this.createSvg();
    this.computeArc(this.x, this.y);
    this.buildChart();
  },
  resetChart: function () {
    this.removeAllGroups();
    this.depth = 0;
    this.setTeamData(this.clickData.teams);
    this.firstBuild(this.dataNBA);
  },
  clickSelectTeam: function (d) {
    let el = $(d.currentTarget);
    let dropDownEl = el.closest(".dropdown");
    let dropdownContentEl = dropDownEl.find(".dropdown-content")
                                      .addClass("pointer-events-none");
    let abbreviation = NBA.teams[el.index()].abbreviation;

    this.$el.find("#team-container").append(teamNameTemplate({
       abbreviation: abbreviation,
       color: utils.getTeamColorFromAbbr(abbreviation)
    }));

    this.clickData.teams.push(abbreviation);

    setTimeout(function () { dropdownContentEl.removeClass("pointer-events-none"); }, 250);
  },
  setTeamData: function (teamsAbbreviationArray) {
    let data = commandController.request(commandController.GET_TEAM_ROSTERS, teamsAbbreviationArray);
    this.dataNBA = { name: "NBA", children: data };
  },
  start: function () {
    if ( this.isReady() == false ) {
      setTimeout(()=> {this.start()}, 10);
      return;
    }

    this.initVars();
    this.clickData.teams = ["GSW", "HOU"];
    this.setTeamData(this.clickData.teams);

    this.initSize();
    this.createSvg();
    this.setScale();
    this.firstBuild(this.dataNBA);

    this.clickData.teams.forEach( (abbr)=> {
      this.addNewTeam(abbr);
    });
  },
  addNewTeam: function (abbreviation) {
    this.teamContainerEl.append(teamNameTemplate({
       abbreviation: abbreviation,
       color: utils.getTeamColorFromAbbr(abbreviation)
    }));
  },
  isReady: function () {
    let isReady = this.$el.width() >= 200 ? true : false;
    return isReady;
  },
  initSize: function (size) {
    this.margin = {top: 20, right: 20, bottom: 35, left: 50, textTop: 15, textDx: 35, textPadding: 35 };
    this.size = size ? size : utils.getWidthHeight(this.$el);
    this.size.w = this.size.h = Math.min(this.size.w, this.size.h) * 0.9;
    this.size.radius = (this.size.w / 2) - 15; // Magin numnber add margin so text spill out is visible
  },
  initVars: function () {
    this.depth = 0; // used for determing what click level User is at
    this.animating = false;
    this.clickData = { teams:[] };
    this.dataNBA = { name: "NBA", children:[] };
    this.teamContainerEl = this.$el.find("#team-container");
  },
  firstBuild: function (data) {
    this.formatDataD3(data);
    this.computeArc(this.x, this.y);
    this.buildChart();
  },
  setScale: function () {
     this.x = d3.scaleLinear().range([0, 2 * Math.PI]);
     this.y = d3.scaleSqrt().range([0, this.size.radius]).exponent(1.8);
     this.textScale = d3.scaleLinear().domain([365, 800]).range([60,120]) //domain is max and min size of chart //range is max/min text size in percent
     this.margin.textDx = this.margin.textDx * (this.textScale(this.size.w) / 75);
  },
  formatDataD3: function (data) {
    let x = this.x,  y = this.y;

    this.partition = d3.partition();
    this.root = d3.hierarchy(data)  // Find the Root Node
       .sum(function(d) { return !d.children || d.children.length === 0 ? d.size : 0; }); // use 100% of arc
    this.partition(this.root);  // Calculate each arc

  },
  computeArc:  function (x,y) {
    this.arc = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
      .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
      .outerRadius(function(d) { return Math.max(0, y(d.y1)); });
  },
  buildChart: function () {
    this.buildRings();
    this.buildText();
  },
  buildRings: function () {
    this.svg.selectAll('g')
      .data(this.root.descendants()).enter()
      .append('g')
        .attr("class", "ring-slice")
        .on("mouseenter",function(){
          d3.select(this)
          .transition()
          .duration(50)
          .attr("transform","scale(1.05)")
          d3.select(this).raise();
        })
        .on("mouseleave",function(){
           d3.select(this)
           .transition()
           .duration(500)
           .attr("transform","scale(1)")
         })
        .on("click", d => this.click(d) )
        .append('path')                     // .attr("display", function (d) { return d.depth ? null : "none"; })  // Remove Center Pie
          .attr("d", this.arc)
          .style('stroke', d => { return utils.getTeamColor(d, d.depth % 2); })
          .style("fill", d => utils.getFillStyle(d) );

  },
  buildText: function () {
    let svgText = this.svg.selectAll(".ring-slice")  // add Labels for each node
      .append("text")
      .attr("class", (d)=> utils.getRingClasses(d) )
      .attr("fill", d => utils.getTextColor(d))
      .text( (d)=> { return  d.parent ? utils.toUpperCase(d.data.name) : " "; })

    this.updateTextTransform(svgText);
    this.updateTextAttrs(svgText);
  },
  click: function (d) {
    if (this.shouldCancelClick(d)) return; // If clicking on middle circle while zoomed out do nothing

    let x = this.x, y = this.y, radius = this.size.radius, arc = this.arc;
    this.depth = d.depth;
    this.animating = true;

    let svgTextSelection = this.svg.selectAll("text")   //hide all text elements
      .attr("opacity", function (d) { return  0; });

    svgTextSelection = utils.getVisibleTextSelection(this.svg, d);
    let popOutText = _.throttle( _.bind(this.popOutText, this), 100);

    this.svg.transition()
        .duration(750)
        .tween("scale", function() {
          var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
              yd = d3.interpolate(y.domain(), [d.y0, 1]),
              yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
          return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
        })
        .selectAll("path")
          .attrTween("d", function(d) { return function() { return arc(d); }; })
          .on("end", (d, i )=> { popOutText(svgTextSelection) });

  },
  shouldCancelClick: function (d) {
    if (
        (d.depth === 0 && this.depth === 0) ||  // if Im on level 1
        (d.depth === this.depth) ||   // Is user on same level
        this.animating === true) { return true; }  // am I still animating
    return false;
  },
  popOutText: function (svgTextSelection) {
    this.updateFirstRingText(svgTextSelection);
    this.updateTextTransform(svgTextSelection);
    this.updateTextAttrs(svgTextSelection);
    this.animateText(svgTextSelection);
  },
  updateTextTransform: function (svgSelection) {
    svgSelection = svgSelection ? svgSelection : this.svg.selectAll("text");

    svgSelection
      .attr("transform",  (d)=> {
        return utils.getTranslateRotate(this.arc.centroid(d),
          utils.computeTextRotation(d, this.x, this.depth));
      });
  },
  updateTextAttrs: function (svgText) {
    svgText
      .attr("dx", d => util.getTextOffsetDx(d, this.margin.textDx, this.depth))
      .attr("text-anchor", d => utils.getTextAnchorPosition(d, this.depth))
      .attr("font-size", d => utils.getFontSize(this.textScale(this.size.w), this.depth))
      .attr("alignment-baseline", "middle")
  },
  updateFirstRingText: function (svgTextSelection) {
    svgTextSelection
      .filter( (d,i) => {
        if (this.depth === 0) return d.depth - 1 === this.depth;
        return i === 0;
      })
      .attr("dx",  0)
      .attr("text-anchor", "middle")
      .attr("opacity", 1 )
      .attr("transform", d => utils.getTranslateRotate(this.arc.centroid(d), 0 ));
      // .attr("font-size", ()=> {  return (100 + (this.depth * 25)) + "%"});
  },
  animateText: function (svgTextSelection) {
    svgTextSelection
      // .filter(function (d, i) { return i !== 0;})
      .attr("dx", function (d) { return d.data.angleFlip ? -200 : 200 })
      .transition()
        .duration(350)
        .attr("opacity", 1)
        .attr("font-size", ()=> utils.getFontSize(this.textScale(this.size.w),this.depth))
        .attr("dx", d => util.getTextOffsetDx(d, this.margin.textDx, this.depth) );

    this.animating = false;
  },
  createSvg: function () {
    this.svg = d3.select(this.chartLayoutContainerEl[0])
      .append("svg")
      .attr("class", "sunburst")
      .attr("width", this.size.w)
      .attr("height", this.size.h)
      .append('g')  // <-- 3
      .attr('transform', 'translate(' + this.size.w / 2 + ',' + this.size.h / 2 + ')');  //
  },
   getName: function (d) {
     return d.player ? d.player : d.coachName;
   },
   render: function () {
     BaseChart.prototype.render.apply(this, arguments);
     this.$el.prepend(SunburstOptionsTemplate({ teamList: NBA.teams }));
     return this;
   }
});

module.exports = Sunburst;
