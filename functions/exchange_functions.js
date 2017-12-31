// Function to subscribe to stream, transform data and publish to Redis from BITFINEX
function processBITFINEX(client, exchange_name,exchange_wss,exchange_symbol) {

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
function processHITBTC(client, exchange_name,exchange_wss,exchange_symbol) {

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

// Function to subscribe to stream, transform data and publish to Redis from GEMINI
function processGEMINI(client,exchange_name,exchange_wss,exchange_symbol) {

  // Connect To Exchange
  const WebSocket = require('ws');
  wssurl = exchange_wss + '/' + exchange_symbol;
  console.log(wssurl);
  const wss = new WebSocket(wssurl);

  // Parse channel information and send to Redis
  wss.onmessage = (msg) => {

    // parse response and create queue name
    var message = JSON.parse([msg.data]);
    var bc_queue = exchange_name + ':' + exchange_symbol;

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
        msg = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
        client.publish(bc_queue,JSON.stringify(msg));
      }
    }
  }
}

// Function to subscribe to stream, transform data and publish to Redis from HUOBIAPI
function processHUOBIAPI(client,exchange_name,exchange_wss,exchange_symbol)
{
  // Define constants
  const WebSocket = require('ws');
  const pako = require('pako');

  // Open connection once one is established
  var wss = new WebSocket(exchange_wss);

  wss.onopen = () =>
  {
    // Send request to subscribe
    var symbol = exchange_symbol.toLowerCase()
    console.log("Send: " + symbol);
    wss.send(JSON.stringify(
      {
        "sub": "market." + symbol + ".kline.1min",
        "id": symbol
      }
    ));
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
    var bc_queue = exchange_name + ':' + exchange_symbol;
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
      msgout = { "tr_id": tr_id, "tr_timestamp": tr_timestamp, "tr_price": tr_price, "tr_amount": tr_amount, "tr_side": tr_side };
      client.publish(bc_queue,JSON.stringify(msgout));
    }

  }});
}

module.exports = {
  processBITFINEX,
  processHITBTC,
  processGEMINI,
  processHUOBIAPI
};
