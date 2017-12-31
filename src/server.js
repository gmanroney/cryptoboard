/*jshint esversion: 6 */

//  General Libraries Needed By Application
var sys = require('util');
var config = require('../config/default.json');

// Connect to Redis
var redis = require('redis');
var client = redis.createClient(config.redis.port,config.redis.host);
client.on('connect', function() {
    console.log('Connected to Redis Server');
});

// Add in bespoke functions for application
var exFn = require("../functions/exchange_functions.js");

// Main program wrapper
function main () {

  // Loop through exchanges (preparation for later)
  for (var i=0; i < config.exchanges.length; i++ )
  {
    var exchange_name = config.exchanges[i].name.toUpperCase();
    var exchange_wss = config.exchanges[i].wssurl;
    var exchange_symbol_array = config.exchanges[i].pairs;

    if ( exchange_name == 'xBITFINEX')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processBITFINEX(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    if ( exchange_name == 'xHITBTC')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processHITBTC(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    if ( exchange_name == 'xGEMINI')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processGEMINI(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    if ( exchange_name == 'HUOBIAPI')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processHUOBIAPI(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

  }

  // End of main function
  console.log("Finshed launch");
}

// Start application
main();
