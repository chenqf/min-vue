import {
    VNodeFlags,
    ChildrenFlags
} from "./flags.js";

import {
    mount
} from "./mount.js";

import {
    removeChild,
    patchData,
    queryTarget,
    appendChild,
    insertBefore,
    getNextSibling
} from './opt.js'
import { vue2Diff } from "./diff.js";




export const patch = function (prevVNode, nextVNode, container) {
    const prevFlags = prevVNode.flags;
    const nextFlags = nextVNode.flags;

    // 类型不同,直接替换
    if (prevFlags !== nextFlags) {
        replaceVNode(prevVNode, nextVNode, container)
    }
    //类型相同
    else {
        // 元素
        if (nextFlags & VNodeFlags.ELEMENT) {
            patchElement(prevVNode, nextVNode, container)
        }
        // 文本
        else if (nextFlags & VNodeFlags.TEXT) {
            patchText(prevVNode, nextVNode, container)
        }
        // FRAGMENT
        else if (nextFlags & VNodeFlags.FRAGMENT) {
            patchFragment(prevVNode, nextVNode, container)
        }
        // PORTAL
        else if (nextFlags & VNodeFlags.PORTAL) {
            patchPortal(prevVNode, nextVNode, container)
        }
        // 组件
        else if (nextFlags & VNodeFlags.COMPONENT) {
            patchComponent(prevVNode, nextVNode, container)
        }
    }
}




export const replaceVNode = function (prevVNode, nextVNode, container) {
    removeChild(container, prevVNode.el);
    //如果旧节点是组件,需要调用unmounted钩子
    if(prevVNode.flags & VNodeFlags.COMPONENT_STATE_NORMAL){
        const instance = prevVNode.children;
        instance.unmounted && instance.unmounted();
    }
    mount(nextVNode, container);
}


export const patchElement = function (prevVNode, nextVNode, container) {
    if (prevVNode.tag !== nextVNode.tag) {
        replaceVNode(prevVNode, nextVNode, container);
        return;
    }

    const el = (nextVNode.el = prevVNode.el);
    const isSVG = nextVNode.flags & VNodeFlags.ELEMENT_SVG

    const prevData = prevVNode.data;
    const nextData = nextVNode.data;

    if (nextData) {
        for (let key in nextData) {
            let prevValue = prevData[key];
            let nextValue = nextData[key];
            patchData(el, key, prevValue, nextValue, isSVG);
        }
    }
    if (prevData) {
        for (let key in prevData) {
            let prevValue = prevData[key];
            if (prevValue && !nextData.hasOwnProperty(key)) {
                patchData(el, key, prevValue, null, isSVG);
            }
        }
    }

    //比较子节点
    patchChildren(
        prevVNode.childFlags,
        nextVNode.childFlags,
        prevVNode.children,
        nextVNode.children,
        el
    )
}

//TODO Fragment Portal
export const patchChildren = function (prevChildFlags, nextChildFlags, prevChildren, nextChildren, container) {
    switch (prevChildFlags) {
        //旧:单个子节点
        case ChildrenFlags.SINGLE_V_NODE:
            switch (nextChildFlags) {
                //旧:单个子节点 && 新:单个子节点
                case ChildrenFlags.SINGLE_V_NODE:
                    patch(prevChildren,nextChildren,container)
                    break;
                //旧:单个子节点 && 新:没有子节点
                case ChildrenFlags.NO_CHILDREN:
                    removeChild(container,prevChildren.el)
                    break;
                //旧:单个子节点 && 新:多个子节点
                default:
                    removeChild(container,prevChildren.el)
                    for(let i = 0; i<nextChildren.length; i++){
                        mount(nextChildren[i], container)
                    }
                    break;
            }
            break;
            //旧:没有子节点
        case ChildrenFlags.NO_CHILDREN:
            switch (nextChildFlags) {
                //旧:没有子节点 && 新:单个子节点
                case ChildrenFlags.SINGLE_V_NODE:
                    mount(nextChildren, container)
                    break;
                //旧:没有子节点 && 新:没有子节点
                case ChildrenFlags.NO_CHILDREN:
                    //什么都不做
                    break;
                //旧:没有子节点 && 新:多个子节点
                default:
                    for (let i = 0; i < nextChildren.length; i++) {
                        mount(nextChildren[i], container)
                    }
                    break;
            }
            break;
            //旧:多个子节点
        default:
            switch (nextChildFlags) {
                //旧:多个子节点 && 新:单个子节点
                case ChildrenFlags.SINGLE_V_NODE:
                    for(let i = 0; i<prevChildren.length; i++){
                        removeChild(container,prevChildren[i].el)
                    }
                    mount(nextChildren,container)
                    break;
                //旧:多个子节点 && 新:没有子节点
                case ChildrenFlags.NO_CHILDREN:
                    for(let i = 0; i<prevChildren.length; i++){
                        removeChild(container,prevChildren[i].el)
                    }
                    break;
                //旧:多个子节点 && 新:多个子节点
                default:
                    // DIFF 
                    vue2Diff(prevChildren,nextChildren,container)

                    break;
            }
            break;

    }
}


export const patchComponent = function (prevVNode, nextVNode, container) {
    // tag 属性的值是组件类，通过比较新旧组件类是否相等来判断是否是相同的组件
    if(nextVNode.tag !== prevVNode.tag){
        replaceVNode(prevVNode,nextVNode,container)
    }
    //有状态组件
    else if (nextVNode.flags & VNodeFlags.COMPONENT_STATE_NORMAL) {
        // 1、获取组件实例
        const instance = (nextVNode.children = prevVNode.children)
        // 2、更新 props
        instance.$props = nextVNode.data
        // 3、更新组件
        instance._update()
    }
    //函数式组件
    else{
        const handle = (nextVNode.handle = prevVNode.handle);
        handle.prev = prevVNode;
        handle.next = nextVNode;
        handle.container = container;
        //更新
        handle.update();
    }
}


export const patchText = function (prevVNode, nextVNode, container) {
    const el = (nextVNode.el = prevVNode.el)
    if(nextVNode.children !== prevVNode.children){
        el.nodeValue = nextVNode.children;
    }
}


export const patchFragment = function (prevVNode, nextVNode, container) {
    patchChildren(
        prevVNode.childFlags, // 旧片段的子节点类型
        nextVNode.childFlags, // 新片段的子节点类型
        prevVNode.children,   // 旧片段的子节点
        nextVNode.children,   // 新片段的子节点
        container
      )
    
    switch(nextVNode.childFlags){
        case ChildrenFlags.SINGLE_V_NODE:
            nextVNode.el = nextVNode.children.el;
            break;
        case ChildrenFlags.NO_CHILDREN:
            nextVNode.el = prevVNode.el;
            break;
        default:
            nextVNode.el = nextVNode.children[0].el;
            break;
    }
}


export const patchPortal = function (prevVNode, nextVNode, container) {
    patchChildren(
        prevVNode.childFlags, // 旧片段的子节点类型
        nextVNode.childFlags, // 新片段的子节点类型
        prevVNode.children,   // 旧片段的子节点
        nextVNode.children,   // 新片段的子节点
        queryTarget(prevVNode.tag)
      )
    nextVNode.el = prevVNode.el;
    //新旧容器不同,需要搬运
    if(nextVNode.tag !== prevVNode.tag){
        let target = queryTarget(nextVNode.tag)

        switch(nextVNode.childFlags){
            case ChildrenFlags.SINGLE_V_NODE:
                appendChild(target,nextVNode.children.el);
                break;
            case ChildrenFlags.NO_CHILDREN:
                break;
            default:
                for (let i = 0; i < nextVNode.children.length; i++) {
                    appendChild(target,nextVNode.children[i].el)
                }
                break;
        }
    }
}

