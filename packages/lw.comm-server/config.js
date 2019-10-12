require('dotenv');
//.load({silent: true});
const path = require('path');

var config = {};

config.webPort = process.env.WEB_PORT || 8000;
config.serverVersion = '4.0.136';
config.apiVersion = '4.0.7';

config.verboseLevel = process.env.VERBOSE_LEVEL || 1;
config.logLevel = process.env.LOG_LEVEL || 0;
config.resetOnConnect = process.env.RESET_ON_CONNECT || 0;

config.posDecimals = process.env.DRO_DECIMALS || 2;
config.firmwareWaitTime = process.env.FIRMWARE_WAIT_TIME || 10;
config.grblWaitTime = process.env.GRBL_WAIT_TIME || 1;
config.smoothieWaitTime = process.env.SMOOTHIE_WAIT_TIME || 1;
config.tinygWaitTime = process.env.TINYG_WAIT_TIME || 1;

config.grblBufferSize = process.env.GRBL_BUFFER_SIZE || 128;
config.smoothieBufferSize = process.env.SMOOTHIE_BUFFER_SIZE || 64;
config.tinygBufferSize = process.env.TINYG_BUFFER_SIZE || 24;
config.reprapBufferSize = process.env.REPRAP_BUFFER_SIZE || 2;

config.jobOnStart = '';
config.jobOnFinish = '';
config.jobOnAbort = '';

config.uipath = path.join(__dirname, '/app')

module.exports = config;
