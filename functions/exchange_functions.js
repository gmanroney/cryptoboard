/*jshint esversion: 6 */

// Create Redis client connection
function redisClient (flag) {

  if (flag) {
    global.client = redis.createClient(config.redis.port,config.redis.host);
    client.on('connect', function() {
        console.log(new Date() + ': Connected to Redis Server');
    });
    flag=false;
  }
  return flag;
}

// Get argument from command line which is exchange we want to connect to and send to Redis
function getArguments() {
  const args = process.argv;
  var connect = [];
  connect.exchange = args[2] || 'undefined';
  return connect.exchange;
}

// Small function to publish transformed message to Redis
function publishRedis (queue,tr) {
  msgout = { "tr_id": tr.id, "tr_timestamp": tr.timestamp, "tr_price": tr.price, "tr_amount": tr.amount, "tr_side": tr.side };
  client.publish(queue,JSON.stringify(msgout));
}

// Function to log key stages in the establishng of subscriptions for each exchange to assist with operational monitoring and support.
function processMessages (id,ts,exchange_name,exchange_symbol)
{
  msg_time=new Date();
  var sysmsg = [];
  var msg_log = "[ID]=" + ts + "[Time]=" + msg_time + "[Exchange_Name]=" + exchange_name + "[Exchange_Symbol]=" + exchange_symbol;

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

  msg_log = msg_log + "|Action=" + msg_action;
  console.log(msg_log);
}

// Function to subscribe to stream, transform data and publish to Redis from BITFINEX
function processBITFINEX(exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol);

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
    processMessages ('200',ts,exchange_name,exchange_symbol);
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {
    var resp = JSON.parse(msg.data);
    var head = resp.event;
    var head_body = resp[1];

    // Get channel and symbol from response
    if ( head == "subscribed" )
    {
      processMessages ('300',ts,exchange_name,exchange_symbol);
    } else {
      if ( resp[1] == "tu")
      {
        // Transform message and send to Redis channel named exchange:symbol
        var trade = [];
        trade.timestamp=new Date(resp[4]*1000);
        trade.id=resp[3];
        trade.price=resp[5];
        trade.amount=resp[6];
        trade.side=( tr_amount > 0 ? "buy" : "sell" );
        publishRedis(bc_queue,trade);
      }
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from HITBTC
function processHITBTC(exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol);

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
    processMessages ('200',ts,exchange_name,exchange_symbol);
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {

    // parse response and create queue name
    var message = JSON.parse(msg.data);

    // Get channel and symbol from response
    if (  message.method == "snapshotTrades" )
    {
      processMessages ('300',ts,exchange_name,exchange_symbol);
    } else {
      if ( message.method == "updateTrades")
      {
        // Transform message and send to Redis channel named exchange:symbol
        for ( i = 0; i < message.params.data.length; i++ ) {
          var trade = [];
          trade.timestamp=message.params.data[i].timestamp;
          trade.id=message.params.data[i].id;
          trade.price=message.params.data[i].price;
          trade.amount=message.params.data[i].amount;
          trade.side=message.params.data[i].side;
          publishRedis(bc_queue,trade);
        }
      }
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from GEMINI
function processGEMINI(exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  wssurl = exchange_wss + '/' + exchange_symbol;
  const wss = new WebSocket(wssurl);
  processMessages ('100',ts,exchange_name,exchange_symbol);

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {

    // parse response and create queue name
    var message = JSON.parse([msg.data]);

    if (message.socket_sequence == 0 ) {
      processMessages ('300',ts,exchange_name,exchange_symbol);
    }
    // loop through event and extract trade reco
    for ( i = 0; i < message.events.length; i++ )
    {
      if ( message.events[i].type == 'trade' )
      {
        var trade = [];
        trade.id=message.events[i].tid;
        trade.amount=message.events[i].amount;
        trade.price=message.events[i].price;
        trade.side=( message.events[i+1].side == 'ask' ? 'sell' : 'buy' );
        trade.timestamp=new Date(message.timestampms);
        publishRedis(bc_queue,trade);
      }
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from BINANCE
function processBINANCE(exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = new Date().getTime();
  processMessages ('0',ts,exchange_name,exchange_symbol);

  // Import functions, define variables and establish connection
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const api = require('binance');
  const binanceWS = new api.BinanceWS();
  processMessages ('110',ts,exchange_name,exchange_symbol);

  binanceWS.onAggTrade( exchange_symbol , (data) => {
      var trade = [];
      trade.id=data.tradeId;
      trade.amount=data.quantity;
      trade.price=data.price;
      // not sure if this translation is correct regarding buy or sell
      // See https://www.investopedia.com/terms/m/marketmaker.asp and
      // https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md
      trade.side=( data.maker == true ? 'sell' : 'buy' );
      trade.timestamp=new Date (data.eventTime);
      publishRedis(bc_queue,trade);
  });
}

// Function to subscribe to stream, transform data and publish to Redis from HUOBIAPI
function processHUOBIAPI(exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol);

  // Define constants
  const WebSocket = require('ws');
  const pako = require('pako');

  // Open connection once one is established
  var bc_queue = exchange_name + ':' + exchange_symbol;
  var wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol);

  wss.onopen = () =>
  {
    // Send request to subscribe
    var symbol = exchange_symbol.toLowerCase();
    wss.send(JSON.stringify(
      {
        "sub": "market." + symbol + ".kline.1min",
        "id": symbol
      }
    ));
    processMessages ('200',ts,exchange_name,exchange_symbol);
  };

  // Parse channel information and send to Redis
  // IMPORTANT: Do not know why wss.on works and not wss.onmessage. Created stackoverflow question for this at https://tinyurl.com/y7tj5a9o.
  //            Seems to be to do with fact that it is a wrapper but not exactly sure why.
  wss.on ('message', (data) => {
  {
    processMessages ('300',ts,exchange_name,exchange_symbol);
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
      var trade = [];
      trade.id="DoNotKnow";
      trade.amount=msg.tick.amount;
      trade.price=msg.tick.close;
      trade.side="DoNotKnow";
      trade.timestamp=new Date(msg.ts);
      publishRedis(bc_queue,trade);
    }

  }});
}

// Function to subscribe to stream, transform data and publish to Redis from BITTREX
function processBITTREX(exchange_name,exchange_wss,exchange_symbol_list)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,'exchange_symbol');

  // Define constants
  var bittrex = require('../node_modules/node.bittrex.api/node.bittrex.api');
  processMessages ('120',ts,exchange_name,exchange_symbol_list);

  bittrex.options({
    websockets: {
      onConnect: function() {
        bittrex.websockets.subscribe( exchange_symbol_list, function(data) {
          if (data.M === 'updateExchangeState') {
            data.A.forEach(function(data_for) {
              var bc_queue = exchange_name + ':' + data_for.MarketName;
              trade_fills = data_for.Fills;
              for ( var i=0; i < trade_fills.length; i++ ) {
                var trade = [];
                trade.side = trade_fills[i].OrderType;
                trade.timestamp = trade_fills[i].TimeStamp;
                trade.price = trade_fills[i].Rate;
                trade.amount = trade_fills[i].Quantity;
                trade.id = 'NotProvided';
                publishRedis(bc_queue,trade);
              }
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
function processOKEX(exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol);

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
    processMessages ('200',ts,exchange_name,exchange_symbol);
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
      processMessages ('300',ts,exchange_name,exchange_symbol);
    } else if ( resp_channel == channelName )
    {
      // parse record for data and submit to redis
      records = resp[0].data;
      for ( i = 0; i < records.length; i++ )
      {
        // Have used this routine to convert time to GMT; it assumes source also has daylight saving time.
        // This is not the best way to do it so will need to be revisited sometime.
        var trade = [];
        var tr_ts=records[i][3].split(":");
        var tr_th=Number(tr_ts[0]) + 16;
        tr_th=( tr_th > 23 ? tr_th = tr_th - 24 : tr_th );
        var tr_d=moment().format("YYYY/MM/DD");
        trade.timestamp = new Date(tr_d + " " + tr_th + ":" + tr_ts[1] + ":" + tr_ts[2]);
        trade.id=records[i][0];
        trade.price=records[i][1];
        trade.amount=records[i][2];
        // https://tinyurl.com/ydet9asx
        // The ask price is what sellers are willing to take for it.
        // - if you are selling a stock, you are going to get the bid price,
        // - if you are buying a stock you are going to get the ask price.
        // not sure if what below is correct. Need to recheck
        trade.side=( records[i][4] == "ask" ? "buy" : "sell" );
        publishRedis(bc_queue,trade);
      }
    } else {
      console.log("Unexpected record. Please investigate");
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from GDAX
function processGDAX(exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol);

  // Connect To Exchange
  var bc_queue = exchange_name + ':' + exchange_symbol;
  const WebSocket = require('ws');
  const wss = new WebSocket(exchange_wss);
  processMessages ('100',ts,exchange_name,exchange_symbol);

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
    processMessages ('200',ts,exchange_name,exchange_symbol);
  };

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {

    var resp = JSON.parse(msg.data);

    // filtering on 'match' as this is only JSON document that seems to have all fields
    if (resp.type == 'match') {
      var trade = [];
      trade.timestamp = resp.time;
      trade.id = resp.trade_id;
      trade.price = resp.price;
      // not sure if size is amount but was nearest match
      trade.amount = resp.size;
      trade.side = resp.side;
      publishRedis(bc_queue,trade);
    }
  };
}

// Function to subscribe to stream, transform data and publish to Redis from GDAX
function processBITSTAMP(exchange_name,exchange_wss,exchange_symbol)
{
  // Log Message
  var ts = Math.round((new Date()).getTime() / 1000);
  processMessages ('0',ts,exchange_name,exchange_symbol);

  // Parameter setup
  var bc_queue = exchange_name + ':' + exchange_symbol;

  // Connect to pusher
  var Pusher = require('pusher-client');
  var socket = new Pusher('de504dc5763aeef9ff52');
  processMessages ('130',ts,exchange_name,exchange_symbol);
  var channel = socket.subscribe('live_trades_' + exchange_symbol.toLowerCase() );
  socket.bind_all ( function(data)
  {
    var trade = [];
    trade.id = data.id;
    trade.amount = data.amount;
    trade.price = data.price;
    trade.side=( data.type == "0" ? "buy" : "sell" );
    trade.timestamp = new Date(data.timestamp * 1000 );
    publishRedis(bc_queue,trade);
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
  processBINANCE,
  processMessages,
  getArguments,
  redisClient
};
