/*jshint esversion: 6 */

// Include packages
var sys = require('util');

// Connect to Redis
var redis = require('redis');
global.client = redis.createClient('6379','127.0.0.1');
client.on('connect', function() {
    console.log('Connected to Redis Server');
});

// Basic analytics on trades (count, amount)
function tradeAnalytics (records) {
  var ta = [];
  var ta_entity = [];
  ta.count = records.length;
  for ( var i=0; i < records.length; i++ ) {
    ta_entity.push(records[i].tr_amount);
  }
  ta.sum = (ta_entity.reduce((previous, current) => current += previous)).toFixed(1);
  ta.avg = (ta.sum/ta.count).toFixed(1);
  ta_entity.sort((a, b) => a - b);
  var r_lowMiddle = Math.floor((ta_entity.length - 1) / 2);
  var r_highMiddle = Math.ceil((ta_entity.length - 1) / 2);
  ta.median = ((ta_entity[r_lowMiddle]+ta_entity[r_highMiddle])/2).toFixed(1);
  return ta;
}

function clientSubscribe(conn) {
  console.log('Connection:' , conn );
  client.subscribe(conn.exchange + ':' + conn.symbol);
  var mgb = [];
  var mgs = [];
  var sta = [];
  var bta = [];

  client.on("message", function(channel, message) {
    const msg = JSON.parse(message);
    if ( msg.tr_side == 'BUY') {
      mgb.push(msg);
      bta = tradeAnalytics(mgb);
    }
    if ( msg.tr_side == 'SELL') {
      mgs.push(msg);
      sta = tradeAnalytics(mgs);
    }
    delta = bta.sum - sta.sum;
    console.log('[R]',msg.tr_id,msg.tr_side,msg.tr_amount,msg.tr_price,msg.tr_timestamp,'[BS]',bta.count,bta.avg,bta.median,'[SS]',sta.count,sta.avg,sta.median, '[DS]', delta.toFixed(0));
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
