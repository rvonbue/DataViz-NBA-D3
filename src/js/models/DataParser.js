import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
// import util from "../util";
// window.util = util;

let DataParser = Backbone.Model.extend({
  initialize: function (options) {
    this.data = options.data;
  },
  getThreePointData: function () {
    let dataDump = this.data;
    let objKey = _.keys(dataDump);  // data dump return POJO with one value an array
    let sorted3pa = _.sortBy(dataDump[objKey], "fg3mRank");

    sorted3pa.forEach( function (d, i) {
      if ( d.gpRank > 300 ) sorted3pa.splice(i, 1);  // remove players who don't play alot of games
    });
    sorted3pa.length = 50;  // get top 30 players
    console.log("klasdjfadks",sorted3pa );
    let simpleData = [];
    _.each(sorted3pa, function (player) {
      simpleData.push(
        {
          playerName: player.playerName,
          fG3A: player.fG3A,
          fG3M: player.fG3M,
          fg3Pct: player.fg3Pct,
          fg3PctRank: player.fg3PctRank,
          teamAbbreviation: player.teamAbbreviation
        }
      )
    });

    this.set("threePointData", simpleData );
    return simpleData;
  },
});

module.exports = DataParser;
