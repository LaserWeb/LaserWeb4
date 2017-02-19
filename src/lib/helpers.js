

export function sendAsFile(filename, data, mimetype) {
        let blob = new Blob([data], {type: mimetype});

        let tempLink = document.createElement('a');
            tempLink.href = window.URL.createObjectURL(blob);
            tempLink.setAttribute('download', filename);
            tempLink.click();
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

export function cast(value, def = '') {
    if (value === undefined) return def;
    if (value === false) return "No";
    if (value === true) return "Yes";
    return String(value);
}