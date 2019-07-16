
import {
    parsePath, isFn
} from '../util/index.js'



export default class Watcher{
    constructor(vm,expOrFn,cb,options = {}){
        // let {deep = false} = options;
        this.vm = vm;
        // this.deep = deep;
        if(isFn(expOrFn)){
            this.getter = expOrFn;
        }else{
            this.getter = parsePath(expOrFn);
        }
        this.deps = [];
        this.depIds = new Set();
        this.cb = cb;
        this.value = this.get();
    }
    get(){
        window.target = this;
        let value = this.getter.call(this.vm,this.vm)
        window.target = undefined;
        return value;
    }
    update(){
        const oldValue = this.value;
        this.value = this.get();
        this.cb.call(this.vm,this.value,oldValue)
    }
    addDep(dep){
        let id = dep.id;
        if(!this.depIds.has(id)){
            this.depIds.add(id);
            this.deps.push(dep);
            dep.addSub(this)
        }
    }
    teardown(){
        let i = this.deps.length;
        while(i--){
            this.deps[i].removeSub(this);
        }
    }
}



