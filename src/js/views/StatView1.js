import eventController from "../controllers/eventController";
import template from "./StatView1.html";
const NBA = require("nba");


let StatView1 = Backbone.View.extend({
  className: "stat-view-1",
  initialize: function (options) {
    window.NBA = NBA;
    this.getPlayer();
  },
  addListeners: function () { },
  render: function () {
    // this.$el.append(template);
    return this;
  },
  getPlayer: function () {
    const curry = NBA.findPlayer('Stephen Curry');
    NBA.stats.playerInfo({ PlayerID: curry.playerId }).then(function (res, err) {
        console.log("PlayerInfo:", res);
    });

    let self = this;

    NBA.stats.playerStats({ PlayerID: curry.playerId }).then(function (res, err) {
        self.sortPlayerStats(res);
    });
  },
  sortPlayerStats: function (dataDump) {

    let objKey = _.keys(dataDump);
    let sorted3pa = _.sortBy(dataDump[objKey], "fg3aRank");
    sorted3pa.length = 30;  // get top 30 players
    console.log("sorted3pa:", sorted3pa);
    let simpleData = this.getSimpleData(sorted3pa);
    console.log("simpleData:", simpleData);
    this.$el.append(template(sorted3pa[0]));
  },
  getSimpleData: function (sorted3pa) {
    let simpleData = []
    _.each(sorted3pa, function (player) {
      simpleData.push(
        {
          playerName: player.playerName,
          fG3A: player.fG3A,
          fG3M: player.fG3M,
          fg3Pct: player.fg3Pct
        }
      )
    });
    return simpleData;
  },
  appendHtml: function () {

  }
});

module.exports = StatView1;
