// Android commits synchronously before an action reports success. Browser builds use localStorage.
const bridge=()=>globalThis.SunwardNative;
export function readStored(key){
 const native=bridge();
 if(native?.readStorage){const value=native.readStorage(key);if(value!==null&&value!==undefined)return value;}
 const value=localStorage.getItem(key);
 if(value!==null&&native?.writeStorage)native.writeStorage(key,value);
 return value;
}
export function writeStored(key,value){
 const native=bridge();let committed=false;
 if(native?.writeStorage){if(!native.writeStorage(key,value))throw Error('Android storage commit failed');committed=true;}
 try{localStorage.setItem(key,value)}catch(error){if(!committed)throw error;}
}
