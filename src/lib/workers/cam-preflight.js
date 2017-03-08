import { rawPathsToClipperPaths, union, xor } from '../mesh';


self.onmessage = (event) => {

    const jobs = [];

    let { settings, opIndex, op, geometry, openGeometry, tabGeometry, documents } = event.data;

    const docsWithImages = []

    function matchColor(filterColor, color) {
        if (!filterColor)
            return true;
        if (!color)
            return false;
        return filterColor[0] == color[0] && filterColor[1] == color[1] && filterColor[2] == color[2] && filterColor[3] == color[3];
    }

    function examineDocTree(isTab, id) {
        let doc = documents.find(d => d.id === id);
        if (doc.rawPaths) {
            jobs.push((cb) => {
                if (isTab) {
                    tabGeometry = union(tabGeometry, rawPathsToClipperPaths(doc.rawPaths, doc.scale[0], doc.scale[1], doc.translate[0], doc.translate[1]));
                } else if (matchColor(op.filterFillColor, doc.fillColor) && matchColor(op.filterStrokeColor, doc.strokeColor)) {
                    let isClosed = false;
                    for (let rawPath of doc.rawPaths)
                        if (rawPath.length >= 4 && rawPath[0] == rawPath[rawPath.length - 2] && rawPath[1] == rawPath[rawPath.length - 1])
                            isClosed = true;
                    let clipperPaths = rawPathsToClipperPaths(doc.rawPaths, doc.scale[0], doc.scale[1], doc.translate[0], doc.translate[1]);
                    if (isClosed)
                        geometry = xor(geometry, clipperPaths);
                    else if (!op.filterFillColor)
                        openGeometry = openGeometry.concat(clipperPaths);
                }
                cb()
            })
        }
        if (doc.type === 'image' && !isTab) {
            docsWithImages.push(doc)
        }
        for (let child of doc.children)
            examineDocTree(isTab, child);
    }
    for (let id of op.documents)
        examineDocTree(false, id);
    for (let id of op.tabDocuments)
        examineDocTree(true, id);

    let chunk = 100 / jobs.length;
    var percent = 0;

    while (jobs.length) {
        try {
            let job = jobs.shift()
            if (job) job(() => {
                percent = percent + chunk
                postMessage({ event: "onProgress", percent: parseInt(percent) })
            });
        } catch (error) {
            console.error(error)
            postMessage({ event: "onError", message: "Something wrong has happened, sorry.", level: "error", error: error.toString() })
        }
    }

    postMessage({ event: "onDone", settings, opIndex, op, geometry, openGeometry, tabGeometry, docsWithImages })
    self.close();
}