import { flatten, unflatten } from 'flat';
import prefixKeys from 'prefix-keys';
import stringify from 'json-stringify-pretty-compact'

import { OPERATION_TYPES, OPERATION_FIELDS } from '../components/operation';
import omit from "object.omit";

export function materialTreeToTabular(materials) {

  let data = {};
  let paramkeys = []
  //stage 1 - extract all operation keys.
  materials.forEach((materialRow) => {
    materialRow.operations.forEach((operation, i) => {
      paramkeys = [...paramkeys, ...OPERATION_TYPES[operation.type].fields].filter((item, pos, obj) => { return obj.indexOf(item) == pos })
    })
  })
  //stage 2 - defaults, prefix & flatten.
  materials.forEach((materialRow) => {
    let row;
    if (materialRow.operations.length) {
      materialRow.operations.forEach((operation, i) => {
        let params = {}
        paramkeys.forEach((opfield) => {
          params[opfield] = operation.params[opfield] = operation.params[opfield] || null
        })

        row = Object.assign({}, { id: materialRow.id },
          prefixKeys('material.', flatten(omit(materialRow.material, ['isOpened']))),
          prefixKeys('operation.', flatten(omit(operation, ['params', 'isEditable']))),
          prefixKeys('operation.params.', flatten(params))
        )
      })
    } else {
      row = Object.assign({}, { id: materialRow.id }, prefixKeys('material.', flatten(omit(materialRow.material, ['isOpened']))))
    }

    Object.entries(row).forEach((entry, j) => {
      let [key, value] = entry;
      data[key] = data[key] || [];
      data[key].push(value)
    })

  });


  // stage 3 - transpose
  let result = Object.entries(data).map((item) => {
    let [key, values] = item;
    return [key, ...values];
  })

  const transpose = (a) => { return a[0].map((_, c) => { return a.map((r) => { return r[c]; }); }) };


  return transpose(result)



}


export function materialTabularToTree(tab) {

  let keys = [];
  let tree = [];

  // stage 1 - zip rows
  let list = csv2arr(tab).map((row, i, obj) => {
    if (!i) {
      keys = row;
    } else {
      let rowobj = {}
      keys.forEach((col, j) => { rowobj[col] = row[j] })
      return rowobj;
    }
  })

  // stage 2 - extract operation indexes
  let lastmaterial;
  list.forEach((row, i, obj) => {
    let material = unflatten(row);

    if (!i) lastmaterial = material;

    if (material.id != lastmaterial.id) {
      tree.push(lastmaterial)
      tree.push(material)
      lastmaterial = material;
    }

    lastmaterial.operations = lastmaterial.operations || [];
    lastmaterial.operations.push(Object.assign({}, material.operation));

    delete lastmaterial.operation
  })

  return tree;

}

export function arr2csv(arr, delimiter = ',', enclose = '"', linebreak = "\r\n") {
  return arr.map((row) => { return enclose + row.join(enclose + delimiter + enclose) + enclose }).join(linebreak);
}

export function csv2arr(csv, delimiter = ',', enclose = '"', linebreak = /[\r\n]+/gi) {
  enclose = enclose || "";
  return csv.split(linebreak).map((row) => {
    return row.split(new RegExp('\\' + enclose + '\\' + delimiter + '\\' + enclose, 'gi')).map((column) => { return column.replace(new RegExp('^\\' + enclose + '|\\' + enclose + '$', "gi"), "") })
  });
}