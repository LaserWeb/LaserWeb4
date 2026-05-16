let
	nixpkgs = import <nixpkgs> {};
in
	with nixpkgs;

	stdenv.mkDerivation rec {
		name = "LaserWeb4";

		buildInputs = [
			pkg-config
			libusb1
		];

		LD_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath buildInputs}:/run/opengl-driver/lib";
	}
