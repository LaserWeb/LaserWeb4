import { object, forest } from '../reducers/object'
import { addDocument, addDocumentChild } from '../actions/document'

export const document = object('document', {
    type: 'document',
    name: '',
    children: [],
});

export const documents = forest('document', document);

export function documentsWithSampleData(state, action) {
    if (state === undefined) {
        state = documents(state, {});
        let doc1 = addDocument({ name: 'dummy1.svg' });
        let doc2 = addDocument({ name: 'dummy2.svg' });
        let doc2Layer1 = addDocumentChild(doc2.payload.attrs.id, { name: 'layer1', type: 'layer' });
        let doc2Layer2 = addDocumentChild(doc2.payload.attrs.id, { name: 'layer2', type: 'layer' });
        let doc3 = addDocument({ name: 'dummy3.svg' });
        state = documents(state, doc1);
        state = documents(state, doc2);
        state = documents(state, doc2Layer1);
        state = documents(state, doc2Layer2);
        state = documents(state, doc3);
        state = documents(state, addDocumentChild(doc1.payload.attrs.id, { name: 'path1', type: 'path' }));
        state = documents(state, addDocumentChild(doc1.payload.attrs.id, { name: 'path2', type: 'path' }));
        state = documents(state, addDocumentChild(doc1.payload.attrs.id, { name: 'rect3', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer1.payload.attrs.id, { name: 'path1', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer1.payload.attrs.id, { name: 'path2', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer1.payload.attrs.id, { name: 'rect3', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer2.payload.attrs.id, { name: 'path4', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer2.payload.attrs.id, { name: 'path5', type: 'path' }));
        state = documents(state, addDocumentChild(doc2Layer2.payload.attrs.id, { name: 'rect6', type: 'path' }));
        state = documents(state, addDocumentChild(doc3.payload.attrs.id, { name: 'path1', type: 'path' }));
        state = documents(state, addDocumentChild(doc3.payload.attrs.id, { name: 'path2', type: 'path' }));
        state = documents(state, addDocumentChild(doc3.payload.attrs.id, { name: 'rect3', type: 'path' }));
    }
    return documents(state, action);
};
