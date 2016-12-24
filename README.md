# pokemiah
A Node.js Discord bot for retrieving pokemon information. Copyright © 2016, [Mekiah](https://github.com/Mekiah). All rights reserved.

## On License:
I plan to add a GNU license in the future, but I want the bot to have most of the features I have planned before doing so.

## Setup:
To set up the bot to a functioning state:
* Download and install [Node.js](https://nodejs.org/)
* Download or clone the repo
* Go to the project directory and run:
```
$ npm install
```
* Remove .example from the end of .env and replace yourtokenhere with bot token OR if you are hosting this on a service that has a way to add environment variables, add DISCORD_TOKEN for the key, and your token for the value
* **Optionally** download the [fully animated 3D images](https://www.dropbox.com/sh/htlzoi9n03q4hs1/AADs50x93H9n2yogTrcPZG1Ka) to a sprites folder in the project directory

To configure the bot edit settings.json:
* prefix: What character a message must begin with to interact with the bot
* owner: Full username of the person in control of the bot (not the bot's username)
* version: Current game version supported by pokeapi
* count: Current amount of pokemon species supported by pokeapi
* modules: Modules to load on bot start up, boolean determines if it is loaded
* default-module: Module to use when no matching module found in message
* help: Commands that will invoke base help command
* pokedex: Options for [pokedex-promise-v2](https://github.com/PokeAPI/pokedex-promise-v2#configuration)

To run the bot:
```
$ node pokemiah.js
```

## Credit:
* Paul Hallett for hosting https://pokeapi.co/: https://github.com/PokeAPI/pokeapi
* http://www.pkparaiso.com/ for all animated model gifs except the ones listed below
* http://pldh.net/ for animated mode gifs of the extra Arceus forms and extra Genesect forms
* https://veekun.com/ for the non-animated model pngs of the extra Furfrou forms
* http://www.serebii.net/ for the non-animated model pngs of the five costume Pikachu forms, the Unknown Arceus sprite, and the Spiky-eared Pichu sprite
