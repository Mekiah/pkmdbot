var discord = require("discord.js");
var login = require("./login.json");
var settings = require("./settings.json");
var convert = require("./convert.json").read2form;

// Imports all modules flagged as true in settings.json into modules object
var modules = { help: {} }
Object.keys(settings.modules).forEach(function(key) {
  if(settings.modules[key]) {
    modules[key] = require("./modules/" + key + ".js");
  }
});
Object.keys(settings.help).forEach(function(key) {
  if(settings.help[key]) {
    modules.help[key] = null;
  }
});
var bot = new discord.Client();

bot.on("ready", function() {
  console.log(pluralCheck("Module", "", "s", modules) + " loaded: " + Object.keys(modules).join(", "));
  console.log("Logged in as " + bot.user.username + "#" + bot.user.discriminator);
});

bot.on("disconnect", function() {
  console.log("Logging off...");
  process.exit();
});

// Command syntax goes as follows[e.g.]: module[dex], command[moves], subcommand[tm], item[nidoking]
bot.on("message", function(message) {
  if(message.author !== bot.user && message.content.startsWith(settings.prefix)) {
    var params = message.content.substring(1).split(" ");

    // Owner kill switch
    if(params[0] === "die" && message.author.username + "#" + message.author.discriminator === settings.owner) {
      bot.destroy();
      return;
    }

    // About the project
    if(params[0] === "about") {
    }

    /* Sends input to the correct module */
    // Bot help
    if(params[0] in modules.help) {
      message.channel.sendMessage("Welcome to Pokemiah\nNote: Commands and subs are completely optional\n"
       + "Usage: " + settings.prefix + "<module> <command> <sub> <name>\n"
       + pluralCheck("Module", "", "s", modules) + "(default is \"" + settings['default-module'] + "\"): " + Object.keys(modules).join(", "));
    }

    // Module found
    else if(params[0] in modules) {
      // Module help
      if(params[1] in modules.help) {
        modules[params[0]].help(message);
      }

      // Command found
      else if(params[1] in modules[params[0]] && params[1] !== "run") {

        // Command help
        if(params[2] in modules.help) {
          modules[params[0]][params[1]].help(message);
        }

        // Sub found and passed into function
        else if("sub" in modules[params[0]][params[1]] && params[2] in modules[params[0]][params[1]].sub) {
          modules[params[0]][params[1]].run(message, toApiCase(params.slice(3).join("-")), params[2]);
        }

        // Sub not found, push rest of input into default sub api call
        else {
          modules[params[0]][params[1]].run(message, toApiCase(params.slice(2).join("-")));
        }
      }

      // Command not found, push rest of input into default command api call
      else {
        modules[params[0]].run(message, toApiCase(params.slice(1).join("-")));
      }

    }

    // Module not found, push rest of input into default module api call
    else {

      if(settings['default-module'] in modules) {
        modules[settings['default-module']].run(message, toApiCase(params.slice(0).join("-")));
      }

      else {
        message.channel.sendMessage("No default module specified");
      }

    }
    /**/
  }
});

function toApiCase(string) {
  var api = string.replace(/é/g,"e").replace(/[^\-0-9A-Za-z?!]/g,"").toLowerCase();
  if(api in convert)
  {
    api = convert[api];
  }
  return api;
}

function pluralCheck(o, s, p, list) {
  if(Object.keys(list).length > 1) {
    return o + p;
  }
  else {
    return o + s;
  }
}

bot.login(login.token);
