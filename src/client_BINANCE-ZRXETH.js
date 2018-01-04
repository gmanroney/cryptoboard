/*jshint esversion: 6 */

// Include packages
var sys = require('util');

// Connect to Redis
var redis = require('redis');
global.client = redis.createClient('6379','127.0.0.1');
client.on('connect', function() {
    console.log('Connected to Redis Server');
});

// Subscribe to Redis channel and output values
function clientSubscribe(conn) {
  client.subscribe(conn.exchange:conn.symbol);
  client.on("message", function(channel, message) {
    const msg = JSON.parse(message);
    console.log(channel,msg.tr_id,msg.tr_side);
  });
}

// Main function
function main () {
  var connection = [];
  connection.exchange = 'BINANCE';
  connection.symbol = 'ZRXETH';
  clientSubscribe();
}

// Call main function
main();
