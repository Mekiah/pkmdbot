var fs = require("fs");
var convert = require("./convert.json");
var settings = require("./settings.json");

module.exports = {
  initCommand: function(message, name, mod, command, limit, sub) {
    var args = [mod, command, sub, name].filter(function(r){if(r){return r;}}).join(" ");

    console.log("Serving " + settings.prefix + args + " to "
    + message.author.username + "#" + message.author.discriminator);
    // Skips api check passed number is out of limit
    if(parseInt(name) > limit) {
      message.channel.send("404: " + name + " not found.");
      return true;
    }
  },

  toApiCase: function(string) {
    var api = string.replace(/é/g,"e").replace(/[^\-0-9A-Za-z?!]/g,"").toLowerCase();
    while(api[0] === "?") {
      api = api.replace(/^\?/,"");
    }
    if(api in convert.read2form) {
      api = convert.read2form[api];
    }
    if(api === "") {
      api = "-";
    }
    return api;
  },
  convertName: function(name, target) {
    if(name in convert[target]) {
      name = convert[target][name];
    }
    else if(["type", "ability", "move"].indexOf(target) !== -1) {
      name = module.exports.firstUpper(name);
    }
    return name;
  },
  firstUpper: function(string) {
    upped = string.split("-");
    for(u in upped) {
      upped[u] = upped[u][0].toUpperCase() + upped[u].substring(1);
    }
    return upped.join(" ");
  },

  pluralCheck: function(o, s, p, list) {
    if(Object.keys(list).filter(function(r){if(r !== "run"){return r;}}).length > 1) {
      return o + p;
    }
    else {
      return o + s;
    }
  },
  slotSort: function(list) {
    return list.sort(function(a, b) {
      return a.slot - b.slot;
    });
  },

  displayError: function(message, error) {
    if(error.statusCode === 404 && "options" in error && "url" in error.options) {
  		message.channel.send("404: " + module.exports.getLastPart(error.options.url) + " not found.");
  	}
  	else {
      if("message" in error) {
    		message.channel.send(error.message);
    		console.log(error.message);
    	}
      else {
        message.channel.send("Error encountered. Check logs for details.");
      }
  		fs.appendFile("error.log", JSON.stringify(error, null, 2), function(e) {
  			if(e) {
  				console.log("Error writing to error log: " + e);
  			}
  			else {
  				console.log("Successfully wrote to error.log");
  			}
  		});
  	}
  },
  logError: function(message, error) {
    if("stack" in error) {
      error = error.stack;
    }
    fs.appendFile("error.log", error + "\n", function(e) {
      if(e) {
        console.log("Error writing to error.log: " + e);
        message.channel.send("Error encountered. Check console for details.");
      }
      else {
        console.log("Successfully wrote to error.log");
        message.channel.send("Error encountered. Check logs for details.");
      }
    });
  },
  getLastPart: function(url) {
  	return url.split("/").filter(function(r){if(r !== ""){return r;}}).slice(-1)[0];
  }
}
