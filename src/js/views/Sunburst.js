import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import * as d3 from "d3";
import d3tip from "d3-tip";
import d3zoom from "d3-zoom";
import util from "../util";
import SunburstTemplate from "./sunburst.html";
import BaseChart from "./BaseChart";
import dataSunburst from "../data/sunburst";

let Sunburst = BaseChart.extend({
  initialize: function (options) {
    this.data = dataSunburst;
    this.parentEl = options.parentEl;
    this.margin = {top: 20, right: 20, bottom: 35, left: 50, textTop: 15};
    this.size = this.setSize();
    this.size.w = 500;
    this.size.h = 500;
    this.totalLoaded = 0;
    this.size.radius = Math.min(this.size.w, this.size.h) / 2;
    this.dataNBA = {
      name: "Teams",
      children:[]
    };
    // console.log("SIZE:", this.size);
    this.addListeners();
    this.createSvg();
    this.loadDataNBA(options.data);
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
        name: obj.player ? obj.player : obj.coachName,
        size: 30
       };
    });

    return peopleArr;
  },
  getChildren: function (children) {
    let self = this;
    return _.map(children, (val, key)=> {
      let name = (key == "commonTeamRoster") ? "Roster" : key;
      return {
        name: name,
        children: self.getVal(val),
        size: 20
       };
    });
  },
  getDataPoint: function (name, children) {
    // console.log("getDataPoint", this);
    return {
      name: name,
      children: this.getChildren(children),
      size: 10
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
    this.isAllDataLoaded();
  },
  isAllDataLoaded: function () {
    this.totalLoaded += 1;
    if (this.totalLoaded !== this.nbaTeams.length) return;
    console.log("this.this.dataNBA",this.dataNBA);
    this.formatDataD3(this.dataNBA);
    this.buildChart();
  },
  createSvg: function () {
    this.svg = d3.select(this.parentEl[0])
      .append("svg")
      .attr("class", "sunburst")
      .attr("width", this.size.w)
      .attr("height", this.size.h)
      .append('g')  // <-- 3
      .attr('transform', 'translate(' + this.size.w / 2 + ',' + this.size.h / 2 + ')');  //
  },
  formatDataD3: function (data) {
    let self = this;
    this.partition = d3.partition()
      .size([2 * Math.PI, this.size.radius]);

    this.root = d3.hierarchy(data)  // Find the Root Node
      .sum(function (d) { return d.size});

    this.partition(this.root);  // Calculate each arc

    this.arc = d3.arc()
      .startAngle(function (d) { return d.x0 })
      .endAngle(function (d) { return d.x1 })
      .innerRadius(function (d) { return d.y0 })
      .outerRadius(function (d) { return d.y1 });

  },
  computeTextRotation: function (d) {
    var angle = (d.x0 + d.x1) / Math.PI * 90;

           // Avoid upside-down labels
           return (angle < 120 || angle > 270) ? angle : angle + 180;  // labels as rims
           //return (angle < 180) ? angle - 90 : angle + 90;  // labels as spokes
  },
  buildChart: function () {
    const self = this;
    let color = d3.scaleOrdinal(d3.schemeCategory20);

    this.svg.selectAll('g')
      .data(this.root.descendants())
      .enter().append('g').attr("class", "node").append('path')
      .attr("display", function (d) { return d.depth ? null : "none"; })
      .attr("d", self.arc)
      .style('stroke', '#fff')
      .style("fill", function (d) { return color((d.children ? d : d.parent).data.name); });

    this.svg.selectAll(".node")  // add Labels for each node
      .append("text")
      .attr("transform", function(d) {
          return "translate(" + self.arc.centroid(d) + ")rotate(" + self.computeTextRotation(d) + ")"; })
      .attr("dx", "-20")
      .attr("dy", ".5em")
      .text(function(d) { return d.parent ? d.data.name : "" });
  },
  render: function () {
    this.$el.append(SunburstTemplate);
    return this;
   }
});

module.exports = Sunburst;
