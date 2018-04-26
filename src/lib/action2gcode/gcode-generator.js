'use strict';

import DefaultGenerator from "./generators/default-generator"
import MarlinGenerator from "./generators/marlin-generator"

export function getGenerator(gcodeGenerator, settings) {
  switch(gcodeGenerator){
    case "marlin" :
      return new MarlinGenerator(settings);
    case "default" :
    default :
      return new DefaultGenerator(settings);
  }
}
