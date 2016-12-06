var request = require('request');
var cheerio = require('cheerio');

var pkm_dex = request.defaults({baseUrl: "https://pokemondb.net/pokedex/"})

var commands = {
	// Pokedex commands, individual commands for info
	// pkm_name temporary test command
	pkm_name: {
		description: 'Simple command that returns name of pokemon given name or national dex number',
		run: function(message) {
			pkm_dex(message.content, function(error, response, body) {
			  if(error) {
			    console.log('Error: ' + error);
					message.reply('An error has occured!');
					return;
				}
				if(response.statusCode == '404') {
					message.reply(message.content + ' does not exist!');
					return;
				}

			  var $ = cheerio.load(body);
				var title = $("h1").text();
				message.reply(title);
			});
		}
	}
}

module.exports = commands;
