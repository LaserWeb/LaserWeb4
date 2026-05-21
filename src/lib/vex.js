// This is in a separate module so that the setup doesn't get re-evaluated on every HMR attempt, which breaks HMR due to trying to add the same plugin twice

import vex from 'vex-js'
import vexDialog from 'vex-dialog'
import 'vex-js/dist/css/vex.css';
import 'vex-js/dist/css/vex-theme-os.css';

vex.registerPlugin(vexDialog);
vex.defaultOptions.className = 'vex-theme-os'

export default vex;
