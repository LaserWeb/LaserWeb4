import { strtr } from './helpers';

const API_CHECK_URL='https://api.github.com/repos/:owner/:repo/releases/latest';
const API_OWNER='Laserweb'
const API_REPO='Laserweb4-binaries'



export const fetchRelease=()=>{
    return new Promise((resolve,reject)=>{
        if (!window.fetch) {
            reject('No fetch available');
        } else {
            let url=strtr(API_CHECK_URL,{':owner':API_OWNER, ':repo':API_REPO});
            fetch(url).then((response)=>{
                response.json().then((json)=>{
                    resolve(json);
                }).catch((error)=>{
                    reject(error)
                })
            }).catch((error)=>{
                reject(error);
            })
        }
    })
}