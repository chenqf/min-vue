
import {Observer,defineReactive} from '../observer/index.js'
import Watcher from '../observer/watcher.js'
import { isArray, isValidArrayIndex, hasOwn } from '../util/index.js'

export default class Vue{
    constructor(opt = {}){
        let {
            data = {}
        } = opt;
        //转化data
        new Observer(data);
        let keys = Object.keys(data);
        keys.forEach(key=>{
            Object.defineProperty(this,key,{
                configurable:true,
                enumerable:true,
                set:function(val){
                    return data[key] = val
                },
                get:function(){
                    return data[key];
                }
            })
        })
        this.$data = data;

    }
    $watch(expOrFn,cb,options = {}){
        let vm = this;
        let watcher = new Watcher(vm,expOrFn,cb,options)
        let {immediate = false} = options;
        if(immediate){
            cb.call(vm,watcher.value);
        }
        return function unwatch(){
            watcher.teardown();
        }
    }
    $set(target,key,value){
        //数组
        if(isArray(target) && isValidArrayIndex(key)){
            target.length = Math.max(target.length,key);
            target.splice(key,1,value);
            return value;
        }

        //属性值已存在
        if(key in target && !(key in Object.prototype)){
            target[key] = value;
            return value;
        }

        //属性不存在
        const ob = target.__ob__;
        if(!ob){
            target[key] = value;
            return value;
        }
        //响应式数据,添加属性
        defineReactive(target,key,value)
        ob.dep.notify();
        return value;
    }
    $delete(target,key){
        //数组
        if(isArray(target) && isValidArrayIndex(key)){
            target.splice(key,1);
            return;
        }

        if(!hasOwn(target,key)){
            return;
        }

        let ob = target.__ob__;
        delete target[key];
        
        if(!ob){
            return;
        }
        ob.dep.notify();
    }
}