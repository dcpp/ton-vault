#!/bin/bash

rm -r build
mkdir build
func -AP -o build/vault.fif ../ton/crypto/smartcont/stdlib.fc contracts/msg_hex_comment.fc contracts/vault.fc
fift -s contracts/deploy.fif

echo "Build completed"
