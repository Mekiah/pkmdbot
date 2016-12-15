var promise = require("pokedex-promise-v2");
var settings = require("../settings.json");

var pkm = new promise();

var commands = {
	// Returns what !dex does, usage, and list of commands e.g. type, moves, effectiveness
	help: function(message) {
		message.channel.sendMessage("Returns information on a pokemon\nUsage: "
		 + settings.prefix + "dex <command> <subcommand> <name|dex#>\n"
		 + pluralCheck("Command", "", "s", commands) + " (default is \"info\"): " + Object.keys(commands).join(", "));
	},

	// Default command, returns basic information on a pokemon
	info: {
		help: function(message) {
			message.channel.sendMessage("Returns basic details of a pokemon\nUsage: "
			 + settings.prefix + "dex info <subcommand> <name|dex#>\n"
			 + pluralCheck("Subcommand", "", "s", commands.info) + " (default is \"run\"): " + Object.keys(commands.info).join(", "));
		},
		run: function(message, name) {
			var reply = "";

			pkm.getPokemonByName(name.toLowerCase(), function(r, e) {
				if(e) {
					message.channel.sendMessage(name + " is not a pokemon.");
				}
				else {
					reply = firstUpper(r.name) + " #" + r.id + "\nWeight: " + r.weight/10 + " kg";

					types = slotSort(r.types);
					typeList = [];
					for(i in types) {
						typeList.push(firstUpper(types[i].type.name));
					}
					reply = reply + "\n" + pluralCheck("Type", "", "s", typeList) + ": " + typeList.join(" | ");

					abilities = slotSort(r.abilities);
					abilityList = [];
					for(i in abilities) {
						abilityList.push(firstUpper(abilities[i].ability.name));
					}
					reply = reply + "\n" + pluralCheck("Abilit", "y", "ies", abilityList) + ": " + abilityList.join(", ");

					message.channel.sendMessage(reply);
				}
			});
		}
	}
}

// Sorts list of api objects by slot value
function slotSort(list) {
	return list.sort(function(a, b) {
		return a.slot - b.slot;
	});
}

function firstUpper(string) {
	upped = string.split("-");
	for(i in upped) {
		upped[i] = upped[i][0].toUpperCase() + upped[i].substring(1);
	}
	return upped.join(" ");
}

// Returns string concating o with s if list has 1 item or p is list has >1 items
function pluralCheck(o, s, p, list) {
  if(Object.keys(list).length > 1) {
    return o + p;
  }
  else {
    return o + s;
  }
}

module.exports = commands;
