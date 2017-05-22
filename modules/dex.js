var fs = require("fs");
var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var shared = require("../shared.js");
var settings = require("../settings.json");

var pkm = new Pokedex(settings.pokedex);

var commands = {
	// Returns what !dex does, usage, and list of commands e.g. type, moves, effectiveness
	help: function(message) {
		shared.initCommand(message, "help", "dex", settings.count);
		message.channel.send("Returns information on a pokemon\nNote: Not all commands use subs\nUsage: "
		 + settings.prefix + "dex <command> <sub> <name>\n"
		 + shared.pluralCheck("Command", "", "s", commands) + " (default is \"info\"): "
		 + Object.keys(commands).filter(function(r){if(r !== "run"){return r;}}).join(", "));
	},

	// Default command redirector
	run: function(message, name) {
		commands.info.run(message, name);
	},

	// Returns the basic details of a pokemon
	info: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "info", settings.count);
			message.channel.send("Returns the basic details of a pokemon\nUsage: "
			 + settings.prefix + "dex info <name>\n");
		},

		run: function(message, name) {
			if(shared.initCommand(message, name, "dex", "info", settings.count)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");
			details.speciesname = shared.convertName(details.formname, "form2species");

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
				types = shared.slotSort(r.types);
				typeList = [];
				for(i in types) {
					typeList.push(shared.convertName(types[i].type.name, "type"));
				}

        // Save abilities to list with hidden check
				abilities = shared.slotSort(r.abilities);
				abilityList = [];
				for(i in abilities) {
					abilityList.push(shared.convertName(abilities[i].ability.name, "ability"));
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
					shared.displayError(message, error);
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
          + "\n" + shared.pluralCheck("Type", "", "s", typeList) + ": " + typeList.join(" | ")
          + "\n" + shared.pluralCheck("Abilit", "y", "ies", abilityList) + ": " + abilityList.join(", ")
          + "\nHeight: " + details.height + " - Weight: " + details.weight
          //+ "\n" + details.flavor
          ;

          // Send file with a comment if sprite exists, else send text only
          if(details.sprite) {
            message.channel.send(reply, {file: details.sprite});
          }
          else {
            message.channel.send(reply);
          }
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	},

	// Returns the base stats of a pokemon
	stats: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "stats", settings.count);
			message.channel.send("Returns the base stats of a pokemon\nUsage: "
			 + settings.prefix + "dex stats <sub> <name>\n"
			 + shared.pluralCheck("Sub", "", "s", commands.stats.sub) + " (default is \"all\"): " + Object.keys(commands.stats.sub).join(", "));
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
			if(shared.initCommand(message, name, "dex", "stats", settings.count, command)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");

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
          shared.displayError(message, error);
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

          message.channel.send(reply);
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	},

	// Returns the ev yield of a pokemon
	evs: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "evs", settings.count);
			message.channel.send("Returns the ev yield of a pokemon\nUsage: "
			 + settings.prefix + "dex evs <sub> <name>\n"
			 + shared.pluralCheck("Sub", "", "s", commands.evs.sub) + " (default is \"all\"): " + Object.keys(commands.evs.sub).join(", "));
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
			if(shared.initCommand(message, name, "dex", "evs", settings.count, command)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");

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
					shared.displayError(message, error);
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

					message.channel.send(reply);
				}
			})
			.catch(function(e) {
				shared.logError(message, e);
			});
		}
	},

	// Returns the moves of a pokemon
	moves: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "moves", settings.count);
			message.channel.send("Returns the moves of a pokemon\nUsage: "
			 + settings.prefix + "dex moves <sub> <name>\n"
			 + shared.pluralCheck("Sub", "", "s", commands.moves.sub) + " (default is \"learn\"): " + Object.keys(commands.moves.sub).join(", "));
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
			if(shared.initCommand(message, name, "dex", "moves", settings.count, command)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");

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
								 movesList[r.moves[i].version_group_details[j].level_learned_at].push(shared.convertName(r.moves[i].move.name, "move"));
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
          shared.displayError(message, error);
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
						message.channel.send("No moves.");
					}
					else {
						message.channel.send(replyList.join(", "));
					}
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	},

	// Returns the type of a pokemon
	type: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "type", settings.count);
			message.channel.send("Returns the type of a pokemon\nUsage: "
			 + settings.prefix + "dex type <name>\n");
		},

		run: function(message, name) {
			if(shared.initCommand(message, name, "dex", "type", settings.count)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
        // Save types to list
				types = shared.slotSort(r.types);
				typeList = [];
				for(i in types) {
					typeList.push(shared.convertName(types[i].type.name, "type"));
				}

  			details.types = typeList;
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
          reply = typeList.join(" | ");
          message.channel.send(reply);
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	},

	// Returns the type effectiveness of a pokemon
	effect: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "effects", settings.count);
			message.channel.send("Returns the type effectiveness of a pokemon\nUsage: "
			 + settings.prefix + "dex effect <sub> <name>\n"
			 + shared.pluralCheck("Sub", "", "s", commands.effect.sub) + " (default is \"all\"): " + Object.keys(commands.effect.sub).join(", "));
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
			if(shared.initCommand(message, name, "dex", "effect", settings.count, command)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
        // Save types to list
				types = shared.slotSort(r.types);
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
          shared.displayError(message, error);
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
							shared.displayError(message, error);
						}
						else {
							for(i in effectiveness) {
								multiplier[effectiveness[i]].push(shared.convertName(i, "type"));
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

							message.channel.send(reply);
						}
					})
					.catch(function(e) {
						shared.logError(message, e);
					});
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	},

	// Returns the ability of a pokemon
	ability: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "ability", settings.count);
			message.channel.send("Returns the ability of a pokemon\nUsage: "
			 + settings.prefix + "dex ability <name>\n");
		},

		run: function(message, name) {
			if(shared.initCommand(message, name, "dex", "ability", settings.count)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");

			var promise = pkm.getPokemonByName(details.pokemonname)
			.then(function(r) {
        // Save abilities to list
				abilities = shared.slotSort(r.abilities);
				abilityList = [];
				for(i in abilities) {
					abilityList.push(shared.convertName(abilities[i].ability.name, "ability"));
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
          shared.displayError(message, error);
        }
        else {
          // Build details into a message
          reply = abilityList.join(" | ");
          message.channel.send(reply);
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	},

	// Returns the height of a pokemon
	height: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "height", settings.count);
			message.channel.send("Returns the height of a pokemon\nUsage: "
			 + settings.prefix + "dex height <name>\n");
		},

		run: function(message, name) {
			if(shared.initCommand(message, name, "dex", "height", settings.count)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");

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
          shared.displayError(message, error);
        }
        else {
          // Build details into a message
          reply = details.height;
          message.channel.send(reply);
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	},

	// Returns the weight of a pokemon
	weight: {
		help: function(message) {
			shared.initCommand(message, "help", "dex", "weight", settings.count);
			message.channel.send("Returns the weight of a pokemon\nUsage: "
			 + settings.prefix + "dex weight <name>\n");
		},

		run: function(message, name) {
			if(shared.initCommand(message, name, "dex", "weight", settings.count)) {
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
			details.pokemonname = shared.convertName(details.formname, "form2name");

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
          shared.displayError(message, error);
        }
        else {
          // Build details into a message
          reply = details.weight;
          message.channel.send(reply);
        }
      })
			.catch(function(e) {
        shared.logError(message, e);
      });
		}
	}
}

module.exports = commands;
