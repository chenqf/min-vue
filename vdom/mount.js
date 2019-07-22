import {
    VNodeFlags,
    ChildrenFlags
} from "./flags.js";

import {
    appendChild,
    createTextNode
} from "./opt.js";

import {
    createTextVNode
} from './vnode.js'

import {
    isObject,
    isArray
} from '../util/index.js'


const styleSet = new Set([
    'width',
    'height',
    'fontSize'
])

const domPropsRE = /\W|^(?:value|checked|selected|muted)$/


export const mount = function (vNode, container, isSVG) {
    let {
        flags
    } = vNode;
    // 挂载普通标签
    if (flags & VNodeFlags.ELEMENT) {
        mountElement(vNode, container, isSVG)
    }
    //挂载组件
    else if (flags & VNodeFlags.COMPONENT) {
        mountComponent(vNode, container, isSVG)
    }
    //挂载纯文本
    else if (flags & VNodeFlags.TEXT) {
        mountText(vNode, container)
    }
    //挂载 Fragment
    else if (flags & VNodeFlags.FRAGMENT) {
        mountFragment(vNode, container, isSVG)
    }
    //挂载 Portal
    else if (flags & VNodeFlags.PORTAL) {
        mountPortal(vNode, container)
    }
}

export const mountElement = function (vNode, container, isSVG) {

    let {
        tag,
        data,
        children,
        childFlags
    } = vNode;

    isSVG = isSVG || vNode.flags & VNodeFlags.ELEMENT_SVG
    const el = isSVG ?
        document.createElementNS('http://www.w3.org/2000/svg', tag) :
        document.createElement(tag)


    vNode.el = el;

    //处理DOM属性
    if (data) {
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                switch (key) {
                    case 'style': // TOOD style 处理还有问题
                        for (let k in data.style) {
                            el.style[k] = data.style[k];
                        }
                        break;
                    case 'class':
                        let classStr = getClassStr(data[key]);
                        if (isSVG) {
                            el.setAttribute('class', classStr)
                        } else {
                            el.className = classStr
                        }
                        break
                    default:
                        //处理事件
                        if (key.slice(0, 2) === 'on') {
                            el.addEventListener(key.slice(2), data[key])
                        }
                        //特殊属性,如单选复选的选中
                        else if (domPropsRE.test(key)) {
                            // 当作 DOM Prop 处理
                            el[key] = data[key]
                        }
                        //其他属性
                        else {
                            // 当作 Attr 处理
                            el.setAttribute(key, data[key])
                        }
                        break
                }
            }
        }
    }
    //处理子节点
    if (childFlags !== ChildrenFlags.NO_CHILDREN) {
        //单节点
        if (childFlags & ChildrenFlags.SINGLE_V_NODE) {
            mount(children, el, isSVG)
        }
        //多节点
        else if (childFlags & ChildrenFlags.MULTIPLE_V_NODES) {
            for (let i = 0; i < children.length; i++) {
                mount(children[i], el, isSVG)
            }
        }
    }

    appendChild(container, el);
}

export const mountComponent = function (vNode, container, isSVG) {
    if (vNode.flags & VNodeFlags.COMPONENT_STATE) {
        mountStateComponent(vNode, container, isSVG);
    } else {
        mountFunctionComponent(vNode, container, isSVG);
    }
}

export const mountStateComponent = function (vNode, container, isSVG) {
    // vNode.tag 就是组件自身
    const instance = new vNode.tag();
    // 渲染 VNode
    instance.$vnode = instance.render(); // render 返回组件的 VNode
    // 挂载
    mount(instance.$vnode, container, isSVG);
    // el 属性值 和 组件实例的 $el 属性都引用组件的根DOM元素
    instance.$el = vNode.el = instance.$vnode.el;
}

export const mountFunctionComponent = function (vNode, container, isSVG) {
    // 获取 VNode
    const $vnode = vNode.tag()
    // 挂载
    mount($vnode, container, isSVG)
    // el 元素引用该组件的根元素
    vNode.el = $vnode.el
}

export const mountText = function (vNode, container) {
    const el = createTextNode(vNode.children, container);
    vNode.el = el;
    appendChild(container, el);
}

export const mountFragment = function (vNode, container, isSVG) {
    // 拿到 children 和 childFlags
    const {
        children,
        childFlags
    } = vNode;
    switch (childFlags) {
        case ChildrenFlags.SINGLE_V_NODE:
            mount(children, container, isSVG);
            vNode.el = children.el;
            break;
        case ChildrenFlags.NO_CHILDREN:
            const placeholder = createTextVNode('');
            mountText(placeholder, container);
            vNode.el = placeholder.el;
            break;
        default:
            for (let i = 0; i < children.length; i++) {
                mount(children[i], container, isSVG);
            }
            vNode.el = children[0].el;
    }
}

export const mountPortal = function (vNode, container) {
    const {
        tag,
        children,
        childFlags
    } = vNode;

    // 虽然 Portal 的内容可以被渲染到任意位置，但它的行为仍然像普通的DOM元素一样，如事件的捕获/冒泡机制仍然按照代码所编写的DOM结构实施。
    // 需要占位的DOM元素来实现

    //获取挂载点
    const target = typeof tag === 'string' ? document.querySelector(tag) : tag;
    //单个子元素
    if (childFlags & ChildrenFlags.SINGLE_V_NODE) {
        mount(children, target)
    }
    //多个子元素
    else if (childFlags & ChildrenFlags.MULTIPLE_V_NODES) {
        for (let i = 0; i < children.length; i++) {
            mount(children[i], target)
        }
    }
    // 占位的空文本节点
    const placeholder = createTextVNode('')
    // 将该节点挂载到 container 中
    mountText(placeholder, container)
    // el 属性引用该节点
    vNode.el = placeholder.el
}



function _getClassStr(obj, res = []) {
    if (typeof obj === 'string') {
        res.push(obj)
    } else if (isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            _getClassStr(obj[i], res);
        }
    } else if (isObject(obj)) {
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (obj[i]) {
                    _getClassStr(i, res)
                }
            }
        }
    }
}

function getClassStr(obj) {
    let res = [];
    _getClassStr(obj, res);

    return res.length ? res.join(' ') : '';
}