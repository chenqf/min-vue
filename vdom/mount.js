import {
    VNodeFlags,
    ChildrenFlags
} from "./flags.js";

import {
    appendChild,
    createTextNode,
    createElementNS,
    createElement,
    queryTarget,
    patchData,
    getParentNode,
    insertBefore
} from "./opt.js";

import {
    createTextVNode
} from './vnode.js'
import { patch } from "./patch.js";






export const mount = function (vNode, container, isSVG,refNode) {
    let {
        flags
    } = vNode;
    // 挂载普通标签
    if (flags & VNodeFlags.ELEMENT) {
        mountElement(vNode, container, isSVG,refNode)
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

export const mountElement = function (vNode, container, isSVG,refNode) {

    let {
        tag,
        data,
        children,
        childFlags
    } = vNode;

    isSVG = isSVG || vNode.flags & VNodeFlags.ELEMENT_SVG
    const el = isSVG ? createElementNS(tag):createElement(tag);

    vNode.el = el;

    //处理DOM属性
    for (let key in data) {
        data.hasOwnProperty(key) && patchData(el,key,null,data[key],isSVG);
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

    refNode ? insertBefore(container,el,refNode) : appendChild(container, el);
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
    const instance = (vNode.children = new vNode.tag());
    // 初始化 props
    instance.$props = vNode.data;

    instance._update = function(){
        //更新
        if(instance._mounted){
            // 拿到旧的 VNode
            const prevVNode = instance.$vNode
            // 重渲染新的 VNode
            const nextVNode = (instance.$vNode = instance.render())
            // patch 更新
            patch(prevVNode, nextVNode, getParentNode(prevVNode.el))
            // 更新 vNode.el 和 $el
            instance.$el = vNode.el = instance.$vNode.el
        }
        //挂载
        else{
            // 渲染 VNode
            instance.$vNode = instance.render(); // render 返回组件的 VNode
            // 挂载
            mount(instance.$vNode, container, isSVG);
            // 设置已挂载标识
            instance._mounted = true
            // el 属性值 和 组件实例的 $el 属性都引用组件的根DOM元素
            instance.$el = vNode.el = instance.$vNode.el;
            // 调用 mounted 钩子
            instance.mounted && instance.mounted()
        }
    }
    instance._update();
}

export const mountFunctionComponent = function (vNode, container, isSVG) {
    vNode.handle = {
        prev:null,
        next:vNode,
        container,
        update:()=>{
            //更新
            if(vNode.handle.prev){
                // prevVNode 是旧的组件VNode，nextVNode 是新的组件VNode
                const prevVNode = vNode.handle.prev
                const nextVNode = vNode.handle.next
                // prevTree 是组件产出的旧的 VNode
                const prevTree = prevVNode.children
                // 更新 props 数据
                const props = nextVNode.data
                // nextTree 是组件产出的新的 VNode
                const nextTree = (nextVNode.children = nextVNode.tag(props))
                // 调用 patch 函数更新
                patch(prevTree, nextTree, vNode.handle.container)
            }
            //挂载
            else{
                // 获取 props
                const props = vNode.data;
                // 获取 VNode
                const $vNode = (vNode.children = vNode.tag(props))
                // 挂载
                mount($vNode, container, isSVG)
                // el 元素引用该组件的根元素
                vNode.el = $vNode.el
            }
        }
    }
    //初次挂载
    vNode.handle.update();
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
    const target = queryTarget(tag);
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



