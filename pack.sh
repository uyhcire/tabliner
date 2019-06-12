#!/bin/bash

mkdir /tmp/tabliner
yarn build
cp -R manifest.json index.html build /tmp/tabliner
zip -r /tmp/tabliner.zip /tmp/tabliner/*
(cd /tmp/tabliner && zip -r - .) > /tmp/tabliner.zip
