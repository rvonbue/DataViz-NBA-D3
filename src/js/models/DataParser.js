import eventController from "../controllers/eventController";
import commandController from "../controllers/commandController";
import nbaTeams from "../data/nbaTeams";
import util from "../util";
window.util = util;

let DataParser = Backbone.Model.extend({
  defaults: {
    "threePointData": null
  },
  initialize: function () {
    util.buildTeamColors();
    commandController.reply(commandController.GET_TEAM_ROSTERS, (d)=> this.getTeamRosters(d) );
    commandController.reply(commandController.GET_3POINT, ()=> this.getThreePointData() );
    commandController.reply(commandController.GET_DATA_AGE, ()=> this.getAgeData() );
    commandController.reply(commandController.GET_DATA_PLAYERS_BY_STAT, (stat, num)=> this.getPlayersByStat(stat, num) );
  },
  start: function () {
    this.loadPlayerStats();
    console.log(this.calcAge("1985-01-14T00:00:00"));
  },
  calcAge: function (dateString) {
    var birthday = +new Date(dateString);
    return~~ ((Date.now() - birthday) / (31557600000));
  },
  loadPlayerStats: function (statFunc) {
    let self = this;
    NBA.stats.playerStats().then(function (res, err) { self.playerStatsLoaded(res); });
  },
  playerStatsLoaded: function (dataDump) {
    let objKey = _.keys(dataDump);
    this.set("playerStats", dataDump[objKey]);
    // console.log("Players", this.getPlayersByStat("minRank", 50));
  },
  getPlayersByStat: function (stat, num) {
    let playerStats = this.get("playerStats");
    playerStats.forEach( (d, i) => { if ( d.gpRank > 400 ) playerStats.splice(i, 1); });

    // let playersArr = [];
    // _.each(stats, (stat)=> {
      let playersArrTemp = _.sortBy(playerStats, stat);
      playersArrTemp.length = num;
      // playersArr.push(playersArrTemp);
    // })
    console.log("playersArrTemp", playersArrTemp);
    return playersArrTemp;
  },
  getTeamRosters: function (teams) {
    let playerStats = this.get("playerStats");

    return _.map(teams, (name, teamI)=> {
      let allPlayers = _.where(playerStats, { teamAbbreviation: name });
          allPlayers = _.sortBy(allPlayers, "min");


      allPlayers.forEach( function (player) {
        let name = player.playerName.split(" ");
        name = name.length > 1 ? `${name[0][0]}.${name[1]}` : name[0];
        player.size = 10;
        player.name = name;
      });

      let starters = allPlayers.slice(allPlayers.length -5, allPlayers.length).reverse();
      let bench = allPlayers.slice(0, allPlayers.length -5).reverse();

      let children = [
        this.getDataPoint("bench", bench, 10),
        this.getDataPoint("starters", starters, 10)
      ];
      children = teamI % 2 ? children : children.reverse();
      return this.getDataPoint(name, children, 10);
    });
  },
  getAgeData: function () {
    let ageObj = {};
    _.each( this.get("playerStats"), function (player) {
      if (ageObj[player.age]) {
        ageObj[player.age] += 1;
      } else {
        ageObj[player.age] = 1;
      }
    });


    let teams = _.clone(nbaTeams);
    teams = teams.map((obj) => {
        obj.players = [];
        return obj;
    });

    var teamObjIndex = teams.reduce(function(obj,item, i){
      obj[item.abbreviation] = i;
      return obj;
    }, {});

    _.each( this.get("playerStats"), function (player) {
      teams[teamObjIndex[player.teamAbbreviation]].players.push(player);
    });

    console.log("this.teams", teams);
    // console.log("this.this.get(playerStats)", this.get("playerStats"));
    return {ageObj: ageObj, teams: teams };
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
