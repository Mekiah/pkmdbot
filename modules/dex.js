var promise = require("pokedex-promise-v2");
var settings = require("../settings.json");

var pkm = new promise();

var commands = {
	// Returns what !dex does, usage, and list of commands e.g. type, moves, effectiveness
	meta: function(message) {
		message.channel.sendMessage("Returns information on a specific pokemon\nUsage: " + settings.prefix +
		"dex <pokemon> <command> <version>\nCommands (default is \"info\"): " + Object.keys(commands).join(", "));
	},

	// Default command, returns basic information on a pokemon
	info: function(message, name, version) {
		if(!version) {
			version = settings.version;
		}
		var reply = "";

		pkm.getPokemonByName(name, function(r, e) {
			if(e) {
				message.channel.sendMessage(name + " is not a pokemon.");
			}
			else {
				reply = r.name + " " + r.id + " " + r.weight;
				types = slotSort(r.types);
				abilities = slotSort(r.abilities);
				for(i in types) {
					reply = reply + " " + types[i].type.name;
				}
				for(i in abilities) {
					reply = reply + " " + abilities[i].ability.name;
				}

				message.channel.sendMessage(reply);
			}
		});
	}
}

function slotSort(list) {
	return list.sort(function(a, b) {
		return a.slot - b.slot;
	});
}

module.exports = commands;
