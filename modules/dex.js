var Promise = require("promise");
var Pokedex = require("pokedex-promise-v2");
var settings = require("../settings.json");

var options = {
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
			console.log("Function start.");

			// Skips api check if dex # out of range
			if(parseInt(name) > settings.count) {
				message.channel.sendMessage("404 - Not found.");
				return;
			}

			var reply = "";
			var details = {
				sprite: "",
				name: "",
				number: "",
				height: "",
				weight: "",
				types: "",
				abilities: ""
			}
			var promises = [];

/* With nested promises
			pkm.getPokemonByName(name)
				.then(function(r) {
					console.log("then1 start");

					reply = r.name + " #" + r.id + "\nWeight: " + r.weight/10 + " kg";
					details.number = r.id;
					details.weight = r.weight/10;
					details.height = r.height/10;

					types = slotSort(r.types);
					typeList = [];
					for(i in types) {
						typeList.push(firstUpper(types[i].type.name));
					}
					reply = reply + "\n" + pluralCheck("Type", "", "s", typeList) + ": " + typeList.join(" | ");
					details.type = typeList;

					abilities = slotSort(r.abilities);
					abilityList = [];
					for(i in abilities) {
						abilityList.push(firstUpper(abilities[i].ability.name));
					}
					reply = reply + "\n" + pluralCheck("Abilit", "y", "ies", abilityList) + ": " + abilityList.join(", ");
					details.ability = abilityList;

					message.channel.sendMessage(reply);
					console.log(details);

					console.log("then1 end");
					return r.name;
				})
				.then(function(name) {
					console.log("species then arg: " + name);
					pkm.getPokemonSpeciesByName(name)
						.then(function(r) {
							console.log("then2 start");
							for(i in r.names) {
								if(r.names[i].language.name === "en") {
									details.name = r.names[i].name;
									return name;
								}
							}
							console.log("then2 end");
						})
						.catch(function(e) {
							console.log("catch2 start");
							console.log("pokemon is a form");
							console.log("catch2 end");
							return name;
						});
				})
				.then(function(name) {
					pkm.getPokemonFormByName(name)
						.then(function(r) {
							console.log("then3 start");
							for(i in r.names) {
								if(r.names[i].language.name === "en") {
									details.name = r.names[i].name;
									break;
								}
							}
							console.log("then3 end");
						})
						.catch(function(e) {
							console.log("catch3 start");
							console.log(name + " form resource not found");
							console.log("catch3 end");
						});
				})
				.catch(function(e) {
					console.log("catch1 start");

					if('statusCode' in e && 'error' in e && 'detail' in e.error) {
						message.channel.sendMessage(e.statusCode + " - " + e.error.detail);
					}
					else {
						message.channel.sendMessage(e.name + " - " + e.message);
						console.log(e.name + " - " + e.message);
					}

					console.log("catch1 end");
				});
*/

/* side by side callbacks
			pkm.getPokemonSpeciesByName(name, function(r, e) {
				console.log("Species call start.");
				if(e) {
					doformcall = true;
				}
				else {
					for(i in r.names) {
						if(r.names[i].language.name === "en") {
							details.name = r.names[i].name;
							break;
						}
					}
				}
				console.log("Species call end.");
			});

			pkm.getPokemonFormByName(name, function(r, e) {
				console.log("Form call start.");
				if(e) {
					console.log(name + " form resource not found");
				}
				else {
					for(i in r.names) {
						if(r.names[i].language.name === "en") {
							details.name = r.names[i].name;
							break;
						}
					}
				}
				console.log("Form call end.");
			});

			pkm.getPokemonByName(name, function(r, e) {
				console.log("Name call start.");
				if(e) {
					if('statusCode' in e && 'error' in e && 'detail' in e.error) {
						message.channel.sendMessage(e.statusCode + " - " + e.error.detail);
					}
					else {
						message.channel.sendMessage(e.name + " - " + e.message);
						console.log(e.name + " - " + e.message);
					}
				}
				else {


					reply = r.name + " #" + r.id + "\nWeight: " + r.weight/10 + " kg";

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
				console.log("Name call end.");
			});
*/

/* side by side calls backs + pushing

			promises.push(pkm.getPokemonSpeciesByName(name, function(r, e) {
				console.log("Species call start.");
				if(e) {
					doformcall = true;
				}
				else {
					for(i in r.names) {
						if(r.names[i].language.name === "en") {
							details.name = r.names[i].name;
							break;
						}
					}
				}
				console.log("Species call end.");
			}))

			promises.push(pkm.getPokemonFormByName(name, function(r, e) {
				console.log("Form call start.");
				if(e) {
					console.log(name + " form resource not found");
				}
				else {
					for(i in r.names) {
						if(r.names[i].language.name === "en") {
							details.name = r.names[i].name;
							break;
						}
					}
				}
				console.log("Form call end.");
			}))

			promises.push(pkm.getPokemonByName(name, function(r, e) {
				console.log("Name call start.");
				if(e) {
					if('statusCode' in e && 'error' in e && 'detail' in e.error) {
						message.channel.sendMessage(e.statusCode + " - " + e.error.detail);
					}
					else {
						message.channel.sendMessage(e.name + " - " + e.message);
						console.log(e.name + " - " + e.message);
					}
				}
				else {
					details.height = r.height;
					details.weight = r.weight;
					reply = r.name + " #" + r.id + "\nWeight: " + r.weight/10 + " kg";

					types = slotSort(r.types);
					typeList = [];
					for(i in types) {
						typeList.push(firstUpper(types[i].type.name));
					}
					details.types = typeList;
					reply = reply + "\n" + pluralCheck("Type", "", "s", typeList) + ": " + typeList.join(" | ");

					abilities = slotSort(r.abilities);
					abilityList = [];
					for(i in abilities) {
						abilityList.push(firstUpper(abilities[i].ability.name));
					}
					details.ability = abilityList;
					reply = reply + "\n" + pluralCheck("Abilit", "y", "ies", abilityList) + ": " + abilityList.join(", ");

					message.channel.sendMessage(reply);
				}
				console.log("Name call end.");
			}))
*/

/* side by side promises


			pkm.getPokemonFormByName(name)
		    .then(function(r) {
					console.log("Namethen call start.");
					reply = r.name + " #" + r.id + "\nWeight: " + r.weight/10 + " kg";

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
					console.log("Namethen call start.");
		    })
		    .catch(function(e) {
					console.log("Namecatch call start.");
					if('statusCode' in e && 'error' in e && 'detail' in e.error) {
						message.channel.sendMessage(e.statusCode + " - " + e.error.detail);
					}
					else {
						message.channel.sendMessage(e.name + " - " + e.message);
						console.log(e.name + " - " + e.message);
					}
					console.log("Namecatch call end.");
		    });


				pkm.getPokemonFormByName(name)
			    .then(function(r) {
						console.log("Formthen call start.");
						for(i in r.names) {
							if(r.names[i].language.name === "en") {
								details.name = r.names[i].name;
								break;
							}
						}
						console.log("Formthen call start.");
			    })
			    .catch(function(e) {
						console.log("Formcatch call start.");
						console.log(name + " form resource not found");
						console.log("Formcatch call end.");
			    });





				pkm.getPokemonSpeciesByName(name)
					.then(function(r) {
						console.log("Speciesthen call start.");
						for(i in r.names) {
							if(r.names[i].language.name === "en") {
								details.name = r.names[i].name;
								//break;
							}
						}
						console.log("Speciesthen call start.");
					})
					.catch(function(e) {
						console.log("Speciescatch call start.");
						console.log("Speciescatch call end.");
					});
					*/


			promises.push(pkm.getPokemonSpeciesByName(name)
			.then(function(r) {
				console.log("Species then call start.");

				for(i in r.names) {
					if(r.names[i].language.name === "en") {
						details.name = r.names[i].name;
						break;
					}
				}

				console.log("Species then call end.");
			})
			.catch(function(e) {
				console.log("Species catch call start.");

				console.log(name + " species resource not found.");

				console.log("Species catch call end.");
			}));

			promises.push(pkm.getPokemonFormByName(name)
			.then(function(r) {
				console.log("Form then call start.");

				for(i in r.names) {
					if(r.names[i].language.name === "en") {
						details.name = r.names[i].name;
						break;
					}
				}

				console.log("Form then call end.");
			})
			.catch(function(e) {
				console.log("Form catch call start.");

				console.log(name + " form resource not found.");

				console.log("Form catch call end.");
			}));

			promises.push(pkm.getPokemonByName(name)
			.then(function(r) {
				console.log("Name then call start.");

				details.height = r.height;
				details.weight = r.weight;
				reply = r.name + " #" + r.id + "\nWeight: " + r.weight/10 + " kg";

				types = slotSort(r.types);
				typeList = [];
				for(i in types) {
					typeList.push(firstUpper(types[i].type.name));
				}
				details.types = typeList;
				reply = reply + "\n" + pluralCheck("Type", "", "s", typeList) + ": " + typeList.join(" | ");

				abilities = slotSort(r.abilities);
				abilityList = [];
				for(i in abilities) {
					abilityList.push(firstUpper(abilities[i].ability.name));
				}
				details.abilities = abilityList;
				reply = reply + "\n" + pluralCheck("Abilit", "y", "ies", abilityList) + ": " + abilityList.join(", ");

				message.channel.sendMessage(reply);

				console.log("Name then call end.");
			})
			.catch(function(e) {
				console.log("Name catch call start.");

				console.log(name + " name resource not found.");
				if('statusCode' in e && 'error' in e && 'detail' in e.error) {
					message.channel.sendMessage(e.statusCode + " - " + e.error.detail);
				}
				else {
					message.channel.sendMessage(e.name + " - " + e.message);
					console.log(e.name + " - " + e.message);
				}

				console.log("Name catch call end.");
			}));



			Promise.all(promises)
			.then(function() { console.log(details); })
			.catch(console.error);

			console.log("Function end.");
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

function getProperName(name) {
	pkm.getPokemonSpeciesByName(name, function(r2, e2) {
		if(e2) {
			pkm.getPokemonFormByName(name, function(r3, e3) {
				if(e3) {
					console.log(name + " form resource not found");
				}
				else {
					for(i in r3.names) {
						if(r3.names[i].language.name === "en") {
							return r3.names[i].name;
						}
					}
				}
			});
		}
		else {
			for(i in r2.names) {
				if(r2.names[i].language.name === "en") {
					return r2.names[i].name;
				}
			}
		}
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
