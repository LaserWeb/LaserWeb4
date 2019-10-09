#!/bin/bash
git submodule init
git submodule update --remote
npm install
cd src/lib/lw.svg-parser/
npm install
