import Radio from "backbone.radio";
window.Backbone.Radio = Radio;

import stylesheet from "./styles/index.less";
import AppView from "./js/appView";

$(function () {
  let view = "";
  if (isCanvasSupported()) {
     view = startApp();
  } else {
    $("body").append(NoCanvasSupportTemplate);
    return;
  }

  $("body").append(view.render().el);

});

function isCanvasSupported () { //test if webgl is supported
  let elem = document.createElement("canvas");
  return !!(elem.getContext && elem.getContext("2d"));
}

function startApp () {
  return new AppView({});
}


// import eventController from "./js/controllers/eventController";
// import commandController from "./js/controllers/commandController";
// window.eventController = eventController;
// window.commandController = commandController;
