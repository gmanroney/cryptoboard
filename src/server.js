/*jshint esversion: 6 */

// Include packages
var sys = require('util');
var redis = require('redis');
var moment=require('moment');

// Include configuration file
var config = require('../config/default.json');

// Create Redis client connection
global.client = redis.createClient(config.redis.port,config.redis.host);
client.on('connect', function() {
    console.log('Connected to Redis Server');
});

// Add in functions that perform transformation of data from different exchanges and publish to Redis
var exFn = require("../functions/exchange_functions.js");

// Main program wrapper
function main ()
{

  // Loop through exchanges (preparation for later)
  for (var i = 0; i < config.exchanges.length; i++ )
  {

    // Parse configuration data about each exchange and currencies (symbol) tracked
    var exchange_name = config.exchanges[i].name.toUpperCase();
    var exchange_wss = config.exchanges[i].wssurl;
    var exchange_symbol_array = config.exchanges[i].pairs;
    var exchange_active = config.exchanges[i].active;

    // Only process configurationg for exchange if it is active
    if ( exchange_active == 'Y') {

      // Array to hold list of symbols; works for BITREX not sure about others.
      var exchange_symbol_list = [];

      // Loop through config for exchange: connect, transform and create Redis pub/sub
      for ( var j = 0; j < exchange_symbol_array.length; j++)
      {
        var exchange_symbol = exchange_symbol_array[j].symbol;
        if ( exchange_name == 'BITFINEX' ) {
          exFn.processBITFINEX(exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'HITBTC' ) {
          exFn.processHITBTC(exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'GEMINI' ) {
          exFn.processGEMINI(client, exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'HUOBIAPI' ) {
          exFn.processHUOBIAPI(exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'OKEX' ) {
          exFn.processOKEX(exchange_name, exchange_wss, exchange_symbol);
        } else if ( exchange_name == 'GDAX' ) {
          exFn.processGDAX(exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'BITSTAMP' ) {
          exFn.processBITSTAMP(exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'BINANCE' ) {
          exFn.processBINANCE(exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'BITTREX' ) {
          // We will send all symbols in one request for BITTREX because it allows it and its more efficient.
          exchange_symbol_list.push(exchange_symbol);
          if ( j ==  ( exchange_symbol_array.length - 1) )
          {
            exFn.processBITTREX(exchange_name, exchange_wss, exchange_symbol_list);
          }
        } else {
          console.log("ERROR: Unrecognized exchange name in configuration. Please check " + exchange_name );
        }
      }
    }
  }

  // End of main function
  console.log("Finshed launch");
}

// Start application
main();
