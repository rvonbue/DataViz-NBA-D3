/**
* The commandControler can be used to get a value synchronously from another object,
* based on https://github.com/marionettejs/backbone.radio#requests
*
* Register a handler for requestName on this object. callback will be executed
* whenever the request is made. Optionally pass a context for the callback, defaulting to this.
*   use commandController.reply(commandController.Event, function) to respond to a request
*
* Make a request for requestName. Optionally pass arguments to send along to the callback.
* Returns the reply, if one exists. If there is no reply registered then undefined will be returned.
*   use commandController.request(commandController.requestName [, args...] )) to get a value


*/
var commandController = _.extend(
  {},
  Backbone.Radio.Requests,
  require("./commands/AppCommands"),
  require("./commands/ViewCommands")
);

module.exports = commandController;
