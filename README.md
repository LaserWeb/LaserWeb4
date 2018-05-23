# LaserWeb (4.0.x)

This repository is a "development environment" - and no regular user would have to touch this at all (dont download the repo from here, use the Download links below)

## Download
Releases are made available (almost) daily on https://github.com/LaserWeb/LaserWeb4-Binaries/

## Documentation
For more documentation, go to the [Wiki](https://github.com/LaserWeb/LaserWeb4/wiki)

## Community
Check the [LaserWeb/CNCWeb Google+ community](https://plus.google.com/u/0/communities/115879488566665599508) for updates on the progress of this iteration of Laserweb.

Other than that, this version is early, so check the [Issues tab](https://github.com/openhardwarecoza/LaserWeb4/issues) for "details".

## Supported firmwares

Note: Ever changing. See the Issues tab above for details.

| Firmware      | Supported  | Raster Performance  | CNC Support  |Pull Requests Accepted             |
| ------------- |------------| :------------------:|:------------:|:---------------------------------:|
| Grbl (>1.1d)  | Yes        | Great               |   Great      | Yes - improvements                |
| Smoothieware  | Yes *      | Okayish             |   Okayish    | Yes - improvements to performance |
| TinyG         | Yes        | Unknown (help test) |   Good       | Yes - improvements                |
| Marlin        | Not yet    | Unknown             |   No         | Yes - please                      | 
| Repetier      | Not yet    | Unknown             |   No         | Yes - please                      |

* If you have a Smoothieware based controller, but performance on Raster is choking you with stuttering moves:  This is a known issue.  We recommend switching to https://github.com/gnea/grbl-LPC which runs on the LPC1769 based boards for now, as this performs much faster for laser applications. Want to help fix the Smoothieware stuttering issue: Contact @openhardwarecoza and I'll give you details on the testing regiment we need to provide to the Smoothieware team to prove the point

## Wishlist

If you want to contribute, the below are long standing community-requested enhancements, that a) we don't have time to code or b) need extra skills

* GCODE Optimiser - to cut down on G0 moves (something like http://parano.github.io/GeneticAlgorithm-TSP/)
* More Controllers! Help us implement more firmwares (improve Tiny, add Marlin/Repetier, etc)
* WebGL Transformation Filters to use Webcam to setup stock
* Automate Electron Builds for all platforms

## How to contribute ?

Details on [https://github.com/LaserWeb/LaserWeb4/wiki/How-to-Contribute](https://github.com/LaserWeb/LaserWeb4/wiki/How-to-Contribute)

