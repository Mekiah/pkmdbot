var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var shared = require("../shared.js");
var settings = require("../settings.json");

var pkm = new Pokedex(settings.pokedex);

var commands = {
	// Returns what !ability does, usage, and list of commands
	help: function(message) {
		shared.initCommand(message, "help", "ability", 0);
		message.channel.send("Returns information on an ability\nNote: Not all commands use subs\nUsage: "
		 + settings.prefix + "move <command> <sub> <name>\n"
		 + shared.pluralCheck("Command", "", "s", commands) + " (default is \"info\"): "
		 + Object.keys(commands).filter(function(r){if(r !== "run"){return r;}}).join(", "));
	},

	// Default command redirector
	run: function(message, name) {
		commands.info.run(message, name);
	},

	// Returns the basic details of an ability
	info: {
		help: function(message) {
			shared.initCommand(message, "help", "ability", "info", 0);
			message.channel.send("Returns the basic details of an ability\nUsage: "
			 + settings.prefix + "ability info <name>\n");
		},

		run: function(message, name) {
			if(shared.initCommand(message, name, "ability", "info", 0)) {
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
					shared.displayError(message, error);
        }
        else {
          // Build details into a message
          reply = details.name + " - " + details.effect;

          message.channel.send(reply);
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	},
}

module.exports = commands;
