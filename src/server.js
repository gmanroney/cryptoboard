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

// Function to subscribe to stream, transform data and publish to Redis
function processBITFINEX(exchange_name,exchange_wss,exchange_symbol) {

  // Connect To Exchange
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);

  // Open connection once one is established
  wss.onopen = () => {

    // Send request to subscribe
    wss.send(JSON.stringify(
      {
        "event": "subscribe",
        "channel": "trades",
        "pair": exchange_symbol
      }
    ));
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {
    var resp = JSON.parse(msg.data);
    var head = resp.event;
    var head_body = resp[1];
    var bc_queue = exchange_name + ':' + exchange_symbol;

    // Get channel and symbol from response
    if ( head == "subscribed" )
    {
      console.log( bc_queue, " channelID = ", resp.chanId, " currency = ", resp.pair);
    } else {
      if ( resp[1] == "tu")
      {
        // Transform message and send to Redis channel named exchange:symbol
        tr_timestamp=new Date(resp[4]*1000);
        tr_id=resp[3];
        tr_price=resp[5];
        tr_amount=resp[6];
        tr_side=( tr_amount > 0 ? "buy" : "sell" );
        msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
        client.publish(bc_queue,JSON.stringify(msg));
      }
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from HITBTC
function processHITBTC(exchange_name,exchange_wss,exchange_symbol) {

  // Connect To Exchange
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);

  // Open connection once one is established
  wss.onopen = () => {

    // Send request to subscribe
    wss.send(JSON.stringify(
      {
        "method": "subscribeTrades",
        "params": {
          "symbol": exchange_symbol
        }
      }
    ));
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {

    // parse response and create queue name
    var message = JSON.parse([msg.data]);
    var bc_queue = exchange_name + ':' + exchange_symbol;

    // Get channel and symbol from response
    if (  message.method == "snapshotTrades" )
    {
      console.log( bc_queue, " currency = ", message.params.symbol);
    } else {
      if ( message.method == "updateTrades")
      {
        // Transform message and send to Redis channel named exchange:symbol
        for ( i = 0; i < message.params.data.length; i++ ) {
          tr_timestamp=message.params.data[i].timestamp;
          tr_id=message.params.data[i].id;
          tr_price=message.params.data[i].price;
          tr_amount=message.params.data[i].amount;
          tr_side=message.params.data[i].side;
          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
          client.publish(bc_queue,JSON.stringify(msg));
        }
      }
    }
  }
}

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
        processBITFINEX(exchange_name, exchange_wss, exchange_symbol);
      }
    }

    if ( exchange_name == 'HITBTC')
    {
      for(var j = 0; j < exchange_symbol_array.length; j++)
      {
        exchange_symbol = exchange_symbol_array[j].symbol;
        console.log(exchange_name, exchange_wss, exchange_symbol);
        processHITBTC(exchange_name, exchange_wss, exchange_symbol);
      }
    }

  }

  // End of main function
  console.log("Finshed launch");
}

// Start application
main();
