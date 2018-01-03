/*jshint esversion: 6 */

//var moment=require('moment');

// Small function to publish transformed message to Redis
function publishRedis (tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue) {
  msgout = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
  client.publish(bc_queue,JSON.stringify(msgout));
}

// Function to log key stages in the establishng of subscriptions for each exchange to assist with operational monitoring and support.
function processMessages (id,ts,exchange_name,exchange_symbol,exchange_wss)
{
  msg_time=new Date();
  var sysmsg = [];
  // for json better to write this to  mongo collection or not do at all. Consider dropping ts and using mongo _id perhaps?
  sysmsg[0] = { "id": ts, "time": msg_time, "action": "none", "exchange_name": exchange_name, "exchange_symbol": exchange_symbol, "exchange_wss": exchange_wss };
  sysmsg[1] = "|ID: " + ts + "|Time: " + msg_time + "|Exchange_Name: " + exchange_name + "|Exchange_Symbol: " + exchange_symbol, "|Exchange_wss: " + exchange_wss;
  sysmsg[2] = { "id": ts, "time": msg_time, "action": "none", "exchange_symbol": exchange_symbol };
  sysmsg[3] = "|ID: " + ts + "|Time: " + msg_time + "|Exchange_Symbol: " + exchange_symbol;

  if ( id == 0 ) {
    msg_action = "START_FUNCTION";
  } else if ( id == 100 ) {
    msg_action = "OPEN_WS";
  } else if ( id == 110 ) {
    msg_action = "OPEN_WS_BINANCE";
  } else if ( id == 120 ) {
    msg_action = "OPEN_WS_BITTREX";
  } else if ( id == 130 ) {
    msg_action = "OPEN_WS_PUSHER";
  } else if ( id == 200 ) {
    msg_action = "SEND_WS_SUBS_MSG";
  } else if ( id == 300 ) {
    msg_action = "CONFIRM_WS_SUBS";
  } else if ( id == 400 ) {
    msg_action = "OPEN_REDIS";
  } else {
    msg_action = "UNKNOWN";
  }

  if ( id == 0 ) {
    sysmsg[0].action = msg_action;
    sysmsg[1] = sysmsg[1] + "|Action: " + msg_action;
    console.log(sysmsg[0]);
  } else {
    sysmsg[2].action = msg_action;
    sysmsg[3] = sysmsg[1] + "|Action: " + msg_action;
    console.log(sysmsg[2]);
  }
}

// Function to subscribe to stream, transform data and publish to Redis from BITFINEX
function processBITFINEX(client, exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol,exchange_wss);

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
    processMessages ('200',ts,exchange_name,exchange_symbol,exchange_wss);
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {
    var resp = JSON.parse(msg.data);
    var head = resp.event;
    var head_body = resp[1];

    // Get channel and symbol from response
    if ( head == "subscribed" )
    {
      //console.log( bc_queue, " channelID = ", resp.chanId, " currency = ", resp.pair);
      processMessages ('300',ts,exchange_name,exchange_symbol,exchange_wss);
    } else {
      if ( resp[1] == "tu")
      {
        // Transform message and send to Redis channel named exchange:symbol
        tr_timestamp=new Date(resp[4]*1000);
        tr_id=resp[3];
        tr_price=resp[5];
        tr_amount=resp[6];
        tr_side=( tr_amount > 0 ? "buy" : "sell" );
        publishRedis(tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue);
        //          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
        //          client.publish(bc_queue,JSON.stringify(msg));
      }
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from HITBTC
function processHITBTC(client, exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol,exchange_wss);

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
    processMessages ('200',ts,exchange_name,exchange_symbol,exchange_wss);
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {

    // parse response and create queue name
    //var message = JSON.parse([msg.data]);
    var message = JSON.parse(msg.data);

    // Get channel and symbol from response
    if (  message.method == "snapshotTrades" )
    {
      //console.log( bc_queue, " currency = ", message.params.symbol);
      processMessages ('300',ts,exchange_name,exchange_symbol,exchange_wss);
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
          publishRedis(tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue);
          //          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
          //          client.publish(bc_queue,JSON.stringify(msg));
        }
      }
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from GEMINI
function processGEMINI(client,exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  wssurl = exchange_wss + '/' + exchange_symbol;
  console.log(wssurl);
  const wss = new WebSocket(wssurl);
  processMessages ('100',ts,exchange_name,exchange_symbol,exchange_wss);

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {

    // parse response and create queue name
    var message = JSON.parse([msg.data]);

    if (message.socket_sequence == 0 ) {
      console.log( bc_queue, " currency = ", exchange_symbol);
    }
    // loop through event and extract trade reco
    for ( i = 0; i < message.events.length; i++ )
    {
      if ( message.events[i].type == 'trade' )
      {
        tr_id=message.events[i].tid;
        tr_amount=message.events[i].amount;
        tr_price=message.events[i].price;
        tr_side=( message.events[i+1].side == 'ask' ? 'sell' : 'buy' );
        tr_timestamp=new Date(message.timestampms);
        publishRedis(tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue);
        //          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
        //          client.publish(bc_queue,JSON.stringify(msg));
      }
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from BINANCE
function processBINANCE(client,exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = new Date().getTime();
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Import functions, define variables and establish connection
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const api = require('binance');
  const binanceWS = new api.BinanceWS();
  processMessages ('110',ts,exchange_name,exchange_symbol,exchange_wss);

  binanceWS.onAggTrade( exchange_symbol , (data) => {
      tr_id=data.tradeId;
      tr_amount=data.quantity;
      tr_price=data.price;
      // not sure if this translation is correct regarding buy or sell
      // See https://www.investopedia.com/terms/m/marketmaker.asp and
      // https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md
      tr_side=( data.maker == true ? 'sell' : 'buy' );
      tr_timestamp=new Date (data.eventTime);
      publishRedis(tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue);
      //          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
      //          client.publish(bc_queue,JSON.stringify(msg));
  });
}

// Function to subscribe to stream, transform data and publish to Redis from HUOBIAPI
function processHUOBIAPI(client,exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Define constants
  const WebSocket = require('ws');
  const pako = require('pako');

  // Open connection once one is established
  var bc_queue = exchange_name + ':' + exchange_symbol;
  var wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol,exchange_wss);

  wss.onopen = () =>
  {
    // Send request to subscribe
    var symbol = exchange_symbol.toLowerCase();
    console.log("Send: " + symbol);
    wss.send(JSON.stringify(
      {
        "sub": "market." + symbol + ".kline.1min",
        "id": symbol
      }
    ));
    processMessages ('200',ts,exchange_name,exchange_symbol,exchange_wss);
  };

  // Parse channel information and send to Redis
  // IMPORTANT: Do not know why wss.on works and not wss.onmessage. Created stackoverflow question for this at https://tinyurl.com/y7tj5a9o.
  //            Seems to be to do with fact that it is a wrapper but not exactly sure why.
  wss.on ('message', (data) => {
  {
    console.log("Receive message", data);
    let text = pako.inflate(data, {
        to: 'string'
    });
    msg = JSON.parse(text);
    if (msg.ping)
    {
      wss.send(JSON.stringify(
        {
          pong: msg.ping
        }
      ));
    } else if (msg.tick) {
      tr_id="DoNotKnow";
      tr_amount=msg.tick.amount;
      tr_price=msg.tick.close;
      tr_side="DoNotKnow";
      tr_timestamp=new Date(msg.ts);
      publishRedis(tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue);
      //          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
      //          client.publish(bc_queue,JSON.stringify(msg));
    }

  }});
}

// Function to subscribe to stream, transform data and publish to Redis from BITTREX
function processBITTREX(client,exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Define constants
  var bc_queue = exchange_name + ':' + exchange_symbol;
  var bittrex = require('../node_modules/node.bittrex.api/node.bittrex.api');
  processMessages ('120',ts,exchange_name,exchange_symbol,exchange_wss);

  bittrex.options({
    websockets: {
      onConnect: function() {
        console.log('Websocket connected');
        bittrex.websockets.subscribe(['BTC-ETH','BTC-XRP'], function(data) {
          if (data.M === 'updateExchangeState') {
            data.A.forEach(function(data_for) {
              console.log(data_for);
            });
          }
        });
      },
      onDisconnect: function() {
        console.log('Websocket disconnected');
      }
    }
  });

  var websocketClient;
  bittrex.websockets.client(function(client) {
    websocketClient = client;
  });

}

// Function to subscribe to stream, transform data and publish to Redis from OKEX
function processOKEX(client, exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol,exchange_wss);

  const channelName = 'ok_sub_spot_' + exchange_symbol + '_deals';
  // Open connection once one is established
  wss.onopen = () => {

    // Send request to subscribe
    wss.send(JSON.stringify(
      {
        'event':'addChannel',
        'channel': channelName
      }
    ));
    processMessages ('200',ts,exchange_name,exchange_symbol,exchange_wss);
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {
    var resp = JSON.parse(msg.data);
    var resp_channel = resp[0].channel;
    var resp_data_channel = resp[0].data.channel;

    // Parse and transform record returned and publish to redis
    if ( resp_channel == "addChannel" )
    {
      // Output channel name if first record
      console.log( bc_queue, " channel name = ", channelName );
    } else if ( resp_channel == channelName )
    {
      // parse record for data and submit to redis
      records = resp[0].data;
      for ( i = 0; i < records.length; i++ )
      {
        // Have used this routine to convert time to GMT; it assumes source also has daylight saving time.
        // This is not the best way to do it so will need to be revisited sometime.
        var tr_ts=records[i][3].split(":");
        var tr_th=Number(tr_ts[0]) + 16;
        tr_th=( tr_th > 23 ? tr_th = tr_th - 24 : tr_th );
        var tr_d=moment().format("YYYY/MM/DD");
        var tr_timestamp = new Date(tr_d + " " + tr_th + ":" + tr_ts[1] + ":" + tr_ts[2]);

        var tr_id=records[i][0];
        var tr_price=records[i][1];
        var tr_amount=records[i][2];

        // https://tinyurl.com/ydet9asx
        // The ask price is what sellers are willing to take for it.
        // - if you are selling a stock, you are going to get the bid price,
        // - if you are buying a stock you are going to get the ask price.
        // not sure if what below is correct. Need to recheck
        tr_side=( records[i][4] == "ask" ? "buy" : "sell" );
        publishRedis(tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue);
        //          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
        //          client.publish(bc_queue,JSON.stringify(msg));
      }
    } else {
      console.log("Unexpected record. Please investigate");
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from GDAX
function processGDAX(client, exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);
  processMessages ('100',exchange_name,exchange_symbol,exchange_wss);

  // Open connection once one is established
  wss.onopen = () => {

    // Send request to subscribe
    wss.send(JSON.stringify(
      {
        "type": "subscribe",
        "product_ids": [
          exchange_symbol
        ]
      }
    ));
    processMessages ('200',exchange_name,exchange_symbol,exchange_wss);
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {

    var resp = JSON.parse(msg.data);

    // filtering on 'match' as this is only JSON document that seems to have all fields
    if (resp.type == 'match') {
      var tr_timestamp = resp.time;
      var tr_id = resp.trade_id;
      var tr_price = resp.price;
      // not sure if size is amount but was nearest match
      var tr_amount = resp.size;
      var tr_side = resp.side;
      publishRedis(tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue);
      //          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
      //          client.publish(bc_queue,JSON.stringify(msg));
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from GDAX
function processBITSTAMP(client, exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol,exchange_wss);

  // Parameter setup
  var bc_queue = exchange_name + ':' + exchange_symbol;

  // Connect to pusher
  var Pusher = require('pusher-client');
  var socket = new Pusher('de504dc5763aeef9ff52');
  processMessages ('130',ts,exchange_name,exchange_symbol,exchange_wss);
  var channel = socket.subscribe('live_trades_' + exchange_symbol.toLowerCase() );
  socket.bind_all ( function(data)
  {
    tr_id = data.id;
    tr_amount = data.amount;
    tr_price = data.price;
    tr_side=( data.type == "0" ? "buy" : "sell" );
    tr_timestamp = new Date(data.timestamp * 1000 );
    publishRedis(tr_timestamp,tr_id,tr_price,tr_amount,tr_side,client,bc_queue);
    //          msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
    //          client.publish(bc_queue,JSON.stringify(msg));
  });
}

module.exports = {
  processBITFINEX,
  processHITBTC,
  processGEMINI,
  processHUOBIAPI,
  processBITTREX,
  processOKEX,
  processGDAX,
  processBITSTAMP,
  processBINANCE
};
