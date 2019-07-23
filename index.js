// import Vue from './instance/index.js';
import {
    h,
    Fragment,
    Portal
} from './vdom/vnode.js';
import render from './vdom/render.js';


const prev = h('div',{style:{background:'red'}},[
  h('li', { key: 'a' }, 1),
  h('li', { key: 'b' }, 2),
  h('li', { key: 'c' }, 3)
])

const next = h('div',{style:{background:'yellow'}},[
  h('li', { key: 'a' }, 1),
  h('li', { key: 'b' }, 2),
  h('li', { key: 'd' }, 4),
  h('li', { key: 'e' }, 5),
])



render(prev, document.getElementById('container'))
setTimeout(() => {
    render(next, document.getElementById('container'))
}, 2000);