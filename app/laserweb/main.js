import { LaserWeb } from './core/laserweb'
import { Layout } from './layout/Layout'

import { About } from './layout/panes/about/about'
import { Cam } from './layout/panes/cam/cam'
import { Com } from './layout/panes/com/com'
import { GCode } from './layout/panes/gcode/gcode'
import { Jog } from './layout/panes/jog/jog'
import { Quote } from './layout/panes/quote/quote'
import { Settings } from './layout/panes/settings/settings'

let laserWeb = new LaserWeb();
laserWeb.setup();

// Add modules to LaserWeb
laserWeb.add_module(new Layout())
laserWeb.add_module(new Com())
laserWeb.add_module(new Cam())
laserWeb.add_module(new GCode())
laserWeb.add_module(new Jog())
laserWeb.add_module(new Quote())
laserWeb.add_module(new Settings())
laserWeb.add_module(new About())

// Initialize LaserWeb
laserWeb.init()