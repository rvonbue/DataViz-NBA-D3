import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
const NBA = require("nba");
import template from "./StatView1.html";
import ScatterPlot from "./ScatterPlot";

let StatControllerView = Backbone.View.extend({
  id: "stat-view",
  initialize: function (options) {
    this.getStats();
    this.addListeners();
  },
  addListeners: function () {
    commandController.reply(commandController.GET_SCREEN_SIZE, this.getWidthHeight, this);
  },
  getWidthHeight: function () {
    return {w: this.$el.width(), h: this.$el.height() };
  },
  getStats: function () {
    let self = this;

    NBA.stats.playerStats().then(function (res, err) {
        self.sortPlayerStats(res);
    });
  },
  sortPlayerStats: function (dataDump) {
    let objKey = _.keys(dataDump);  // data dump return POJO with one value an array
    let sorted3pa = _.sortBy(dataDump[objKey], "fg3aRank");
    sorted3pa.length = 50  // get top 30 players
    this.loadChart(this.getSimpleData(sorted3pa));
  },
  loadChart: function (simpleData) {
    // this.$el.append(template(sorted3pa[0]));
    new ScatterPlot({ data: simpleData, parentEl: this.$el });
  },
  getSimpleData: function (sorted3pa) {
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
    return simpleData;
  },
  appendHtml: function () {

  },
  render: function () {
    return this;
  },
});

module.exports = StatControllerView;
