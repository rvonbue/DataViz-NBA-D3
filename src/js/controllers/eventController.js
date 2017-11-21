var eventController = _.extend(
  {},
  Backbone.Events,
  require("./events/AppEvents"),
  require("./events/ViewEvents")
);

module.exports = eventController;
