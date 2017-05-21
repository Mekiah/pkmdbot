console.log("Starting up...");

// Load dependencies
var fs = require("fs");
if(fs.existsSync("./.env")) {
  require("dotenv").config();
}
else {
  closeBot("No \".env\" file found");
}
var promise = require("promise");
var discord = require("discord.js");
var settings = require("./settings.json");
var convert = require("./convert.json").read2form;

// Import all modules flagged as true in settings.json into modules object
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

// Command syntax goes as follows[e.g.]: module[dex], command[moves], subcommand[tm], item[nidoking]
bot.on("message", function(message) {
  if(message.author !== bot.user && message.content.startsWith(settings.prefix)) {
    var args = message.content.substring(1).split(" ").filter(function(r){if(r !== ""){return r;}});

    // Owner kill switch
    if(args[0] === "die") {
      if(message.author.username + "#" + message.author.discriminator === settings.owner) {
        console.log("Kill command issued from " + message.author.username + "#" + message.author.discriminator)
        closeBot("Chat command", true);
      }
      else {
        message.channel.sendMessage(message.author.toString() + " is a bully.");
      }
      return;
    }

    // About the project
    if(args[0] === "about") {
    }

    // Bot help
    if(args[0] in modules.help) {
      console.log("Serving " + settings.prefix + "help to "	+ message.author.username + "#" + message.author.discriminator);
      message.channel.sendMessage("Welcome to Pokemiah\nNote: Commands and subs are optional\n"
       + "Usage: " + settings.prefix + "<module> <command> <sub> <name>\n"
       + pluralCheck("Module", "", "s", modules) + "(default is \"" + settings["default-module"] + "\"): " + Object.keys(modules).join(", "));
    }

    // Module found
    else if(args[0] in modules) {
      // Module help
      if(args[1] in modules.help) {
        modules[args[0]].help(message);
      }

      // Command found
      else if(args[1] in modules[args[0]] && args[1] !== "run") {
        // Command help
        if(args[2] in modules.help) {
          modules[args[0]][args[1]].help(message);
        }

        // Sub found
        else if("sub" in modules[args[0]][args[1]] && args[2] in modules[args[0]][args[1]].sub) {
          // Sub help
          if(args[3] in modules.help) {
            modules[args[0]][args[1]].help(message);
          }

          // Name found and passed into function
          else {
            modules[args[0]][args[1]].run(message, toApiCase(args.slice(3).join("-")), modules[args[0]][args[1]].sub[args[2]]);
          }
        }

        // Sub not found, push rest of input into default sub
        else {
          modules[args[0]][args[1]].run(message, toApiCase(args.slice(2).join("-")));
        }
      }

      // Command not found, push rest of input into default command
      else {
        modules[args[0]].run(message, toApiCase(args.slice(1).join("-")));
      }
    }

    // Module not found, push rest of input into default module
    else {
      if(settings["default-module"] in modules) {
        modules[settings["default-module"]].run(message, toApiCase(args.slice(0).join("-")));
      }

      else {
        message.channel.sendMessage("Default module \"" + settings["default-module"] + "\" not found.");
      }
    }
  }
});

// Convert read name to one the api will understand
function toApiCase(string) {
  var api = string.replace(/é/g,"e").replace(/[^\-0-9A-Za-z?!]/g,"").toLowerCase();
  if(api in convert) {
    api = convert[api];
  }
  return api;
}

// Check if list contains multiple
function pluralCheck(o, s, p, list) {
  if(Object.keys(list).length > 1) {
    return o + p;
  }
  else {
    return o + s;
  }
}

// Handlers for exit types
process.on("SIGINT", closeBot.bind(null, "SIGINT", true));
process.on("uncaughtException", closeBot.bind(null, "uncaughtException", true));

// Cleanup for closing the bot application
function closeBot(code, logoff) {
  console.log("Exit: " + code);
  if(logoff) {
    console.log("Logging off...");
    bot.destroy();
  }
  console.log("Closing process...");
  process.exit();
}

// Login with token
var login = bot.login(process.env.DISCORD_TOKEN);
promise.resolve(login)
.catch(function(e) {
  closeBot("Token is incorrect", false);
});
