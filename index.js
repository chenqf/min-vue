
import Vue from './instance/index.js'


window.vm = new Vue({
    data:{
        a:1,
        b:2,
        c:3,
        d:[{cqf:11},2,3,4],
        e:{
            f:{
                g:123
            }
        }
    }
})


let unwatch = vm.$watch(function(){
    return this.d[0].cqf + this.b;
},function(newVal,oldVal){
    console.log('new:',newVal);
    console.log('old',oldVal);
},{immediate:true})


setTimeout(()=>{
    unwatch();
},5000);