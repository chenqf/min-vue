// import Vue from './instance/index.js';
import {
    h,
    Fragment,
    Portal
} from './vdom/vnode.js';
import render from './vdom/render.js';

import {
  parse,createVNodeFnByAST
} from './compiler/index.js'



// 获取模板
let tplEl = document.getElementById('template');
let tpl = tplEl.innerHTML;
tplEl.innerHTML = '';
// 获取AST
let ast = parse(tpl);
// 根据AST生成VNode
let vNode = createVNodeFnByAST(ast)(h)


// 渲染
render(vNode, document.getElementById('container'))



