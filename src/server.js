/*jshint esversion: 6 */

//  General Libraries Needed By Application
var sys = require('util');
require('moment');

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
  for (var i = 0; i < config.exchanges.length; i++ )
  {
    var exchange_name = config.exchanges[i].name.toUpperCase();
    var exchange_wss = config.exchanges[i].wssurl;
    var exchange_symbol_array = config.exchanges[i].pairs;
    var exchange_active = config.exchanges[i].active;

    // Loop through config for BITFINEX & connect, transform and create Redis pub/sub
    if ( exchange_name == 'BITFINEX' && exchange_active == 'Y')
    {
      for( var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processBITFINEX(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for HITBTC & connect, transform and create Redis pub/sub
    if ( exchange_name == 'HITBTC'  && exchange_active == 'Y')
    {
      for( var k = 0; k < exchange_symbol_array.length; k++)
      {
        exchange_symbol = exchange_symbol_array[k].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processHITBTC(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for GEMINI & connect, transform and create Redis pub/sub
    if ( exchange_name == 'GEMINI'  && exchange_active == 'Y')
    {
      for( var l = 0; l < exchange_symbol_array.length; l++)
      {
        exchange_symbol = exchange_symbol_array[l].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processGEMINI(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for HUOBIAPI & connect, transform and create Redis pub/sub
    if ( exchange_name == 'HUOBIAPI'  && exchange_active == 'Y' )
    {
      for( var m = 0; m < exchange_symbol_array.length; m++)
      {
        exchange_symbol = exchange_symbol_array[m].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processHUOBIAPI(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for OKEX & connect, transform and create Redis pub/sub
    if ( exchange_name == 'OKEX' && exchange_active == 'Y' )
    {
      for( var n = 0; n < exchange_symbol_array.length; n++)
      {
        exchange_symbol = exchange_symbol_array[n].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processOKEX(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for GDAX & connect, transform and create Redis pub/sub
    if ( exchange_name == 'GDAX' && exchange_active == 'Y' )
    {
      for( var p = 0; p < exchange_symbol_array.length; p++)
      {
        exchange_symbol = exchange_symbol_array[p].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processGDAX(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for BITSTAMP & connect, transform and create Redis pub/sub
    if ( exchange_name == 'BITSTAMP' && exchange_active == 'Y' )
    {
      for( var p = 0; p < exchange_symbol_array.length; p++)
      {
        exchange_symbol = exchange_symbol_array[p].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processBITSTAMP(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for BITSTAMP & connect, transform and create Redis pub/sub
    if ( exchange_name == 'BINANCE' && exchange_active == 'Y' )
    {
      for( var p = 0; p < exchange_symbol_array.length; p++)
      {
        exchange_symbol = exchange_symbol_array[p].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        exFn.processBINANCE(client, exchange_name, exchange_wss, exchange_symbol);
      }
    }

    // Loop through config for BITTREX & connect, transform and create Redis pub/sub
    if ( exchange_name == 'BITTREX' && exchange_active == 'Y')
    {
      for( var q = 0; q < exchange_symbol_array.length; q++)
      {
        // concatenate all of the symbols together because thats the way this API works for some reason
        if ( q == 0 ) {
          exchange_symbol = "\'" + exchange_symbol_array[q].symbol + "\'" ;
        } else {
          exchange_symbol = exchange_symbol + "," + "\'" + exchange_symbol_array[q].symbol + "\'";
        }
        if ( q ==  ( exchange_symbol_array.length - 1) )
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
