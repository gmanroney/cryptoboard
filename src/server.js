/*jshint esversion: 6 */

//  General Libraries Needed By Application
var sys = require('util');
//var bittrex = require('../node_modules/node.bittrex.api/node.bittrex.api');
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

    // Loop through config for BITFINEX & connect, transform and create Redis pub/sub
    if ( exchange_name == 'xBITFINEX')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processBITFINEX(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for HITBTC & connect, transform and create Redis pub/sub
    if ( exchange_name == 'xHITBTC')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processHITBTC(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for GEMINI & connect, transform and create Redis pub/sub
    if ( exchange_name == 'xGEMINI')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processGEMINI(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for HUOBIAPI & connect, transform and create Redis pub/sub
    if ( exchange_name == 'xHUOBIAPI')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processHUOBIAPI(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for OKEX & connect, transform and create Redis pub/sub
    if ( exchange_name == 'OKEX')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processOKEX(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for BITTREX & connect, transform and create Redis pub/sub
    if ( exchange_name == 'xBITTREX')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        // concatenate all of the symbols together because thats the way this API works for some reason
        if ( j == 0 ) {
          exchange_symbol = "\'" + exchange_symbol_array[j].symbol + "\'" ;
        } else {
          exchange_symbol = exchange_symbol + "," + "\'" + exchange_symbol_array[j].symbol + "\'";
        }
        if ( j ==  ( exchange_symbol_array.length - 1) )
        {
          console.log(exchange_name, exchange_wss, exchange_symbol);
          exFn.processBITTREX(client, exchange_name, exchange_wss, exchange_symbol);
        }
      }
    }

  }

  // End of main function
  console.log("Finshed launch");
}

// Start application
main();
