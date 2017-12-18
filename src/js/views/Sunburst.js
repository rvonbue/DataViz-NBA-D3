import { getColors as getNbaColors, getMainColor as getNbaMainColor}  from 'nba-color';

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
    this.initVars();
    this.createSvg();
    // this.loadDataNBA();
    this.firstBuild(dataSunburst);
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
  },
  formatDataD3: function (data) {
    let x = this.x,  y = this.y;

    this.partition = d3.partition();
      // .size([2 * Math.PI, this.size.radius]);

    this.root = d3.hierarchy(data)  // Find the Root Node
       .sum(function(d) { return !d.children || d.children.length === 0 ? d.size : 0; }); // use 100% of arc

    this.partition(this.root);  // Calculate each arc

    this.arc = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
      .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
      .outerRadius(function(d) { return Math.max(0, y(d.y1)); });
  },
  updateTextTranslationRot: function (svgSelection) {
    svgSelection = svgSelection ? svgSelection : this.svg.selectAll("text");

    svgSelection
      .attr("transform",  (d)=> {
        return utils.getTranslateRotate(this.arc.centroid(d),
          utils.computeTextRotation(d, this.x));
      });
  },
  buildChart: function () {
    const self = this;

    let teams = this.root.children.map( function (obj) {
      return obj.data.name;
    });
    utils.buildTeamColors(teams);


    this.svg.selectAll('g')
      .data(this.root.descendants()).enter()
      .append('g').attr("class", "node")
        .on("click", d => this.click(d) )
        .append('path')                     // .attr("display", function (d) { return d.depth ? null : "none"; })  // Remove Center Pie
          .attr("d", self.arc)
          .style('stroke', d => { return utils.getTeamColor(d, d.depth % 2); })
          .style("fill", d => utils.getFillStyle(d) );

    let svgText = this.svg.selectAll(".node")  // add Labels for each node
      .append("text")
      .attr("class", (d)=> {
        if (d.depth === 0 ) return;
        return this.getRingClasses(d.ancestors(), d.data.name);
      })
      .text( (d)=> { return  d.parent ? utils.toUpperCase(d.data.name) : " "; });

    this.updateTextTranslationRot(svgText);
    this.updateTextAttrs(svgText);
  },
  updateTextAttrs: function (svgText) {
    svgText
      .attr("dx", d => util.getTextOffsetDx(d, this.margin.textRingPadding))
      .attr("text-anchor", function (d) { return  d.data.angleFlip ? "end" : "start"; })
      .attr("dy", ".4em");
  },
  getRingClasses: function (ancestors,dataName) {
    let name = _.reduce(ancestors ,function (memo, node, i) {
      if ( i===0 ) return dataName;
      return memo + " " + node.data.name;
    }, "");
    return name;
  },

  getVisibleTextSelection: function (svgText, d) {
    let teamName = utils.getTeamName(d.ancestors());
    teamName = teamName.length <= 0 ? teamName : "." + teamName;
    return this.svg.selectAll(`text.${d.data.name}${teamName}`);
  },
  click: function (d) {
    if ((d.depth === 0 && this.depth === 0) || (d.depth === this.depth) ) return; // If clicking on middle circle while zoomed out do nothing
    this.depth = d.depth;
    let self = this;
    let svgTextSelection = this.svg.selectAll("text")   //hide all text elements
      .attr("opacity", function (d) { return  0; });

    svgTextSelection = this.getVisibleTextSelection(svgTextSelection, d);

    this.svg.transition()
        .duration(750)
        .tween("scale", function() {
          var xd = d3.interpolate(self.x.domain(), [d.x0, d.x1]),
              yd = d3.interpolate(self.y.domain(), [d.y0, 1]),
              yr = d3.interpolate(self.y.range(), [d.y0 ? 20 : 0, self.size.radius]);
          return function(t) { self.x.domain(xd(t)); self.y.domain(yd(t)).range(yr(t)); };
        })
        .selectAll("path")
          .attrTween("d", function(d) { return function() { return self.arc(d); }; })
          .on("end", (d, i )=> {
            if (i !== 0 ) return; //call this once
            this.popOutText(svgTextSelection);
          });

  },
  popOutText: function (svgTextSelection) {
    this.updateTextTranslationRot(svgTextSelection);
    this.updateTextAttrs(svgTextSelection);

    svgTextSelection
      .attr("dx", function (d) { return d.data.angleFlip ? -200 : 200 })
      .transition()
        .duration(250)
        .attr("opacity", function (d) { return 1; })
        .attr("dx", (d) => {
          let textPadding = Math.max(this.margin.textRingPadding, (this.margin.textRingPadding * this.depth));
          return util.getTextOffsetDx(d, textPadding);
        })
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
  initVars: function () {
     this.margin = {top: 20, right: 20, bottom: 35, left: 50, textTop: 15, textRingPadding: 35 };
     this.size = this.setSize();
     let widthHeight = Math.min(this.size.w, this.size.h);
     this.size.w = this.size.h = widthHeight
     this.totalLoaded = 0;
     this.depth = 0; // used for determing what click level User is at
     this.size.radius = widthHeight / 2 - (widthHeight / 13); // Magin numnber add margin so text spill out is visible
     this.dataNBA = { name: "NBA", children:[] };
   },
   loadDataNBA: function () {
     let self = this;
     this.nbaTeams = [  NBA.teams[7], NBA.teams[8],NBA.teams[9], NBA.teams[10]],  //just grabbed 4 best teams so don't have to load ton data NBA.teams[1], NBA.teams[5]

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
