import * as d3 from "d3";
import { getColors as getNbaColors, getMainColor as getNbaMainColor}  from 'nba-color';

import BaseChart from "./BaseChart";
import dataSunburst from "../data/sunburst";
import SunburstTemplate from "./sunburst.html";

let Sunburst = BaseChart.extend({
  className: "chart sunburst",
  label: "Sunburst Chart",
  initialize: function (options) {
    this.addListeners();
  },
  start: function () {
    this.initVars();
    this.createSvg();
    // this.loadDataNBA(options.data);
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
     this.y = d3.scaleLinear().range([0, this.size.radius]);
  },
  formatDataD3: function (data) {
    let x = this.x;
    let y = this.y;

    this.partition = d3.partition();
      // .size([2 * Math.PI, this.size.radius]);

    this.root = d3.hierarchy(data)  // Find the Root Node
       .sum(function(d) { return !d.children || d.children.length === 0 ? d.size :0; }); // use 100% of arc

    this.partition(this.root);  // Calculate each arc

    this.arc = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
      .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
      .outerRadius(function(d) { return Math.max(0, y(d.y1)); });
  },
  computeTextRotation: function (d, x) {
   let angle = (x((d.x0 + d.x1)/2) - Math.PI / 2) / Math.PI * 180;

    switch(d.depth) {
      case 0: {
        angle -= 90;
        break;
      }
      case 1: {
        angle = (angle >= 180) ? angle + 180 : angle;
        break;
      }
      case 2: {
        angle = angle < 0 ? angle + 180 : angle;
        angle = (angle < 180) ? angle - 90 : angle + 90;
        break;
      }
      case 3: {
        angle = (angle >= 90) ? angle + 180 : angle;
        break;
      }
      default: {
        angle = (angle < 180) ? angle - 90 : angle + 90;
        break
      }
    }

    return angle; // labels as spokes
  },
  updateTextPosRot: function (svgSelection) {
    svgSelection = svgSelection ? svgSelection : this.svg.selectAll("text");

    svgSelection
      .attr("transform",  (d)=> {
        let stringTxt = "translate(" + this.arc.centroid(d) + ")rotate(";
        return stringTxt + this.computeTextRotation(d, this.x) + ")";
      });
  },
  buildTeamColors: function (teams) {
    let teamColors = {"nba": ["rgba(0,0,0,0)", "rgba(0,0,0,0)"]};
    teams.forEach( function (teamName) {
      teamColors[teamName] =  _.map(getNbaColors(teamName), function (color) {return color.hex });
    });
    return teamColors;
  },
  buildChart: function () {
    const self = this;

    let teams = this.root.children.map( function (obj) {
      return obj.data.name;
    });

    this.teamColors = this.buildTeamColors(teams);

    let arcs = this.svg.selectAll('g')
      .data(this.root.descendants())
      .enter().append('g').attr("class", "node")
      .on("click", (d)=> { this.click(d); })
      .append('path')
      // .attr("display", function (d) { return d.depth ? null : "none"; })  // Remove Center Pie
      .attr("d", self.arc)


      .style('stroke', (d, i)=> { return this.getTeamColor(d,d.depth % 2); })
      .style("fill", (d, i)=> {
        let index = d.depth % 2;
        index = index ? 0 : 1;
        return this.getTeamColor(d, index);
      });

    let svgText = this.svg.selectAll(".node")  // add Labels for each node
      .append("text")
      .attr("class", (d)=> {
        if (d.depth === 0 ) return;
        return this.getSliceClasses(d.ancestors(), d.data.name);
      })
      .text( (d)=> { return  d.parent ? this.toUpperCase(d.data.name) : " "; })
      .attr("dx", "-20")
      .attr("dy", ".5em");

    this.updateTextPosRot(svgText);
     // .text(function(d) { return d.parent ? d.data.name : "" });
  },
  getTeamColor: function (d, index) {
    let teamName = this.getTeamName(d.ancestors());

    let color = this.teamColors[teamName ? teamName : "nba"][index];

    return color;
  },
  getSliceClasses: function (ancestors,dataName) {
    let name = _.reduce(ancestors ,function (memo, node, i) {
      if ( i===0 ) return dataName;
      return memo + " " + node.data.name;
    }, "");
    return name;
  },
  getTeamName: function (ancestors) {
    if (ancestors.length < 2) return "";
    return ancestors[ancestors.length - 2].data.name;
  },
  toUpperCase: function (stringText) {
    return stringText.charAt(0).toUpperCase() + stringText.slice(1);
  },
  getVisibleTextSelection: function (svgText, d) {
    let teamName = this.getTeamName(d.ancestors());
    teamName = teamName.length <= 0 ? teamName : "." + teamName;
    let selector = `text.${d.data.name}${teamName}`;
    return this.svg.selectAll(selector);
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
      .on("end", (d)=> {
        this.updateTextPosRot(svgTextSelection);
          svgTextSelection
            .transition()
            .duration(50)
            .attr("opacity", function (d) {
              return 1;
          });
        // svgText
      });

  },
  textFits: function (d, x, y) {
    const CHAR_SPACE = 6;

    const deltaAngle = x(d.x1) - x(d.x0);
    const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
    const perimeter = r * deltaAngle;

    return d.data.name.length * CHAR_SPACE < perimeter;
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
     this.margin = {top: 20, right: 20, bottom: 35, left: 50, textTop: 15};
     this.size = this.setSize();
     let widthHeight = Math.min(this.size.w, this.size.h);
     this.size.w = this.size.h = widthHeight
     console.log("widthHeight");
     this.totalLoaded = 0;
     this.depth = 0; // used for determing what click level User is at
     this.size.radius = widthHeight / 2 ;
     this.dataNBA = { name: "NBA", children:[] };
   },
   loadDataNBA: function (data) {
     let self = this;
     this.nbaTeams = [ NBA.teams[9], NBA.teams[10]],  //just grabbed 4 best teams so don't have to load ton data NBA.teams[1], NBA.teams[5]

     this.nbaTeams.forEach( (d, i)=> {

       NBA.stats.commonTeamRoster({"TeamID": d.teamId }).then(function (res, err) {
         self.teamRosterLoaded(d, res);
       });
     });

   //
   },
   getVal: function (arr) {

     let peopleArr = arr.map( (obj)=> {
       return {
         name: obj.player ? obj.player.split(" ")[1] : obj.lastName.replace("'", ""),
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
         name: name,
         children: getVal(val),
         size: 10
        };
     });
   },
   getDataPoint: function (name, children) {
     return {
       name: name,
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
