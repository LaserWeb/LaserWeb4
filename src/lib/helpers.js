
import objectToString from 'object-to-string';

export function sendAsFile(filename, data, mimetype) {
        let blob = new Blob([data], {type: mimetype});

        let tempLink = document.createElement('a');
            tempLink.href = window.URL.createObjectURL(blob);
            tempLink.setAttribute('download', filename);
            tempLink.click();
}

export function appendExt(filename, ext) {
    return (!filename.match(new RegExp(ext.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')+"$",'gi'))) ? (filename+ext):filename;
}

export function openDataWindow(data, mimetype='text/plain;charset=utf-8', target="data")
{
    var file = new Blob([data], { type: mimetype });
    var fileURL = URL.createObjectURL(file);
    var win = window.open();
    win.document.write('<iframe src="' + fileURL + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>')
}

export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

export function deepMerge(target, source) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

export function getDescendantProp(obj, desc) {
    var arr = desc.split(".");
    while(arr.length && (obj = obj[arr.shift()]));
    return obj;
}

export function cast(value, def = '') {
    if (value === undefined) return def;
    if (value === false) return "No";
    if (value === true) return "Yes";
    if (isObject(value)) return objectToString(value);
    return String(value);
}

export function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

export function humanFileSize(size) {
    var i = size == 0 ? 0 : Math.floor( Math.log(size) / Math.log(1024) );
    return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};


export const captureConsole = () => {

  window.__capture=window.console;
  let captures=[];

  window.console = {
    log(...args){
      captures.push({method:"log",args})
    },

    warn(...args){
      captures.push({method:"warn",args})
    },

    error(...args){
      captures.push({method:"error",args})
    },

    info(...args){
      captures.push({method:"info",args})
    }
  }

  return (keys=[])=>{
    window.console = window.__capture;
    if (keys === true) keys=['log','warn','error','info']
    if (keys.length){

      captures.forEach(item => {
        if (keys.includes(item.method)) {
          window.console[item.method].apply(null, item.args)
        }
      })
    }

    return captures;
  }

}

export const strtr=(str,reps)=>{
  Object.entries(reps).forEach((entry)=>{
      str=str.replace(entry[0],entry[1])
  })
  return str;
}
