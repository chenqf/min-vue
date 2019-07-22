import {
    VNodeFlags
} from "./flags.js";

import { 
    mount 
} from "./mount.js";

import {
    removeChild,
    patchData
} from './opt.js'




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
        // 组件
        else if (nextFlags & VNodeFlags.COMPONENT) {
            patchComponent(prevVNode, nextVNode, container)
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
    }
}




export const replaceVNode = function (prevVNode, nextVNode, container) {
    removeChild(container,prevVNode.el);
    mount(nextVNode,container);
}


export const patchElement = function (prevVNode, nextVNode, container) {
    if(prevVNode.tag !== nextVNode.tag){
        replaceVNode(prevVNode,nextVNode,container);
        return ;
    }

    const el = (nextVNode.el = prevVNode.el);
    const isSVG = nextVNode.flags & VNodeFlags.ELEMENT_SVG

    const prevData = prevVNode.data;
    const nextData = nextVNode.data;

    if(nextData){
        for(let key in nextData){
            let prevValue = prevData[key];
            let nextValue = nextData[key];
            patchData(el,key,prevValue,nextValue,isSVG);
        }
    }
    if(prevData){
        for(let key in prevData){
            let prevValue = prevData[key];
            if(prevValue && !nextData.hasOwnProperty(key)){
                patchData(el,key,prevValue,null,isSVG);
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


export const patchChildren = function(prevChildFlags,nextChildFlags,prevChildren,nextChildren,container){

}


export const patchComponent = function (prevVNode, nextVNode, container) {

}


export const patchText = function (prevVNode, nextVNode, container) {

}


export const patchFragment = function (prevVNode, nextVNode, container) {

}


export const patchPortal = function (prevVNode, nextVNode, container) {

}
