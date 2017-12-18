import BaseChart from "./BaseChart";
import dataSunburst from "../data/sunburst";
import SunburstTemplate from "./sunburst.html";
import utils from "../util";

let Sunburst = BaseChart.extend({
  className: "chart sunburst",
  label: "Sunburst Chart",
  initialize: function (options) {
    this.addListeners();
  },
  start: function () {
    if ( this.isReady() == false ) {
      setTimeout(()=> {this.start()}, 10);
      return;
    }
      console.log("start::", this.isReady());
    this.initVars();
    this.createSvg();
    // this.loadDataNBA();
    this.firstBuild(dataSunburst);
  },
  isReady: function () {
    console.log(" this.$el.width()::",  this.$el.width());
    let isReady = this.$el.width() != 0 ? true : false;
    return isReady;
  },
  initVars: function () {
    this.margin = {top: 20, right: 20, bottom: 35, left: 50, textTop: 15, textDx: 35, textPadding: 35 };
    this.size = this.getWidthHeight();
    this.size.w = this.size.h = Math.min(this.size.w, this.size.h) * 0.9;
    console.log("SIZE::", this.size);
    this.totalLoaded = 0;
    this.depth = 0; // used for determing what click level User is at
    this.size.radius = (this.size.w / 2) - 15; // Magin numnber add margin so text spill out is visible
    this.animating = false;
    this.dataNBA = { name: "NBA", children:[] };
  },
  getWidthHeight: function () {
    return {w: this.$el.width(), h: this.$el.height() };
  },
  firstBuild: function (data) {
    this.setScale();
    this.formatDataD3(data);
    this.buildChart();
  },
  isAllDataLoaded: function () {
    this.totalLoaded += 1;
    if (this.totalLoaded !== this.nbaTeams.length) return;
    this.firstBuild(this.dataNBA);
  },
  setScale: function () {
     this.x = d3.scaleLinear().range([0, 2 * Math.PI]);
     this.y = d3.scaleSqrt().range([0, this.size.radius]).exponent(1.7);
     this.textScale = d3.scaleLinear().domain([365, 800]).range([80,150]) //domain is max and min size of chart //range is max/min text size in percent
     this.margin.textDx = this.margin.textDx * (this.textScale(this.size.w) / 100);
  },
  formatDataD3: function (data) {
    let x = this.x,  y = this.y;

    this.partition = d3.partition();
    this.root = d3.hierarchy(data)  // Find the Root Node
       .sum(function(d) { return !d.children || d.children.length === 0 ? d.size : 0; }); // use 100% of arc

    this.partition(this.root);  // Calculate each arc

    this.arc = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
      .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
      .outerRadius(function(d) { return Math.max(0, y(d.y1)); });
  },
  updateTextTransform: function (svgSelection) {
    svgSelection = svgSelection ? svgSelection : this.svg.selectAll("text");

    svgSelection
      .attr("transform",  (d)=> {
        return utils.getTranslateRotate(this.arc.centroid(d),
          utils.computeTextRotation(d, this.x));
      });
  },
  buildChart: function () {
    utils.buildTeamColors(utils.getAllTeamNames(this.root));
    this.buildRings();
    this.buildText();
  },
  buildRings: function () {
    this.svg.selectAll('g')
      .data(this.root.descendants()).enter()
      .append('g').attr("class", "ring-slice")
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
      .attr("fill", d => utils.getFontColor(d))
      .text( (d)=> { return  d.parent ? utils.toUpperCase(d.data.name) : " "; });

    this.updateTextTransform(svgText);
    this.updateTextAttrs(svgText);
  },
  updateTextAttrs: function (svgText) {
    svgText
      .attr("dx", d => util.getTextOffsetDx(d, this.margin.textDx, this.depth))
      .attr("text-anchor", d => utils.getTextAnchorPosition(d, this.depth))
      .attr("dy", ".4em")
      .attr("font-size", d => utils.getFontSize(this.depth, this.textScale(this.size.w)))
  },

  shouldCancelClick: function (d) {
    if (
        (d.depth === 0 && this.depth === 0) ||
        (d.depth === this.depth) ||
        this.animating === true) { return true; }
    return false;
  },
  click: function (d) {
    if (this.shouldCancelClick(d)) return; // If clicking on middle circle while zoomed out do nothing

    let x = this.x, y = this.y, radius = this.size.radius, arc = this.arc;
    this.depth = d.depth;
    this.animating = true;

    let svgTextSelection = this.svg.selectAll("text")   //hide all text elements
      .attr("opacity", function (d) { return  0; });

    svgTextSelection = utils.getVisibleTextSelection(this.svg, d);

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
          .on("end", (d, i )=> { this.popOutText(svgTextSelection, i) });

  },
  popOutText: function (svgTextSelection, i) {
    if (i !== 0 ) return;
    this.updateTextTransform(svgTextSelection);
    this.updateTextAttrs(svgTextSelection);
    this.updateFirstRingText(svgTextSelection);
    this.animateText(svgTextSelection);
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
      .attr("transform", d => utils.getTranslateRotate(this.arc.centroid(d), 0 ))
      .attr("font-size", ()=> {  return (100 + (this.depth * 25)) + "%"});
  },
  animateText: function (svgTextSelection) {
    svgTextSelection
      .filter(function (d, i) { return i !== 0;})
      .attr("dx", function (d) { return d.data.angleFlip ? -200 : 200 })
      .transition()
        .duration(350)
        .attr("opacity", 1)
        .attr("font-size", ()=> utils.getFontSize(this.depth, this.textScale(this.size.w)))
        .attr("dx", d => util.getTextOffsetDx(d, this.margin.textDx, this.depth) );

    this.animating = false;
  },
  createSvg: function () {

    this.svg = d3.select(this.$el[0])
      .append("svg")
      .attr("class", "sunburst")
      .attr("width", this.size.w)
      .attr("height", this.size.h)
      .append('g')  // <-- 3
      .attr('transform', 'translate(' + this.size.w / 2 + ',' + this.size.h / 2 + ')');  //
  },
  render: function () {
    this.$el.append(SunburstTemplate({ label: this.label }));
    return this;
  },

   loadDataNBA: function () {
     let self = this;
     this.nbaTeams = [NBA.teams[9], NBA.teams[10]],  //just grabbed 4 best teams so don't have to load ton data NBA.teams[1], NBA.teams[5]

     this.nbaTeams.forEach( (d, i)=> {

       NBA.stats.commonTeamRoster({"TeamID": d.teamId }).then(function (res, err) {
         self.teamRosterLoaded(d, res);
       });
     });

   },
   getVal: function (arr) {
     let peopleArr = arr.map( (obj)=> {
       let name =  obj.player ? obj.player.split(" ")[1] : obj.lastName.replace("'", "");
       return {
         name: name ? name : "TEST",
         size: 5
        };
     });

     return peopleArr;
   },
   getChildren: function (children) {
     let getVal = this.getVal;
     return _.map(children, (val, key)=> {
       let name = (key === "commonTeamRoster") ? "Roster" : key;
       return {
         name: name ? name : "TEST",
         children: getVal(val),
         size: 10
        };
     });
   },
   getDataPoint: function (name, children) {
     return {
       name: name ? name : "TEST",
       children: this.getChildren(children),
       size: 20
     };
   },
   getName: function (d) {
     return d.player ? d.player : d.coachName;
   },
   teamRosterLoaded: function (teamData, data) {
     let self = this;
     this.dataNBA.children.push(
       this.getDataPoint(teamData.abbreviation, data)
     );
     // console.log(JSON.stringify(this.dataNBA, null, 4));
     this.isAllDataLoaded();
   }
});

module.exports = Sunburst;
