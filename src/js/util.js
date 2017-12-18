import { getColors as getNbaColors, getMainColor as getNbaMainColor}  from 'nba-color';
import { color as d3Color } from "d3";
let util = {
  rick: "hello",
  teamColors: {},
  getFontSize: function (depth, tScale) {
    return tScale + "%";
  },
  getFontColor: function (d) {
    let rgbVal = _.reduce(d3Color(this.getFillStyle(d)), function (memo, num) {
      return memo + num;
    });
    return rgbVal >= ((255 * 3) / 2) ? "#000" : "#fff";
  },
  getSize: function (d) {
    var bbox = this.getBBox(),
      cbbox = this.parentNode.getBBox(),
      scale = Math.min(cbbox.width/bbox.width, cbbox.height/bbox.height);
      d.scale = scale;
  },
  getVisibleTextSelection: function (svg, d) {
    let teamName = this.getTeamName(d.ancestors());
    teamName = teamName.length <= 0 ? teamName : "." + teamName;
    return svg.selectAll(`text.${d.data.name}${teamName}`);
  },
  getTextAnchorPosition: function (d, depth) {
    let position = d.data.angleFlip ? "end" : "start";
    if (depth === 0) position = (d.depth - 1 === depth) ? "middle" : position;
    return position;
  },
  getTextOffsetDx: function (d, padding, currentDepth) {
    if (d.depth <= 1 ) return 0;
    return d.data.angleFlip ? padding : -padding;
  },
  getAllTeamNames: function (root) {
    return root.children.map( function (obj) { return obj.data.name; });
  },
  getFillStyle: function (d) {
    let index = index = d.depth % 2 ? 0 : 1;
    return this.getTeamColor(d, index);
  },
  buildTeamColors: function (teams) {
    let teamColors = {"nba": ["rgba(0,0,0,0)", "rgba(0,0,0,0)"]};
    teams.forEach( function (teamName) {
      teamColors[teamName] =  _.map(getNbaColors(teamName), function (color) {return color.hex });
    });
    this.teamColors = teamColors;
  },
  getTeamName: function (ancestors) {
    if (ancestors.length < 2) return "";
    return ancestors[ancestors.length - 2].data.name;
  },
  toUpperCase: function (stringText) {
    if (stringText === undefined || stringText.length < 0) return "Default";
    return stringText.charAt(0).toUpperCase() + stringText.slice(1);
  },
  getTeamColor: function (d, index) {
    let teamName = this.getTeamName(d.ancestors());
    return this.teamColors[teamName ? teamName : "nba"][index];
  },
  getTranslateRotate: function (translate, rotate) {
    return this.getTranslate(translate) + this.getRotation(rotate);
  },
  getTranslate: function (translate) {
    return "translate(" + translate + ")";
  },
  getRotation: function (rotate) {
    return "rotate(" + rotate + ")";
  },
  getRingClasses: function (d) {
    if (d.depth === 0 ) return;
    let ancestors = d.ancestors(), dataName = d.data.name;

    let name = _.reduce(ancestors ,function (memo, node, i) {
      if ( i===0 ) return dataName;
      return memo + " " + node.data.name;
    }, "");
    return name;
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
        d.data.angleFlip =  ( ( angle < 270 ) && ( angle > 90 ) );
        angle = (angle >= 90) ? angle + 180 : angle;
        break;
      }
      default: {
        angle = (angle < 180) ? angle - 90 : angle + 90;
        break
      }
    }

    d.data.angle = angle;
    return angle; // labels as spokes
  },
  textFits: function (d, x, y) {
    const CHAR_SPACE = 6;

    const deltaAngle = x(d.x1) - x(d.x0);
    const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
    const perimeter = r * deltaAngle;

    return d.data.name.length * CHAR_SPACE < perimeter;
  }
}
// .each( function (d) {
//   d.data.textLength = this.getComputedTextLength();
// })
// var maxTextWidth = d3.max(svgText.nodes(), n => {
//   n.getComputedTextLength();
// });
// console.log(maxTextWidth);

module.exports = util;
