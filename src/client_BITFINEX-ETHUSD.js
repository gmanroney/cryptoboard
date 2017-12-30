/*jshint esversion: 6 */

var sys = require('util');

// Connect to Redis
var redis = require('redis');
var client = redis.createClient('6379','127.0.0.1');
client.on('connect', function() {
    console.log('Connected to Redis Server');
});

client.subscribe("BITFINEX:ETHUSD");

client.on("message", function(channel, message) {
  //const msg = JSON.parse(message);
  console.log("Message '" + message + "' on channel '" + channel + "' arrived!");
});
