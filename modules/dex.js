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

		pkm.getPokemonByName(name.toLowerCase(), function(r, e) {
			if(e) {
				message.channel.sendMessage(name + " is not a pokemon.");
			}
			else {
				reply = firstUpper(r.name) + " #" + r.id + "\nWeight: " + r.weight/10 + "kg\nTypes: ";

				types = slotSort(r.types);
				typeList = [];
				for(i in types) {
					typeList.push(firstUpper(types[i].type.name));
				}
				reply = reply + typeList.join(" | ") + "\nAbilities: ";

				abilities = slotSort(r.abilities);
				abilityList = [];
				for(i in abilities) {
					abilityList.push(firstUpper(abilities[i].ability.name));
				}
				reply = reply + abilityList.join(", ");

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

function firstUpper(string) {
	upped = string.split("-");
	for(i in upped) {
		upped[i] = upped[i][0].toUpperCase() + upped[i].substring(1);
	}
	return upped.join(" ");
	// return string[0].toUpperCase() + string.substring(1);
}

module.exports = commands;
