var fs = require("fs");
var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var settings = require("../settings.json");
var convert = require("../convert.json");

var pkm = new Pokedex(settings.pokedex);

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
      console.log("Serving \"" + "!dex info " + name + "\" to \""
      + message.author.username + "#" + message.author.discriminator +"\"");
			// Skips api check if dex # out of range
			if(parseInt(name) > settings.count) {
				message.channel.sendMessage("404 - Not found.");
				return;
			}

			var reply;
      var error;
			var details = {
        speciesname: "",
        pokemonname: "",
        formname: name,
				sprite: null,
				name: "",
				number: "",
        title: "",
				height: "",
				weight: "",
				types: "",
				abilities: ""
        //,flavor: ""
			}
			var promises = [];

      // Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");
			details.speciesname = convertName(details.formname, "form2species");

			promises.push(pkm.getPokemonSpeciesByName(details.speciesname)
			.then(function(r) {
				details.speciesname = r.name;
        // Save species name to details
				for(i in r.names) {
					if(r.names[i].language.name === "en") {
						details.name = r.names[i].name;
						break;
					}
				}
        /* Save flavor text to details
        for(i in r.flavor_text_entries) {
					if(r.flavor_text_entries[i].language.name === "en" && r.flavor_text_entries[i].version.name === settings.version) {
						details.flavor = r.flavor_text_entries[i].flavor_text;
						break;
					}
				}
        */
        // Save national number to details
        for(i in r.pokedex_numbers) {
					if(r.pokedex_numbers[i].pokedex.name === "national") {
						details.number = r.pokedex_numbers[i].entry_number;
						break;
					}
				}
			})
			.catch(function(e) {
        error = e;
			}));

			promises.push(pkm.getPokemonFormByName(details.formname)
			.then(function(r) {
				details.formname = r.name;
        // Save form name to details
				for(i in r.names) {
					if(r.names[i].language.name === "en") {
						details.title = "\n*" + r.names[i].name + "*";
						break;
					}
				}
        // Save sprite to details
        details.sprite = r.sprites.front_default;
			})
			.catch(function(e) {
        error = e;
			}));

			promises.push(pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
				details.pokemonname = r.name;
        // Save types to list
				types = slotSort(r.types);
				typeList = [];
				for(i in types) {
					typeList.push(convertName(types[i].type.name, "type"));
				}

        // Save abilities to list with hidden check
				abilities = slotSort(r.abilities);
				abilityList = [];
				for(i in abilities) {
					abilityList.push(convertName(abilities[i].ability.name, "ability"));
          if(abilities[i].is_hidden) {
            abilityList[i] = "**" + abilityList[i] + "**";
          }
				}

        // Save height, weight, and both lists to details
  			details.height = (r.height / 10) + " m";
  			details.weight = (r.weight / 10) + " kg";
  			details.types = typeList;
				details.abilities = abilityList;
			})
			.catch(function(e) {
        error = e;
			}));

			Promise.all(promises)
			.then(function() {
        if(error) {
          if('statusCode' in error && 'error' in error && 'detail' in error.error) {
  					message.channel.sendMessage(error.statusCode + " - " + error.error.detail);
  				}
  				else {
  					message.channel.sendMessage(error.name + " - " + error.message);
  					console.log(error.name + " - " + error.message);
  				}
        }
        else {
          // Overwrite sprite url with local sprite path if exists
          if(fs.existsSync("./sprites/" + details.formname + ".gif")) {
            details.sprite = "./sprites/" + details.formname + ".gif";
          }
          else if(fs.existsSync("./sprites/" + details.formname + ".png")) {
            details.sprite = "./sprites/" + details.formname + ".png";
          }

          // Build details into a message
          reply = details.name + " #" + details.number + details.title
          + "\nHeight: " + details.height
          + "\nWeight: " + details.weight
          + "\n" + pluralCheck("Type", "", "s", typeList) + ": " + typeList.join(" | ")
          + "\n" + pluralCheck("Abilit", "y", "ies", abilityList) + ": " + abilityList.join(", ")
          //+ "\n" + details.flavor
          ;

          // Send file with a comment if sprite exists, else send text only
          if(details.sprite) {
            message.channel.sendFile(details.sprite, null, reply);
          }
          else {
            message.channel.sendMessage(reply);
          }
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.all for " + name + ": " + e);
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
			one: "1",
			two: "2",
			three: "3"
		},

		run: function(message, name, command) {
			if(command === undefined) {
				command = "1";
			}
			message.channel.sendMessage("This command is a skeleton for future commands which include subs.\n"
			 + "Passed arguments are: sub:" + command + " name:" + name);
		}
	},

	type: {
		help: function(message) {
			message.channel.sendMessage("Returns type of a pokemon\nUsage: "
			 + settings.prefix + "dex type <name>\n");
		},

		run: function(message, name, command) {
			if(command === undefined) {
				command = "1";
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
	console.log("convertName \"" + name + "\" \"" + target +"\"");
	if(name in convert[target]) {
		name = convert[target][name];
	}
	else if(["type", "ability", "move"].indexOf(target) !== -1) {
		console.log("else if success");
		name = firstUpper(name);
	}
	console.log("return \"" + name + "\"");
	return name;
}

module.exports = commands;
