var promise = require("pokedex-promise-v2");
var settings = require("../settings.json");

var options = {
  cacheLimit: 60 * 1000,
  tiemout: 5 * 1000
}
var pkm = new promise(options);

var commands = {
	// Returns what !dex does, usage, and list of commands e.g. type, moves, effectiveness
	help: function(message) {
		message.channel.sendMessage("Returns information on a pokemon\nNote: Not all commands use subs\nUsage: "
		 + settings.prefix + "dex <command> <sub> <name>\n"
		 + pluralCheck("Command", "", "s", commands) + " (default is \"info\"): "
		 + Object.keys(commands).filter(function(r) {if(r !== 'run') {return r;}}).join(", "));
	},

	// Default command redirector
	run: function(message, name) {
		commands.info.run(message, name);
	},

	// Returns basic details of a pokemon
	info: {
		help: function(message) {
			message.channel.sendMessage("Returns basic details of a pokemon\nUsage: "
			 + settings.prefix + "dex info <name>\n");
		},

		run: function(message, name) {
			var reply = "";

			pkm.getPokemonByName(name.toLowerCase(), function(r, e) {
				if(e) {
					if('statusCode' in e && 'error' in e && 'detail' in e.error) {
						message.channel.sendMessage(e.statusCode + " - " + e.error.detail);
					}
					else {
						console.log(e.name + " - " + e.message);
					}
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
	},

	multi: {
		help: function(message) {
			message.channel.sendMessage("Example of a command with subs\nUsage: "
			 + settings.prefix + "dex multi <subcommand> <name>\n"
			 + pluralCheck("Sub", "", "s", commands.multi.sub) + " (default is \"one\"): " + Object.keys(commands.multi.sub).join(", "));
		},

		sub: {
			one: "one",
			two: "two",
			three: "three"
		},

		run: function(message, name, command) {
			if(command === undefined) {
				command = "one";
			}
			message.channel.sendMessage("This command is a skeleton for future commands which include subs.\n"
			 + "Passed arguments are: sub:" + command + " name:" + name);
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
  if(Object.keys(list).filter(function(r) {if(r !== 'run') {return r;}}).length > 1) {
    return o + p;
  }
  else {
    return o + s;
  }
}

module.exports = commands;
