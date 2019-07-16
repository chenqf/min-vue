
import Vue from './instance/index.js'


//TODO 对象被覆盖后,子监听失效了
// window.vm = new Vue({
//     data:{
//         a:1,
//         b:2,
//         c:{
//             d:10
//         }
//     }
// })


// vm.$watch('c.d',function(newVal,oldVal){
//     console.log('newVal:',newVal);
//     console.log('oldVal:',oldVal);
// })

// vm.c = {d:11}
// vm.c.d = 12





window.vm = new Vue({
    data:{
        a:1,
        b:2,
        c:{
            d:10
        }
    }
})


vm.$watch('c',function(newVal,oldVal){
    console.log('newVal:',newVal);
    console.log('oldVal:',oldVal);
})

vm.$set(vm.c,'dd',100);