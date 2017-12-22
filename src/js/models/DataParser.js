import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import util from "../util";
window.util = util;

let DataParser = Backbone.Model.extend({
  defaults: {
    "threePointData": null
  },
  initialize: function () {
    util.buildTeamColors();
    _.bindAll(this, "getTeamRosters", "getThreePointData");
    commandController.reply(commandController.GET_TEAM_ROSTERS, (d)=> this.getTeamRosters(d) );
    commandController.reply(commandController.GET_3POINT,()=> this.getThreePointData() );
  },
  start: function () {
    this.loadPlayerStats();
  },
  loadPlayerStats: function (statFunc) {
    let self = this;
    NBA.stats.playerStats().then(function (res, err) { self.playerStatsLoaded(res); });
  },
  playerStatsLoaded: function (dataDump) {
    let objKey = _.keys(dataDump);
    this.set("playerStats", dataDump[objKey]);
    // statFunc();
  },
  getThreePointData: function () {
    let playerStats = this.get("playerStats");
    let sorted3pa = _.sortBy(playerStats, "fg3mRank");

    sorted3pa.forEach( function (d, i) {
      if ( d.gpRank > 300 ) sorted3pa.splice(i, 1);  // remove players who don't play alot of games
    });

    sorted3pa.length = 50;  // get top 30 players
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
  getTeamRosters: function (teams) {
    let playerStats = this.get("playerStats");

    return _.map(teams, (name)=> {
      let allPlayers = _.where(playerStats, { teamAbbreviation: name });
          allPlayers = _.sortBy(allPlayers, "min");


      allPlayers.forEach( function (player) {
        let name = player.playerName.split(" ");
        name = name.length > 1 ? `${name[0][0]}. ${name[1]}` : name[0];
        player.size = 10;
        player.name = name;
      });

      let starters = allPlayers.slice(allPlayers.length -5, allPlayers.length).reverse();
      let bench = allPlayers.slice(0, allPlayers.length -5).reverse();

      let children = [
        this.getDataPoint("starters", starters, 10),
        this.getDataPoint("bench", bench, 10)
      ];

      return this.getDataPoint(name, children, 10);
    });
  },
  getDataPoint: function (name, children, size) {
    return {
      name: name ? name : "TEST",
      children: children,
      size: 10
    };
  }
});

module.exports = DataParser;
