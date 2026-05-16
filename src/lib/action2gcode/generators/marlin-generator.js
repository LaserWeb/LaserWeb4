
import AbstractGenerator from "./abstract-generator"

// AbstractDriver class
class MarlinGenerator extends AbstractGenerator{
  // Class constructor...
  constructor(settings) {
    super(settings);
  }

  moveRapid(params, optimized=false){
    if(params == null)
      return "";

    return this.move("G0", params);
  }

  moveTool(params, optimized=false){
    if(params == null)
      return "";

    return this.move("G1", params);
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

  move(prefix, params){
    let gcode = "";

    if(params.hasOwnProperty("s") && this.settings.laserHasIntensity){
      if(this.settings.gcodeToolOn.indexOf("$INTENSITY") > -1){
        gcode += `${this.settings.gcodeToolOn.split("$INTENSITY").join(this.settings.gcodeLaserIntensity+params.s)}\r\n`;
      }else{
        gcode += `${this.settings.gcodeToolOn} S${params.s}\r\n`;
      }
    }

    if(params.hasOwnProperty("i")){
      if(this.settings.gcodeToolOn.indexOf("$INTENSITY") > -1){
        gcode += `${this.settings.gcodeToolOn.split("$INTENSITY").join(params.i)}\r\n`;
      }else{
        gcode += `${this.settings.gcodeToolOn} ${params.i}\r\n`;
      }
    }

    gcode += prefix;

    if(params.hasOwnProperty("x"))
      gcode += ` X${params.x}`;

    if(params.hasOwnProperty("y"))
      gcode += ` Y${params.y}`;

    if(params.hasOwnProperty("a"))
      gcode += ` A${params.a}`;

    if(params.hasOwnProperty("f"))
      gcode += ` F${params.f}`;

    return gcode.trim();
  }

}

// Exports
export { MarlinGenerator }
export default MarlinGenerator
