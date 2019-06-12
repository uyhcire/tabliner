#!/bin/bash

mkdir /tmp/tabliner
yarn build
cp -R manifest.json index.html build /tmp/tabliner
