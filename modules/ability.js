var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var settings = require("../settings.json");
var convert = require("../convert.json");

var pkm = new Pokedex(settings.pokedex);

var commands = {
	// Returns what !ability does, usage, and list of commands
	help: function(message) {
		initCommand(message, "help", "ability");
		message.reply("Returns information on an ability\nNote: Not all commands use subs\nUsage: "
		 + settings.prefix + "move <command> <sub> <name>\n"
		 + pluralCheck("Command", "", "s", commands) + " (default is \"info\"): "
		 + Object.keys(commands).filter(function(r) {if(r !== "run") {return r;}}).join(", "));
	},

	// Default command redirector
	run: function(message, name) {
		commands.info.run(message, name);
	},

	// Returns the basic details of an ability
	info: {
		help: function(message) {
			initCommand(message, "help", "ability", "info");
			message.reply("Returns the basic details of an ability\nUsage: "
			 + settings.prefix + "ability info <name>\n");
		},

		run: function(message, name) {
			if(initCommand(message, name, "ability", "info")) {
				return;
			}

			var reply;
      var error;
			var details = {
        abilityname: name,
				name: "",
				effect: ""
			}

			var promise = pkm.getAbilityByName(details.abilityname)
			.then(function(r) {
				for(i in r.names) {
					if(r.names[i].language.name === "en") {
						details.name = r.names[i].name;
					}
				}
				for(i in r.effect_entries) {
					if(r.effect_entries[i].language.name === "en") {
						details.effect = r.effect_entries[i].short_effect;
					}
				}
			})
			.catch(function(e) {
        error = e;
			});

			Promise.resolve(promise)
			.then(function() {
        if(error) {
					displayError(message, error);
        }
        else {
          // Build details into a message
          reply = details.name + " - " + details.effect;

          message.channel.sendMessage(reply);
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.resolve: " + e);
      });
		}
	},
}

// Do predefined actions before each command
function initCommand(message, name, mod, command, sub) {
	var args = [name, mod, command, sub];
	for(i in args)
	{
		if(args[i]) {
			args[i] = args[i] + " ";
		}
		else {
			args[i] = "";
		}
	}
	console.log("Serving " + settings.prefix + args[1] + args[2] + args[3] + args[0] + "to "
	+ message.author.username + "#" + message.author.discriminator);
	// Skips api check if dex # out of range
	if(parseInt(name)) {
		message.reply("404 - {\"detail\":\"Not found.\"}".replace("detail"	, name));
		return 1;
	}
}

// Shows a readable error chat
function displayError(message, error) {
	if("statusCode" in error && "error" in error && "detail" in error.error && "options" in error && "url" in error.options) {
		message.reply(error.message.replace("detail", getLastPart(error.options.url)));
	}
	else if("message" in error) {
		message.reply(error.message);
		console.log(error.message);
	}
	else {
		fs.appendFile("uknown_error.txt", JSON.stringify(error, null, 2), function(e) {
			if(e) {
				console.log("Error writing unknown_error.txt: " + e);
			}
			else {
				console.log("Successfully wrote to unknown_error.txt");
			}
		});
	}
}

// Returns A String Where All Words Are Capitalized
function firstUpper(string) {
	upped = string.split("-");
	for(u in upped) {
		upped[u] = upped[u][0].toUpperCase() + upped[u].substring(1);
	}
	return upped.join(" ");
}

// Gets last piece of a url
function getLastPart(url) {
	return url.split("/").filter(function(r) { if(r !== "") {return r;} }).slice(-1)[0];
}

// Returns string concating o with s if list has 1 item or p is list has >1 items
function pluralCheck(o, s, p, list) {
  if(Object.keys(list).filter(function(r) { if(r !== "run") { return r; } }).length > 1) {
    return o + p;
  }
  else {
    return o + s;
  }
}

// Send name to convert json using target field
function convertName(name, target) {
	if(name in convert[target]) {
		name = convert[target][name];
	}
	else {
		name = firstUpper(name);
	}
	return name;
}

module.exports = commands;
