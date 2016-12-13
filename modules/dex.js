var request = require("request");
var cheerio = require("cheerio");
var settings = require("../settings.json");

var pkm_dex = request.defaults({baseUrl: "https://pokemondb.net/pokedex/"});

var commands = {
	// Returns what !dex does, usage, and list of commands e.g. type, moves, effectiveness
	meta: function(message) {
		message.reply("Returns information on a specific pokemon\nUsage: `" + settings.prefix + "dex <pokemon> <command>`\nCommands (default is \"info\"): " + Object.keys(commands));
	},

	// Default command, returns basic information on a pokemon
	info: function(message, name, version) {
		if(!version) {
			version = settings.version;
		}
		pkm_dex(name, function(error, response, body) {
				if(error) {
					console.log("Error: " + error);
					message.reply("An error has occured!");
					return;
				}
				if(response.statusCode == "404") {
					message.reply(name + " does not exist!");
					return;
				}

				var $ = cheerio.load(body);
				var title = $("h1").text();
				message.reply(title + version);
			});
	}
}

module.exports = commands;
