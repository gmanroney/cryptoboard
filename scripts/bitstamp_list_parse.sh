#!/bin/bash

LINE_VAL="btceur, eurusd, xrpusd, xrpeur, xrpbtc, ltcusd, ltceur, ltcbtc, ethusd, etheur, ethbtc, bchusd, bcheur, bchbtc"

LIST_VAL=`echo ${LINE_VAL} | tr ", " "\n"`

echo ${LINE_VAL} | tr " " "\n" | while read ITEM
do
   ITEM=`echo ${ITEM} | tr '[a-z]' '[A-Z]'`
   echo "{ \"symbol\": \"${ITEM}\" },"
done

exit 0
