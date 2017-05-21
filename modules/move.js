var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var settings = require("../settings.json");
var convert = require("../convert.json");

var pkm = new Pokedex(settings.pokedex);

var commands = {
	// Returns what !move does, usage, and list of commands e.g. type, moves, effectiveness
	help: function(message) {
		initCommand(message, "help", "move");
		message.reply("Returns information on a move\nNote: Not all commands use subs\nUsage: "
		 + settings.prefix + "move <command> <sub> <name>\n"
		 + pluralCheck("Command", "", "s", commands) + " (default is \"info\"): "
		 + Object.keys(commands).filter(function(r){if(r !== "run"){return r;}}).join(", "));
	},

	// Default command redirector
	run: function(message, name) {
		commands.info.run(message, name);
	},

	// Returns the basic details of a move
	info: {
		help: function(message) {
			initCommand(message, "help", "move", "info");
			message.reply("Returns the basic details of a move\nUsage: "
			 + settings.prefix + "move info <name>\n");
		},

		run: function(message, name) {
			if(initCommand(message, name, "move", "info")) {
				return;
			}

			var reply;
      var error;
			var details = {
        movename: name,
				name: "",
				effect: "",
        type: "",
				category: "",
				power: "",
				accuracy: "",
				pp: "",
				priority: ""
			}

			var promise = pkm.getMoveByName(details.movename)
			.then(function(r) {
				for(i in r.names) {
					if(r.names[i].language.name === "en") {
						details.name = r.names[i].name;
					}
				}
				for(i in r.effect_entries) {
					if(r.effect_entries[i].language.name === "en") {
						details.effect = r.effect_entries[i].short_effect.replace("$effect_chance", r.effect_chance);
					}
				}
				details.type = convertName(r.type.name, "type");
				details.category = firstUpper(r.damage_class.name);
				details.power = r.power;
				details.accuracy = r.accuracy;
				details.pp = r.pp;
				details.priority = r.priority;
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
          reply = details.name + " - " + details.effect
					+ "\nType: " + details.type + " - Category: " + details.category;
					var stats = [];
					if(details.power !== null) {
						stats.push("Power: " + details.power);
					}
					if(details.accuracy !== null) {
						stats.push("Accuracy: " + details.accuracy + "%");
					}
					if(details.pp !== 1) {
						stats.push("PP: " + details.pp);
					}
					if(details.priority !== 0) {
						if(details.priority > 0) {
							details.priority = "+" + details.priority;
						}
						stats.push("Priority: " + details.priority);
					}
					reply = reply + "\n" + stats.join(" - ");

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
	var args = [name, mod, command, sub].filter(function(r){if(r){return r;}}).join(" ");

	console.log("Serving " + settings.prefix + args + " to "
	+ message.author.username + "#" + message.author.discriminator);
	// Skips api check if an integer
	if(parseInt(name)) {
		message.reply("404: " + name + " not found.");
		return true;
	}
}

// Shows a readable error chat
function displayError(message, error) {
	if(error.statusCode === 404 && "options" in error && "url" in error.options) {
		message.reply("404: " + getLastPart(error.options.url) + " not found.");
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
				message.reply("Unknown error encountered. Check logs for details.");
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
	return url.split("/").filter(function(r){if(r !== ""){return r;}}).slice(-1)[0];
}

// Returns string concating o with s if list has 1 item or p is list has >1 items
function pluralCheck(o, s, p, list) {
  if(Object.keys(list).filter(function(r){if(r !== "run"){return r;}}).length > 1) {
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
