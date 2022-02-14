#!/bin/bash

./scripts/build.sh 

sed '$d' ./build/vault.fif > ./build/vault.test.fif
echo -n "}END>s constant code" >> ./build/vault.test.fif

export FIFTPATH=../ton/crypto/fift/lib
../ton/build/crypto/fift -s build/vault.test.fif