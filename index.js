// import Vue from './instance/index.js';
import {
    h,
    Fragment,
    Portal
} from './vdom/vnode.js';
import render from './vdom/render.js';






let container = document.getElementById('container');

// 旧的 VNode
const prevVNode = h('div', {
    style: {
        width: '100px',
        height: '100px',
        backgroundColor: 'red'
    },
    id:'123',
    class:{ddd:true},
    onclick:function(){
        console.log('1');
    }
})

// 新的 VNode
const nextVNode = h('div', {
    style: {
        width: '100px',
        height: '100px',
        border: '1px solid green'
    },
    id:'3333333333',
    class:['123','321'],
    onclick:function(){
        console.log('2');
    }
})




render(prevVNode, container)
setTimeout(() => {
    render(nextVNode, container)
}, 2000);