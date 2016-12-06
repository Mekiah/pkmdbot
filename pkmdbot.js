var discord = require('discord.js');
var login = require('./login.json');
var dex = require('./modules/dex.js');

var bot = new discord.Client();

bot.on('ready', function() {
  console.log('Logged in as ' + bot.user.username + '#' + bot.user.discriminator);
});

bot.on('message', function(message) {
	// Temporary command to kill bot process quickly from chat
	if(message.content == "die"){
    console.log("Logging off...");
		bot.destroy();
    process.exit();
	}

	// Main message check. Check for bot message and prefix/command
	if(message.author != bot.user){
		dex.pkm_name.run(message);
	}
});

bot.login(login.token);
