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
  console.log('Connection:' , conn );
  client.subscribe(conn.exchange + ':' + conn.symbol);
  client.on("message", function(channel, message) {
    const msg = JSON.parse(message);
    console.log(channel,msg.tr_id,msg.tr_side,msg.tr_amount,msg.tr_price,msg.tr_timestamp);
  });
}

// Main function
function main () {
  const args = process.argv;
  var connect = [];
  connect.exchange = args[2] || 'undefined';
  connect.symbol = args[3] || 'undefined' ;
  if ( connect.exchange == 'undefined' || connect.symbol == 'undefined' )
  {
    console.log("ERROR: value for exchange and/or symbol not provided. Syntax: nodejs client.js <exchange> <symbol>");
  } else {
    clientSubscribe(connect);
  }
}

// Call main function
main();
