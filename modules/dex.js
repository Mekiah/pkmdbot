var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var settings = require("../settings.json");
var convert = require("../convert.json");

var options = {
  //protocol: 'http',
  //hostName: 'localhost:8000',
  versionPath: '/api/v2/',
  cacheLimit: 60 * 1000,
  tiemout: 5 * 1000
}
var pkm = new Pokedex(options);

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
      if(details.formname in convert.form2name) {
        details.pokemonname = convert.form2name[details.formname];
      }
      else {
        details.pokemonname = details.formname;
      }
      if(details.formname in convert.form2species) {
        details.speciesname = convert.form2species[details.formname];
      }
      else {
        details.speciesname = details.formname;
      }

			promises.push(pkm.getPokemonSpeciesByName(details.speciesname)
			.then(function(r) {
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
        // Save types to list
				types = slotSort(r.types);
				typeList = [];
				for(i in types) {
          if(types[i].type.name in convert.type) {
            typeList.push(convert.type[types[i].type.name]);
          }
          else {
            typeList.push(firstUpper(types[i].type.name));
          }
				}

        // Save abilities to list with hidden check
				abilities = slotSort(r.abilities);
				abilityList = [];
				for(i in abilities) {
          if(abilities[i].ability.name in convert.ability) {
            abilityList.push(convert.ability[abilities[i].ability.name]);
          }
          else {
            abilityList.push(firstUpper(abilities[i].ability.name));
          }
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
          if(details.sprite) {
            var spritepromise = message.channel.sendFile(details.sprite);
          }
          Promise.resolve(spritepromise).then(function() {
            reply = details.name + " #" + details.number + details.title
            + "\nHeight: " + details.height
            + "\nWeight: " + details.weight
            + "\n" + pluralCheck("Type", "", "s", typeList) + ": " + typeList.join(" | ")
            + "\n" + pluralCheck("Abilit", "y", "ies", abilityList) + ": " + abilityList.join(", ")
            //+ "\n" + details.flavor
            ;

            message.channel.sendMessage(reply);
          })
          .catch(function(e) {
            console.log("Error in info Promise.resolve for " + name + ": " + e);
          });
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

module.exports = commands;
