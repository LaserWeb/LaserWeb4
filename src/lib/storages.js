import {sendAsFile} from './helpers';


/* Yes, I know, got to switch to promises but I can't promise that.*/
class FileStorageAdapter {
    
    load(file, onload=()=>{}){
        let reader = new FileReader;
            reader.onload = () => onload(file, reader.result);
            reader.readAsText(file);
    }
    
    save(name, data, mime, ...rest) {
        sendAsFile(name, data, mime);
    }
}

class LocalStorageAdapter {
    
    load(key, onload=()=>{}) {
        onload(key, localStorage.getItem(key))
        
    }
    
    save(key, data, ...rest) {
        
        localStorage.setItem(key,data);
    }
    
}


export let FileStorage = new FileStorageAdapter();

export let LocalStorage = new LocalStorageAdapter();