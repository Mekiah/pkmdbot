var discord = require("discord.js");
var login = require("./login.json");
var settings = require("./settings.json");

// Imports all modules flagged as TRUE in settings.json into modules object
var modules = {}
Object.keys(settings.modules).forEach(function(key) {
  if(settings.modules[key]) {
    modules[key] = require("./modules/" + key + ".js");
  }
});
var bot = new discord.Client();

bot.on("ready", function() {
  console.log("Modules loaded: " + Object.keys(modules));
  console.log("Logged in as " + bot.user.username + "#" + bot.user.discriminator);
});

bot.on("disconnect", function() {
  console.log("Logging off...");
  process.exit();
});

bot.on("message", function(message) {
  if(message.author !== bot.user && message.content.startsWith(settings.prefix) && message.content.length > 1) {
    var params = message.content.substring(1).split(" ", 3);

    // Owner kill switch
    if(params[0] === "die") {
      bot.destroy();
      return;
    }

    // Sends input to the correct module
    if(params[0] in modules) {
      switch (params.length) {
        case 1:
          modules[params[0]].meta(message);
          break;
        case 2:
          modules[params[0]].info(message, params[1]);
          break;
        case 3:
          if(params[2] in modules[params[0]]){
            modules[params[0]][params[2]](message, params[1]);
          }
          else {
            message.reply(params[2] + " not a command in " + params[0] + ".");
          }
          break;
        default:
          console.log("Default for switch statement was somehow reached.");
          break;
      }
    }
    else {
      message.reply(params[0] + " is not a module.");
    }

  }
});

bot.login(login.token);
