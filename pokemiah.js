var discord = require("discord.js");
var login = require("./login.json");
var settings = require("./settings.json");

// Imports all modules flagged as true in settings.json into modules object
var modules = {}
Object.keys(settings.modules).forEach(function(key) {
  if(settings.modules[key]) {
    modules[key] = require("./modules/" + key + ".js");
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
    if(params[0] === "die") {
      bot.destroy();
      return;
    }

    // Sends input to the correct module
    // Bot help
    if(params[0] === "help" || params[0] === "") {
      message.channel.sendMessage("To use this bot, type \"" + settings.prefix +"\" followed by a module name.\n"
       + pluralCheck("Module", "", "s", modules) + ": " + Object.keys(modules).join(", ") + ".");
    }
    // Module found
    else if(params[0] in modules) {
      // Module help
      if(params[1] === "help" || params[1] === "" || params[1] === undefined) {
        modules[params[0]].help(message);
      }
      // Command found
      else if(params[1] in modules[params[0]]) {
        // Command help
        if(params[2] === "help" || params[2] === "" || params[2] === undefined) {
          modules[params[0]][params[1]].help(message);
        }
        // Subcommand found and executed
        else if(params[2] in modules[params[0]][params[1]]) {
          modules[params[0]][params[1]][params[2]](message, toApiCase(params.slice(3).join("-")));
        }
        // Subcommand not found, push rest of input into api call
        else {
          modules[params[0]][params[1]].run(message, toApiCase(params.slice(2).join("-")));
        }
      }
      // Command not found, push rest of input into api call
      else {
        modules[params[0]].info.run(message, toApiCase(params.slice(1).join("-")));
      }


/*
      switch (params.length) {
        case 1:
          modules[params[0]].meta(message);
          break;
        case 2:
          modules[params[0]].info(message, params[1]);
          break;
        case 3:
        case 4:
          if(params[2] in modules[params[0]]) {
            modules[params[0]][params[2]](message, params[1], params[3]);
          }
          else {
            message.channel.sendMessage(params[2] + " is not a command in " + params[0] +
            ".\nType \"" + settings.prefix + params[0] + "\" for usage.");
          }
          break;
        default:
          console.log("Default for switch statement was somehow reached");
          break;
      }
*/
    }
    // No matching module found
    else {
      message.channel.sendMessage(params[0] + " is not a module.\n"
       + pluralCheck("Module", "", "s", modules) + ": " + Object.keys(modules).join(", ") + ".");
    }
  }
});

function toApiCase(string) {
  return string.replace(/[^\-0-9A-Za-z]/g,"").toLowerCase();
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
