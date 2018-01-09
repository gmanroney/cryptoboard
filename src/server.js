/*jshint esversion: 6 */

// Include packages
var util = require('util');
var moment=require('moment');
var fs = require('fs');

global.redis = require('redis');

// Include configuration file
global.config = require('../config/default.json');

// Add in functions that perform transformation of data from different exchanges and publish to Redis
var exFn = require("../functions/exchange_functions.js");

// Main program wrapper
function main ()
{

  // get command-line argument of exchange
  var exchange_opt = exFn.getArguments();
  console.log(new Date() + ': selected exchange = ' + exchange_opt);

  // ddd
  var redis_connect = true;

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
        if ( exchange_name == exchange_opt.toUpperCase() ) {
          if ( exchange_name == 'BITFINEX' ) {
            redis_connect = exFn.redisClient(redis_connect);
            exFn.processBITFINEX(exchange_name, exchange_wss, exchange_symbol );
          } else if ( exchange_name == 'HITBTC' ) {
            redis_connect = exFn.redisClient(redis_connect);
            exFn.processHITBTC(exchange_name, exchange_wss, exchange_symbol );
          } else if ( exchange_name == 'GEMINI' ) {
            redis_connect = exFn.redisClient(redis_connect);
            exFn.processGEMINI(client, exchange_name, exchange_wss, exchange_symbol );
          } else if ( exchange_name == 'HUOBIAPI' ) {
            redis_connect = exFn.redisClient(redis_connect);
            exFn.processHUOBIAPI(exchange_name, exchange_wss, exchange_symbol );
          } else if ( exchange_name == 'OKEX' ) {
            redis_connect = exFn.redisClient(redis_connect);
            exFn.processOKEX(exchange_name, exchange_wss, exchange_symbol);
          } else if ( exchange_name == 'GDAX' ) {
            redis_connect = exFn.redisClient(redis_connect);
            exFn.processGDAX(exchange_name, exchange_wss, exchange_symbol );
          } else if ( exchange_name == 'BITSTAMP' ) {
            redis_connect = exFn.redisClient(redis_connect);
            exFn.processBITSTAMP(exchange_name, exchange_wss, exchange_symbol );
          } else if ( exchange_name == 'BINANCE' ) {
            redis_connect = exFn.redisClient(redis_connect);
            exFn.processBINANCE(exchange_name, exchange_wss, exchange_symbol );
          } else if ( exchange_name == 'BITTREX' ) {
            // We will send all symbols in one request for BITTREX because it allows it and its more efficient.
            exchange_symbol_list.push(exchange_symbol);
            if ( j ==  ( exchange_symbol_array.length - 1) )
            {
              redis_connect = exFn.redisClient(redis_connect);
              exFn.processBITTREX(exchange_name, exchange_wss, exchange_symbol_list);
            }
          }
        } else {
          if ( j ==  ( exchange_symbol_array.length - 1) )
          {
            console.log("ERROR: Unrecognized exchange name in configuration. Please check configuration for exchange: " + exchange_opt );
          }
        }
      }
    }
  }

  // End of main function
  console.log("Finshed launch");
}

// Start application
var access = fs.createWriteStream('../logs/server.log');
process.stdout.write = process.stderr.write = access.write.bind(access);
process.on('uncaughtException', function(err) {
  console.error((err && err.stack) ? err.stack : err);
});

main();
