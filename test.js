var entry = {
    a: {
        b: {
            c: {
                dd: 'abcdd'
            }
        },
        d: {
            xx: 'adxx'
        },
        e: 'ae'
    }
}


function _fn(key,value,list){
    if(Object.prototype.toString.call(value) === '[object Object]'){
        for(let i in value){
            if(value.hasOwnProperty(i)){
                _fn(key + '.' + i,value[i],list);
            }
        }
    }else{
        list.push([key,value])
    }
}

function fn(entry){
    let obj = {};
    for(let i in entry){
        if(entry.hasOwnProperty(i)){
            let list = [];
            _fn(i,entry[i],list);
            for(let j = 0; j<list.length; j++){
                let [key,value] = list[j];
                obj[key] = value;
            }
        }
    }
    return obj;
}

let res = fn(entry);

console.log('res:',res);
