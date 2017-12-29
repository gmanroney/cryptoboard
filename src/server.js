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

// Connect To Exchange
const WebSocket = require('ws')
const wss = new WebSocket('wss://api.bitfinex.com/ws/')

// Subscribe To Channel In Exchange
var bc_queue = 'BITFINEX:BTCUSD';
wss.onopen = () => {
  console.log('Subscribing: BTCUSD');
  wss.send(JSON.stringify(
    {
      "event": "subscribe",
      "channel": "trades",
      "pair": "BTCUSD"
    }
  ));
}

// Parse channel information and send to Redis
wss.onmessage = (msg) => {
  //console.log(msg.data)
  var resp = JSON.parse(msg.data);
  var head = resp["event"];
  var head_body = resp[1];

  //console.log(head, msg.data)
  //console.log(hb);
  if ( head == "subscribed" ) {
    console.log( bc_queue, " channelID = ", resp["chanId"], " currency = ", resp["pair"]);
  } else {
    if ( resp[1] == "tu")
    {
      tr_timestamp=new Date(resp[4]*1000);
      tr_id=resp[3];
      tr_price=resp[5];
      tr_amount=resp[6];
      tr_side=( tr_amount > 0 ? "buy" : "sell" );
      var msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
      console.log(bc_queue, tr_id);
      client.publish(bc_queue,JSON.stringify(msg));
    }
  }
}

function main () {

  // Loop through exchanges (preparation for later)
  for (var i=1; i < config.exchanges.length; i++ )
  {
    console.log("Exchange Name =" + config.exchanges[i]["name"]);
    console.log("Exchange WSSURL =" + config.exchanges[i]["wssurl"]);
    console.log("Exchange Pairs =" + config.exchanges[i]["pairs"]);
    console.log("FUNCTION -> ",config.exchanges[i]["wssurl"], config.exchanges[i]["wssurl"],config.exchanges[i]["wssurl"] )
  };

}

// Start application
main();
