var fs = require("fs");
var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var settings = require("../settings.json");
var convert = require("../convert.json");

var pkm = new Pokedex(settings.pokedex);

var commands = {
	// Returns what !dex does, usage, and list of commands e.g. type, moves, effectiveness
	help: function(message) {
		initCommand(message, "help", "dex");
		message.reply("Returns information on a pokemon\nNote: Not all commands use subs\nUsage: "
		 + settings.prefix + "dex <command> <sub> <name>\n"
		 + pluralCheck("Command", "", "s", commands) + " (default is \"info\"): "
		 + Object.keys(commands).filter(function(r) {if(r !== "run") {return r;}}).join(", "));
	},

	// Default command redirector
	run: function(message, name) {
		commands.info.run(message, name);
	},

	// Returns the basic details of a pokemon
	info: {
		help: function(message) {
			initCommand(message, "help", "dex", "info");
			message.reply("Returns the basic details of a pokemon\nUsage: "
			 + settings.prefix + "dex info <name>\n");
		},

		run: function(message, name) {
			if(initCommand(message, name, "dex", "info")) {
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
					displayError(message, error);
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
          + "\n" + pluralCheck("Type", "", "s", typeList) + ": " + typeList.join(" | ")
          + "\n" + pluralCheck("Abilit", "y", "ies", abilityList) + ": " + abilityList.join(", ")
          + "\nHeight: " + details.height + " - Weight: " + details.weight
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
        console.log("Error in info Promise.all: " + e);
      });
		}
	},

	// Returns the base stats of a pokemon
	stats: {
		help: function(message) {
			initCommand(message, "help", "dex", "stats");
			message.reply("Returns the base stats of a pokemon\nUsage: "
			 + settings.prefix + "dex stats <sub> <name>\n"
			 + pluralCheck("Sub", "", "s", commands.stats.sub) + " (default is \"all\"): " + Object.keys(commands.stats.sub).join(", "));
		},

		sub: {
			all: "all",
			hp: "hp",
			atk: "attack",
			def: "defense",
			spa: "special-attack",
			spd: "special-defense",
			spe: "speed"
		},

		run: function(message, name, command) {
			if(command === undefined) {
				command = "all";
			}
			if(initCommand(message, name, "dex", "stats", command)) {
				return;
			}

			var reply;
			var error;
			var details = {
        pokemonname: "",
        formname: name,
				hp: "HP: ",
				attack: "Atk: ",
				defense: "Def: ",
				"special-attack": "SpA: ",
				"special-defense": "SpD: ",
				speed: "Spe: "
			}

			// Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
				for(i in r.stats) {
					details[r.stats[i].stat.name] += r.stats[i].base_stat;
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
					if(command === "all") {
						reply = details.hp + ", " +
						details.attack + ", " +
						details.defense + ", " +
						details["special-attack"] + ", " +
						details["special-defense"] + ", " +
						details.speed;
					}
					else {
						reply = details[command];
					}

          message.reply(reply);
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.resolve: " + e);
      });
		}
	},

	// Returns the ev yield of a pokemon
	evs: {
		help: function(message) {
			initCommand(message, "help", "dex", "evs");
			message.reply("Returns the ev yield of a pokemon\nUsage: "
			 + settings.prefix + "dex evs <sub> <name>\n"
			 + pluralCheck("Sub", "", "s", commands.evs.sub) + " (default is \"all\"): " + Object.keys(commands.evs.sub).join(", "));
		},

		sub: {
			all: "all",
			hp: "hp",
			atk: "attack",
			def: "defense",
			spa: "special-attack",
			spd: "special-defense",
			spe: "speed"
		},

		run: function(message, name, command) {
			if(command === undefined) {
				command = "all";
			}
			if(initCommand(message, name, "dex", "evs", command)) {
				return;
			}

			var reply;
			var error;
			var details = {
				pokemonname: "",
				formname: name,
				hp: "HP: ",
				attack: "Atk: ",
				defense: "Def: ",
				"special-attack": "SpA: ",
				"special-defense": "SpD: ",
				speed: "Spe: "
			}

			// Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
				for(i in r.stats) {
					details[r.stats[i].stat.name] += r.stats[i].effort;
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
					if(command === "all") {
						reply = details.hp + ", " +
						details.attack + ", " +
						details.defense + ", " +
						details["special-attack"] + ", " +
						details["special-defense"] + ", " +
						details.speed;
					}
					else {
						reply = details[command];
					}

					message.reply(reply);
				}
			})
			.catch(function(e) {
				console.log("Error in info Promise.resolve: " + e);
			});
		}
	},

	// Returns the moves of a pokemon
	moves: {
		help: function(message) {
			initCommand(message, "help", "dex", "moves");
			message.reply("Returns the moves of a pokemon\nUsage: "
			 + settings.prefix + "dex moves <sub> <name>\n"
			 + pluralCheck("Sub", "", "s", commands.moves.sub) + " (default is \"learn\"): " + Object.keys(commands.moves.sub).join(", "));
		},

		sub: {
			learn: "level-up",
			egg: "egg",
			tutor: "tutor",
			tm: "machine"
		},

		run: function(message, name, command) {
			if(command === undefined) {
				command = "level-up";
			}
			if(initCommand(message, name, "dex", "moves", command)) {
				return;
			}

			var reply;
			var error;
			var details = {
        pokemonname: "",
        formname: name
			}
			var movesList = {}

			// Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
				// Iterates through moves and version specifics, if settings version and sub match up, add to push to list in object at level acquired
				for(i in r.moves) {
					for(j in r.moves[i].version_group_details) {
						if(settings["version-group"] === r.moves[i].version_group_details[j].version_group.name
							 && command === r.moves[i].version_group_details[j].move_learn_method.name) {
								 if(movesList[r.moves[i].version_group_details[j].level_learned_at] === undefined) {
									 movesList[r.moves[i].version_group_details[j].level_learned_at] = [];
								 }
								 movesList[r.moves[i].version_group_details[j].level_learned_at].push(convertName(r.moves[i].move.name, "move"));
							 }
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
					replyList = [];
					level = "";
					for(i in movesList) {
						if(command === "level-up") {
							level = i + " - ";
						}
						replyList.push(level + movesList[i].sort().join(", "));
					}

					if(replyList.length === 0) {
						message.reply("No moves.");
					}
					else {
						message.reply(replyList.join(", "));
					}
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.resolve: " + e);
      });
		}
	},

	// Returns the type of a pokemon
	type: {
		help: function(message) {
			initCommand(message, "help", "dex", "type");
			message.reply("Returns the type of a pokemon\nUsage: "
			 + settings.prefix + "dex type <name>\n");
		},

		run: function(message, name) {
			if(initCommand(message, name, "dex", "type")) {
				return;
			}

			var reply;
			var error;
			var details = {
        pokemonname: "",
        formname: name,
				types: ""
			}

      // Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
        // Save types to list
				types = slotSort(r.types);
				typeList = [];
				for(i in types) {
					typeList.push(convertName(types[i].type.name, "type"));
				}

  			details.types = typeList;
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
          reply = typeList.join(" | ");
          message.reply(reply);
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.resolve: " + e);
      });
		}
	},

	// Returns the type effectiveness of a pokemon
	effect: {
		help: function(message) {
			initCommand(message, "help", "dex", "effects");
			message.reply("Returns the type effectiveness of a pokemon\nUsage: "
			 + settings.prefix + "dex effect <sub> <name>\n"
			 + pluralCheck("Sub", "", "s", commands.effect.sub) + " (default is \"all\"): " + Object.keys(commands.effect.sub).join(", "));
		},

		sub: {
			all: "all",
			strong: 0.5,
			weak: 2,
			immune: 0,
			neutral: 1
		},

		run: function(message, name, command) {
			if(command === undefined) {
				command = "all";
			}
			if(initCommand(message, name, "dex", "effect", command)) {
				return;
			}

			var reply;
			var error;
			var details = {
        pokemonname: "",
        formname: name,
				types: ""
			}
			var effectiveness = {
				normal: 1,
				fighting: 1,
				flying: 1,
				poison: 1,
				ground: 1,
				rock: 1,
				bug: 1,
				ghost: 1,
				steel: 1,
				fire: 1,
				water: 1,
				grass: 1,
				electric: 1,
				psychic: 1,
				ice: 1,
				dragon: 1,
				dark: 1,
				fairy: 1
			}
			var multiplier = {
				1: [],
				2: [],
				4: [],
				0.5: [],
				0.25: [],
				0: []
			}

      // Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
        // Save types to list
				types = slotSort(r.types);
				typeList = [];
				for(i in types) {
					typeList.push(types[i].type.name);
				}

  			details.types = typeList;
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
					var promises = [];
					for(i in details.types) {
						promises.push(pkm.getTypeByName(details.types[i])
						.then(function(r) {
							for(j in r.damage_relations.half_damage_from) {
								effectiveness[r.damage_relations.half_damage_from[j].name] *= 0.5;
							}
							for(j in r.damage_relations.double_damage_from) {
								effectiveness[r.damage_relations.double_damage_from[j].name] *= 2;
							}
							for(j in r.damage_relations.no_damage_from) {
								effectiveness[r.damage_relations.no_damage_from[j].name] *= 0;
							}
						}).
						catch(function(e) {
							error = e;
						}));
					}

					Promise.all(promises)
					.then(function() {
						if(error) {
							displayError(message, error);
						}
						else {
							for(i in effectiveness) {
								multiplier[effectiveness[i]].push(convertName(i, "type"));
							}
							var replyList = {}
							for(i in multiplier)
							{
								if(multiplier[i].length !== 0 && (command === "all" || command === i || command * command === i))	{
									replyList[i] = "\n" + i + "x: " + multiplier[i].join(", ");
								}
								else {
									replyList[i] = "";
								}
							}
							reply = replyList[1] + replyList[2] + replyList[4] + replyList[0.5] + replyList[0.25] + replyList[0];

							message.reply(reply);
						}
					})
					.catch(function(e) {
						console.log("Error in info Promise.all: " + e);
					});
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.resolve: " + e);
      });
		}
	},

	// Returns the ability of a pokemon
	ability: {
		help: function(message) {
			initCommand(message, "help", "dex", "ability");
			message.reply("Returns the ability of a pokemon\nUsage: "
			 + settings.prefix + "dex ability <name>\n");
		},

		run: function(message, name) {
			if(initCommand(message, name, "dex", "ability")) {
				return;
			}

			var reply;
			var error;
			var details = {
        pokemonname: "",
        formname: name,
				abilities: ""
			}

      // Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
        // Save abilities to list
				abilities = slotSort(r.abilities);
				abilityList = [];
				for(i in abilities) {
					abilityList.push(convertName(abilities[i].ability.name, "ability"));
					if(abilities[i].is_hidden) {
            abilityList[i] = "**" + abilityList[i] + "**";
          }
				}

  			details.abilities = abilityList;
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
          reply = abilityList.join(" | ");
          message.reply(reply);
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.resolve: " + e);
      });
		}
	},

	// Returns the height of a pokemon
	height: {
		help: function(message) {
			initCommand(message, "help", "dex", "height");
			message.reply("Returns the height of a pokemon\nUsage: "
			 + settings.prefix + "dex height <name>\n");
		},

		run: function(message, name) {
			if(initCommand(message, name, "dex", "height")) {
				return;
			}

			var reply;
			var error;
			var details = {
        pokemonname: "",
        formname: name,
				height: ""
			}

      // Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
  			details.height = (r.height / 10) + " m";
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
          reply = details.height;
          message.reply(reply);
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.resolve: " + e);
      });
		}
	},

	// Returns the weight of a pokemon
	weight: {
		help: function(message) {
			initCommand(message, "help", "dex", "weight");
			message.reply("Returns the weight of a pokemon\nUsage: "
			 + settings.prefix + "dex weight <name>\n");
		},

		run: function(message, name) {
			if(initCommand(message, name, "dex", "weight")) {
				return;
			}

			var reply;
			var error;
			var details = {
        pokemonname: "",
        formname: name,
				weight: ""
			}

      // Get api names using convert.json
			details.pokemonname = convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
  			details.weight = (r.weight / 10) + " kg";
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
          reply = details.weight;
          message.reply(reply);
        }
      })
			.catch(function(e) {
        console.log("Error in info Promise.resolve: " + e);
      });
		}
	}
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
	if(parseInt(name) > settings.count) {
		message.reply("404 - {\"detail\":\"Not found.\"}".replace("detail", name));
		return true;
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
	if(name in convert[target]) {
		name = convert[target][name];
	}
	else if(["type", "ability", "move"].indexOf(target) !== -1) {
		name = firstUpper(name);
	}
	return name;
}

module.exports = commands;
