/*jshint esversion: 6 */

var sys = require('util');

const WebSocket = require('ws')
const wss = new WebSocket('wss://api.bitfinex.com/ws/')

wss.onopen = () => {
  console.log('Subscribing: BTCUSD');
  wss.send(JSON.stringify(
    {
      "event":"subscribe",
      "channel":"book",
      "pair":"BTCUSD",
      "prec":"P0",
      "freq":"F1"
    }
  ));
  console.log('Subscribing: LTCUSD');
  wss.send(JSON.stringify(
    {
      "event":"subscribe",
      "channel":"book",
      "pair":"LTCUSD",
      "prec":"P0",
      "freq":"F1"
    }
  ));
  console.log('Subscribing: LTCBTC');
  wss.send(JSON.stringify(
    {
      "event":"subscribe",
      "channel":"book",
      "pair":"LTCBTC",
      "prec":"P0",
            "freq":"F1"
    }
  ));
  console.log('Subscribing: ETHUSD');
  wss.send(JSON.stringify(
    {
      "event":"subscribe",
      "channel":"book",
      "pair":"ETHUSD",
      "prec":"P0",
            "freq":"F1"
    }
  ));
  console.log('Subscribing: ETHBTC');
  wss.send(JSON.stringify(
    {
      "event":"subscribe",
      "channel":"book",
      "pair":"ETHBTC",
      "prec":"P0",
            "freq":"F1"
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
    //console.log(msg.data);
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
