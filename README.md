# LaserWeb (4.0.x)

This repository is a "development environment" - and no regular user would have to touch this at all (dont download the repo from here, use the Download links below)

## Download
Releases are made available (almost) daily on https://github.com/LaserWeb/LaserWeb4-Binaries/

## Documentation
For more documentation, go to the [Wiki](https://github.com/LaserWeb/LaserWeb4/wiki) or our website https://laserweb.yurl.ch

## Community
Check the [LaserWeb/CNCWeb Google+ community](https://plus.google.com/u/0/communities/115879488566665599508) for updates on the progress of this iteration of Laserweb.

Other than that, this version is early, so check the [Issues tab](https://github.com/openhardwarecoza/LaserWeb4/issues) for "details".

## Supported firmwares

Note: Ever changing. See the Issues tab above for details.

| Firmware       | Supported  | Raster Performance  | CNC Support  |Pull Requests Accepted             |
| -------------- |------------|:-------------------:|:------------:|:---------------------------------:|
| Grbl (>=1.1f)  | Yes        | Great               |   Great      | Yes - improvements                |
| Smoothieware   | Yes *      | Okayish             |   Okayish    | Yes - improvements                |
| TinyG          | Yes        | Unknown             |   Good       | Yes - improvements                |
| Marlin         | Yes        | Unknown             |   No         | Yes - improvements                | 
| MarlinKimbra   | Yes        | Unknown             |   No         | Yes - improvements                | 
| Repetier       | Yes        | Unknown             |   No         | Yes - improvements                |
| RepRapFirmware | Yes        | Unknown             |   Yes        | Yes - improvements                |

* If you have a Smoothieware based controller, but performance on Raster is choking you with stuttering moves:  This is a known issue.  We recommend switching to https://github.com/gnea/grbl-LPC which runs on the LPC1769 based boards for now, as this performs much faster for laser applications.

## Wishlist

If you want to contribute, the below are long standing community-requested enhancements, that a) we don't have time to code or b) need extra skills

* GCODE Optimiser - to cut down on G0 moves (something like http://parano.github.io/GeneticAlgorithm-TSP/)
* More Controllers! Help us implement more firmwares (improve Tiny, add Marlin/Repetier, etc)
* WebGL Transformation Filters to use Webcam to setup stock
* Automate Electron Builds for all platforms

## How to contribute ?

Details on [https://github.com/LaserWeb/LaserWeb4/wiki/How-to-Contribute](https://github.com/LaserWeb/LaserWeb4/wiki/How-to-Contribute)

