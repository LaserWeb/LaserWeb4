
import AbstractGenerator from "./abstract-generator"

// AbstractDriver class
class DefaultGenerator extends AbstractGenerator{
  // Class constructor...
  constructor(settings) {
    super(settings);
  }

  moveRapid(params, optimized=false){
    if(params == null)
      return "";

    let gcode = "";
    if(!optimized) gcode+="G0 ";
    gcode += this.move(params);
    return gcode;
  }

  moveTool(params, optimized=false){
    if(params == null)
      return "";

    let gcode = "";
    if(!optimized) gcode+="G1 ";
    gcode += this.move(params);
    return gcode;
  }

  toolOn(gcode, params){
    if(gcode == null)
      return "";

    if(params.hasOwnProperty("i"))
      gcode = gcode.split("$INTENSITY").join(params.i);
    return gcode;
  }

  toolOff(gcode, params){
    if(gcode == null)
      return "";

    if(params.hasOwnProperty("i"))
      gcode = gcode.split("$INTENSITY").join(params.i);
    return gcode;
  }

  move(params){
    let gcode = "";
    if(params.hasOwnProperty("x"))
      gcode += ` X${params.x}`;

    if(params.hasOwnProperty("y"))
      gcode += ` Y${params.y}`;

    if(params.hasOwnProperty("a"))
      gcode += ` A${params.a}`;

    if(params.hasOwnProperty("i"))
      gcode += ` ${params.i}`;

    if(params.hasOwnProperty("s") && this.settings.laserHasIntensity)
      gcode += ` S${params.s}`;

    if(params.hasOwnProperty("f"))
      gcode += ` F${params.f}`;

    return gcode.trim();
  }

}

// Exports
export { DefaultGenerator }
export default DefaultGenerator
