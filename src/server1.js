/*jshint esversion: 6 */

var sys = require('util');
var redis = require('redis');
var redis_port = "6379";
var redis_host = "172.17.0.2";
var client = redis.createClient(redis_port, redis_host, {no_ready_check: true});

client.auth('password', function (err) {
    if (err) throw err;
});

client.on('connect', function() {
    console.log('Connected to Redis');
});


const WebSocket = require('ws')
const wss = new WebSocket('wss://api.bitfinex.com/ws/')

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

// bitfinex - supported : BTCUSD, LTCUSD, LTCBTC, ETHUSD, ETHBTC, ETCUSD, ETCBTC, BFXUSD, BFXBTC, RRTUSD, RRTBTC, ZECUSD, ZECBTC
wss.onmessage = (msg) => {
  //console.log(msg.data)
  var response = JSON.parse(msg.data);
  var head = response["event"];
  var head_body = response[1];

  //console.log(head, msg.data)
  //console.log(hb);
  if ( head == "subscribed" ) {
    console.log("channelID = ", response["chanId"], " currency = ", response["pair"]);
  } else {
    if ( response[1] == "tu")
    {
      trade_timestamp=response[4];
      trade_id=response[3];
      trade_price=response[5];
      trade_amount=response[6];
      trade_side=( trade_amount > 0 ? "buy" : "sell" );
      console.log("trade_timestamp = " + trade_timestamp + " trade_id = " + trade_id + " trade_price = " + trade_price +  " trade_amount = " + trade_amount + " trade_side = " + trade_side);
    }
  }
  //if(header != "hb" && header != "subscribed") {
   //document.getElementById("btc").innerHTML = "ASK: " + response[3] + "<br> LAST: " + response[7] + "<br> BID: " + response[1];
   //console.log("ASK: " + response[3] + "<br> LAST: " + response[7] + "<br> BID: " + response[1]);
  // console.log(msg.data);
 //}
}

// API keys setup here (See "Authenticated Channels")




//var WebSocket = require('websocket').WebSocket;
//var ws = new WebSocket('wss://api.bitfinex.com/ws');

//ws.addListener('data', function(buf) {
//    sys.debug('Got data: ' + sys.inspect(buf));
//});

//ws.onmessage = function(m) {
//    sys.debug('Got message: ' + m);
//}
