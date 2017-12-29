Summary
-------
Collects data from multiple cryptocurrency exchanges, transforms it and posts it into Redis

Background
----------
Need to be able to do like-by-like comparison of different cryptocurrencies in an investment platform. Problem is that it is not easy to do so with the multitude of platforms and different data provided by their real-time streams.

Task
----
1. Connect to websocket api interface (using native library, if exists);
2. Read JSON-config file with Redis connection settings as list of symbols (symbol usually consist of coin and currency);
3. Subscribe to trade data on given symbols
4. Push all trades to the Redis to queue named Exchange:Symbol as array of [timestamp, trade_id(if exists), price, amount, side(buy/sell)]
5. Application will reconnect on connection fail and be optimized for speed / throughput.

Business Rules
--------------
* Business rules for each exchange to be in configuration file.
* List of exchanges:
--- https://docs.bitfinex.com/docs
--- https://docs.gdax.com/#time
--- https://www.bitstamp.net/websocket/
--- https://github.com/binance-exchange/binance-official-api-docs
--- https://api.hitbtc.com/#socket-market-data
--- https://www.npmjs.com/package/node.bittrex.api
--- https://www.okex.com/ws_getStarted.html
--- https://github.com/huobiapi/API_Docs_en/wiki/WS_General
--- https://docs.gemini.com/websocket-api/#market-data

Deliverables
------------
* A server that connects to specific exchanges, reads, transforms and submits trade information to Redis pub/sub
