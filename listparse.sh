#!/bin/bash

LINE_VAL="ltc_btc eth_btc etc_btc bch_btc btc_usdt eth_usdt ltc_usdt etc_usdt bch_usdt etc_eth bt1_btc bt2_btc btg_btc qtum_btc hsr_btc neo_btc gas_btc qtum_usdt hsr_usdt neo_usdt gas_usdt"

LIST_VAL=`echo ${LINE_VAL} | tr " " "\n"`

echo ${LINE_VAL} | tr " " "\n" | while read ITEM
do
   ITEM=`echo ${ITEM} | tr '[a-z]' '[A-Z]'`
   echo "{ \"symbol\": \"${ITEM}\" },"
done

exit 0
