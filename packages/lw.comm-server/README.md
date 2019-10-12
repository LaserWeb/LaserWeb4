# lw.comm-server - unified communications server for LaserWeb4

**lw.comm-server** is the unified communications server for LaserWeb. It is the gateway between the machnine and the frontend and cares about all different interfaces & firmware specific protocols, so the clients doesn't have to care about the machine controller and firmware (as far as possible).

lw.comm-server is based on nodejs 10.x.

## Communication structure
![Communication diagram](https://github.com/LaserWeb/lw.comm-server/blob/master/doc/communications-diagram.jpg)

The frontend communicates with the server over websockets. Details about the API can be found in the wiki. 
The server supports several interfaces to communicate with machines.

## Supported interfaces

### Implemented:
* Serial over **USB**
* Websocket to **ESP8266** (as WLAN to serial gateway)
* **Telnet** over Network (or WLAN)

## Supported firmwares
* Grbl (ATmega328)
* Grbl MEGA RAMPS (Arduino MEGA 2560 + RAMPS)
* Grbl-LPC (for LPC1769 boards like C3d, Smoothieboard, MKS SBASE, Azteeg)
* Smoothieware (actual version of firmware-cnc.bin)
* TinyG (actual version)
* MarlinKimbra (not finished)
* Marlin (not finished)
* RepRapFirmware (not finished)


Please check the wiki for details about the API.

