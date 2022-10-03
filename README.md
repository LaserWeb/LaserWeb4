# LaserWeb (4.0.x)

This repository is a "development environment" - and no regular user would have to touch this at all (dont download the repo from here, use the Download links below)

## Download
Releases are made available on https://github.com/LaserWeb/LaserWeb4-Binaries/

## Documentation
For more documentation, go to the [Wiki](https://github.com/LaserWeb/LaserWeb4/wiki) or our website https://laserweb.yurl.ch

## Docker

- run image:
```sh
docker run -device=/dev/ttyUSB0 -p 8000:8000 joesantos/laserweb:latest
```
- connect to app: http://localhost:8000

### Development

Docker user targets:
- dev
- test

You can run the `dev` version of the app in Docker using the commands below.
- build `dev` image:
```sh
docker build --target dev -t laserweb:dev .
```
- run image:
```sh
docker run -it -device=/dev/ttyUSB0 --rm -p 8000:8000 laserweb:dev
```
- connect to app: http://localhost:8000

To build the release version:
```sh
docker build -f Dockerfile.release -t laserweb:release .
```

## Community
Please use the community forum on https://forum.makerforums.info/c/laserweb-cncweb for questions and support.
Please only report confirmed bugs on the git [Issues tab](https://github.com/LaserWeb/LaserWeb4/issues).

## Supported firmwares

Note: Ever changing. See the Issues tab above for details.

| Firmware                  | Supported  | Raster Performance  | CNC Support  |Pull Requests Accepted             |
| ------------------------- |------------|:-------------------:|:------------:|:---------------------------------:|
| Grbl > v1.1f (ATmega328)  | Yes        | Good                |   Great      | Yes - improvements                |
| Grbl-Mega (ATmega2560)    | Yes        | Good                |   Great      | Yes - improvements                |
| Grbl-LPC (LPC176x)        | Yes        | Great               |   Great      | Yes - improvements                |
| Grbl_ESP32 (ESP32)        | Yes        | Great               |   Great      | Yes - improvements                |
| Smoothieware              | Yes *      | Okayish             |   Okayish    | Yes - improvements                |
| TinyG                     | Yes        | Unknown             |   Good       | Yes - improvements                |
| Marlin                    | Yes        | Unknown             |   No         | Yes - improvements                | 
| MarlinKimbra              | Yes        | Unknown             |   No         | Yes - improvements                | 
| Repetier                  | Yes        | Unknown             |   No         | Yes - improvements                |
| RepRapFirmware            | Yes        | Unknown             |   Yes        | Yes - improvements                |

* If fast raster engraving is important for you, we recommend replacing Smoothieware with grbl-LPC (https://github.com/cprezzi/grbl-LPC) which also runs on the LPC1769 based boards and performs much faster for laser raster applications.

## Wishlist

If you want to contribute, below are long standing community-requested enhancements, that a) we don't have time to code or b) need extra skills

* GCODE Optimiser - to cut down on G0 moves (something like http://parano.github.io/GeneticAlgorithm-TSP/)
* Implement "Raster > TSP-Vector" operation
* More Controllers! Help us implement more firmwares (improve TinyG add Marlin/Repetier, etc)
* WebGL Transformation Filters to use Webcam to setup stock
* Automate Electron Builds for all platforms

## How to contribute ?

Details on [https://github.com/LaserWeb/LaserWeb4/wiki/How-to-Contribute](https://github.com/LaserWeb/LaserWeb4/wiki/How-to-Contribute)

