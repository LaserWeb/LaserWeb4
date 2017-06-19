#!/bin/bash

cd /laserweb

http-server dist &
nice -n -20 npm run start-server
