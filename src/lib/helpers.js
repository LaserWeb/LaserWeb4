
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
        let blob = new Blob([data], {type: mimetype});
        let reader = new FileReader();
            reader.onloadend = function(e) {
                window.open(reader.result,target);
            }
            reader.readAsDataURL(blob);
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