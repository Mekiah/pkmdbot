var discord = require('discord.js');
var login = require('./login.json');
var settings = require('./settings.json');
var dex = require('./modules/dex.js');

var bot = new discord.Client();

bot.on('ready', function() {
  console.log('Logged in as ' + bot.user.username + '#' + bot.user.discriminator);
});

bot.on('disconnect', function() {
  console.log("Logging off...");
  process.exit();
});

bot.on('message', function(message) {
  if(message.author !== bot.user && message.content.startsWith(settings.prefix) && message.content.length > 1) {
    var params = message.content.substring(1).split(" ", 3);
    // Owner kill switch
    if(params[0] === "die") {
      bot.destroy();
    }

    if(params[0] === "dex") {
      switch (params.length) {
        case 1:
          dex.meta(message);
          break;
        case 2:
          dex.info(message, params[1]);
          break;
        case 3:
          break;
        default:
          break;
      }
    }
  }
});

bot.login(login.token);
