/*jshint esversion: 6 */

// Include packages
var sys = require('util');
var redis = require('redis');
var moment=require('moment');

// Include configuration file
var config = require('../config/default.json');

// Create Redis client connection
var client = redis.createClient(config.redis.port,config.redis.host);
client.on('connect', function() {
    console.log('Connected to Redis Server');
});

// Add in functions that perform transformation of data from different exchanges and publish to Redis
var exFn = require("../functions/exchange_functions.js");

// Main program wrapper
function main () {

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

      // Loop through config for exchange: connect, transform and create Redis pub/sub
      for ( var j = 0; j < exchange_symbol_array.length; j++)
      {
        var exchange_symbol = exchange_symbol_array[j].symbol;
        if ( exchange_name == 'BITFINEX' ) {
          exFn.processBITFINEX(client, exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'HITBTC' ) {
          exFn.processHITBTC(client, exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'GEMINI' ) {
          exFn.processGEMINI(client, exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'HUOBIAPI' ) {
          exFn.processHUOBIAPI(client, exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'OKEX' ) {
          exFn.processOKEX(client, exchange_name, exchange_wss, exchange_symbol);
        } else if ( exchange_name == 'GDAX' ) {
          exFn.processGDAX(client, exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'BITSTAMP' ) {
          exFn.processBITSTAMP(client, exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'BINANCE' ) {
          exFn.processBINANCE(client, exchange_name, exchange_wss, exchange_symbol );
        } else if ( exchange_name == 'BITTREX' ) {
          // concatenate all of the symbols together because thats the way this API works for some reason
          if ( j == 0 ) {
            exchange_symbol = "\'" + exchange_symbol_array[s].symbol + "\'" ;
          } else {
            exchange_symbol = exchange_symbol + "," + "\'" + exchange_symbol_array[s].symbol + "\'";
          }
          if ( j ==  ( exchange_symbol_array.length - 1) )
          {
            exFn.processBITTREX(client, exchange_name, exchange_wss, exchange_symbol);
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
