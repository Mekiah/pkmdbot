var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var shared = require("../shared.js");
var settings = require("../settings.json");

var pkm = new Pokedex(settings.pokedex);

var commands = {
	// Returns what !move does, usage, and list of commands e.g. type, moves, effectiveness
	help: function(message) {
		shared.initCommand(message, "help", "move", 0);
		message.reply("Returns information on a move\nNote: Not all commands use subs\nUsage: "
		 + settings.prefix + "move <command> <sub> <name>\n"
		 + shared.pluralCheck("Command", "", "s", commands) + " (default is \"info\"): "
		 + Object.keys(commands).filter(function(r){if(r !== "run"){return r;}}).join(", "));
	},

	// Default command redirector
	run: function(message, name) {
		commands.info.run(message, name);
	},

	// Returns the basic details of a move
	info: {
		help: function(message) {
			shared.initCommand(message, "help", "move", "info", 0);
			message.reply("Returns the basic details of a move\nUsage: "
			 + settings.prefix + "move info <name>\n");
		},

		run: function(message, name) {
			if(shared.initCommand(message, name, "move", "info", 0)) {
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
				details.type = shared.convertName(r.type.name, "type");
				details.category = shared.firstUpper(r.damage_class.name);
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
					shared.displayError(message, error);
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

module.exports = commands;
