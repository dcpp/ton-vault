#!/bin/bash

rm -r build
mkdir build
../ton/build/crypto/func -AP -o build/vault.fif ../ton/crypto/smartcont/stdlib.fc contracts/vault.fc 

echo "Compilation completed"
