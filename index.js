// import Vue from './instance/index.js';
import {
    h,
    Fragment
} from './vdom/vnode.js';
import render from './vdom/render.js';






let container = document.getElementById('container');

let vNode = h('div', {
    style: {
        color: 'red',
        background: 'grey',
        'font-size': 16
    }
}, h(Fragment,null,[h('span',null,'123'),h('span',null,'321')]))

render(vNode, container)