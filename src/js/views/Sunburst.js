import BaseChart from "./BaseChart";
import dataSunburst from "../data/sunburst";
import SunburstTemplate from "./sunburst.html";
import ChartLabelTemplate from "./html/chartTitle.html";
import utils from "../util";
import teamNameTemplate from "./html/addTeamNameTemplate.html";

let Sunburst = BaseChart.extend({
  className: "chart sunburst",
  label: "Sunburst Chart",
  initialize: function (options) {
    this.addListeners();
  },
  addListeners: function () {
    this.$el.on("click", ".team-name", (d) => this.clickSelectTeam(d));
    this.$el.on("click", ".team-abbreviation-container", (d) => this.destroyElRemoveTeam(d));
    this.$el.on("click", "#load-teams", (d) => this.resetChart(d));
  },
  destroyElRemoveTeam: function (d) {
    let el = $(d.currentTarget);
    let array = this.clickData.teams; // Test
    let search_term = el.find(".team-abbreviation:first").text();

    console.log("this.clickData.teams len", this.clickData.teams.length);
    this.clickData.teams = _.filter(this.clickData.teams, d => { return d !== search_term; });
  console.log("this.clickData.teams len", this.clickData.teams.length);
    el.remove();
  },
  resetChart: function () {
    this.svg
      .selectAll("g")
      .data([])
      .exit().remove();

    this.dataNBA.children = [];
    this.totalLoaded = 0;
    this.loadDataNBA();
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
    this.showLoadTeams();
    setTimeout(function () { dropdownContentEl.removeClass("pointer-events-none"); }, 250);
  },
  showLoadTeams: function () {
    this.$el.find("#load-teams")
            .addClass("show");
  },
  start: function () {
    if ( this.isReady() == false ) {
      setTimeout(()=> {this.start()}, 10);
      return;
    }
    this.initSize();
    this.setVars();
    this.createSvg();
    this.setScale();
    this.firstBuild(dataSunburst);
    this.clickData.teams = ["GSW", "HOU"];
    this.clickData.teams.forEach( (abbr)=> {
      this.addNewTeam(abbr);
    });
    console.log("this.clickData.teams len",);
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
  initSize: function () {
    this.margin = {top: 20, right: 20, bottom: 35, left: 50, textTop: 15, textDx: 35, textPadding: 35 };
    this.size = utils.getWidthHeight(this.$el);
    this.size.w = this.size.h = Math.min(this.size.w, this.size.h) * 0.9;
    console.log("SIZE::", this.size);
  },
  setVars: function () {
    this.depth = 0; // used for determing what click level User is at
    this.size.radius = (this.size.w / 2) - 15; // Magin numnber add margin so text spill out is visible
    this.animating = false;
    this.clickData = { teams:[] };
    this.dataNBA = { name: "NBA", children:[] };
    this.teamContainerEl = this.$el.find("#team-container");
  },
  firstBuild: function (data) {
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
     this.y = d3.scaleSqrt().range([0, this.size.radius]).exponent(1.8);
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
      .append('g')
        .attr("class", "ring-slice")
        .on("mouseover",function(){ d3.select(this).transition().attr("transform","scale(1.05)") })
        .on("mouseout",function(){ d3.select(this).transition().attr("transform","scale(1)") })
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
      // .attr("dy", ".4em")
      .attr("font-size", d => utils.getFontSize(this.depth, this.textScale(this.size.w)))
      .attr("alignment-baseline", "middle")
  },
  shouldCancelClick: function (d) {
    if (
        (d.depth === 0 && this.depth === 0) ||  // if Im on level 1
        (d.depth === this.depth) ||   // Is user on same level
        this.animating === true) { return true; }  // am I still animating
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
    this.$el.append(ChartLabelTemplate({ label: this.label }))
    this.$el.append(SunburstTemplate({ teamList: NBA.teams }));
    return this;
  },
  loadDataNBA: function () {
     let self = this;
     this.clickData.teams = this.clickData.teams.length > 0 ? this.clickData.teams : ["GSW", "HOU"];

     this.nbaTeams = _.map(this.clickData.teams, function (val, i) {
       return _.find(NBA.teams, function(obj){ return obj.abbreviation === val });
     })

    //  console.log("this.nbaTeams", this.nbaTeams);
    // console.log("this.this.clickData.teams", this.clickData.teams);
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
