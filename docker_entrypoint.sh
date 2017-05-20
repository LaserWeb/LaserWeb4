#!/bin/bash

cd /laserweb

http-server dist &
npm run start-server
