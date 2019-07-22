import {
    VNodeFlags,
    ChildrenFlags
} from './flags.js'

export const Fragment = Symbol()
export const Portal = Symbol()

/**
 
VNode 分类:
    [
        1.标签:[
                html,svg
            ],
        2.组件:[
                有状态:[
                    普通,
                    需要keepAlive
                    已经被keepAlive
                ],
                无状态:函数式组件
            ],
        3.纯文本:[
                文本节点,
                注释节点
            ]
        4.Fragment
        5.Portal
    ]

VNode.children 分类:
    [
        1.没有子节点
        2.只有一个子节点
        3.多个子节点:[
                有 key,
                无 key
            ]
        4.不知道子节点的情况
    ]

VNode 内容:
    {
        _isVNode    永远为true,标明当前为VNode对象
        el          被渲染为真实DOM之后,引用该DOM
        flags       标明VNode的类型--VNodeFlags
        childFlags  标明子节点的类型--ChildrenFlags
        tag         标签名
        data        附加信息
        children    子元素[VNode]
    }
*/


//创建一个纯文本的VNode
export const createTextVNode = function(text) {
    return {
        _isVNode: true,
        // flags 是 VNodeFlags.TEXT
        flags: VNodeFlags.TEXT,
        tag: null,
        data: null,
        // 纯文本类型的 VNode，其 children 属性存储的是与之相符的文本内容
        children: text,
        // 文本节点没有子节点
        childFlags: ChildrenFlags.NO_CHILDREN,
        el: null
    }
}



//不考虑文本的情况,如果是文本,自动生成一下
export const h = function (tag, data = null, children = null) {
    //确定 flags
    let flags = null
    if (typeof tag === 'string') {
        flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML
    } else if (tag === Fragment) {
        flags = VNodeFlags.FRAGMENT
    } else if (tag === Portal) {
        flags = VNodeFlags.PORTAL
        tag = data && data.target // Portal 挂载的目标
    } else if (typeof tag === 'function') {
        // 有状态组件会继承拥有render函数的基类
        flags = tag.prototype && tag.prototype.render ?
            VNodeFlags.COMPONENT_STATE_NORMAL // 有状态组件
            :
            VNodeFlags.COMPONENT_FUNCTIONAL // 无状态组件
    }
    
    // 确定 childFlags
    let childFlags = null;
    if (Array.isArray(children)) {
        let {
            length
        } = children;
        if (length === 0) {
            //没有 children
            childFlags = ChildrenFlags.NO_CHILDREN;
        } else if (length === 1) {
            //单个子节点
            childFlags = ChildrenFlags.SINGLE_V_NODE;
            children = children[0];
        } else {
            // 多个子节点，且子节点使用key
            childFlags = ChildrenFlags.KEYED_V_NODES
            children = normalizeVNodes(children)
        }
    } else if (children === null || children === undefined) {
        //没有 children
        childFlags = ChildrenFlags.NO_CHILDREN;
    } else if (children._isVNode) {
        // 单个子节点
        childFlags = ChildrenFlags.SINGLE_V_NODE
    } else {
        // 其他情况都作为文本节点处理，即单个子节点，会调用 createTextVNode 创建纯文本类型的 VNode
        childFlags = ChildrenFlags.SINGLE_V_NODE
        children = createTextVNode(children + '')
    }

    return {
        _isVNode: true,
        flags,
        tag,
        data,
        children,
        childFlags,
        el: null
    }
}


//处理子元素列表
function normalizeVNodes(children) {
    const newChildren = []
    // 遍历 children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child.key == null) {
            // 如果原来的 VNode 没有key，则使用竖线(|)与该VNode在数组中的索引拼接而成的字符串作为key
            child.key = '|' + i
        }
        newChildren.push(child)
    }
    // 返回新的children，此时 children 的类型就是 ChildrenFlags.KEYED_V_NODES
    return newChildren
}


































































































































// //TODO 如何区分及实现 Fragment 和 Portal

// export class VNode {
//     constructor(tag, data, children, text, elm, context, componentOptions, asyncFactory) {
//         this._VNode = true; // 用于判断当前对象是否是 VNode
//         this.tag = tag; // 节点名称: ul li div span
//         this.data = data; //节点数据  class id src style
//         this.children = children; // 子节点列表
//         this.text = text; // 文本内容(文本节点,注释节点)
//         this.elm = elm; // 引用该真实DOM

//         this.context = context; // 当前组件的 Vue 实例
//         this.key = data && data.key; // 提升效率的 key

//         this.isComment = false; // 是否是注释节点
//         this.isCloned = false; // 是否是克隆节点

//         this.flags = undefined; // 标识 VNode 的类型
//         this.childrenFlags = undefined; // 标识子的类型

//         this.ns = undefined;

//         this.functionalContext = undefined;
//         this.functionalOptions = undefined;
//         this.functionalScopeId = undefined;



//         this.componentOptions = componentOptions; // 组件的参数 props 等
//         this.componentInstance = undefined; //TODO 组件实例(Vue)  用来区分是 标签 还是 组件

//         this.parent = undefined; // TODO 父节点,dom 还是 vNode
//         this.raw = false;
//         this.isStatic = false;
//         this.isRootInsert = false;

//         this.asyncFactory = asyncFactory;
//         this.asyncMeta = undefined;
//         this.isAsyncPlaceholder = false;
//     }
//     get child() {
//         return this.componentInstance;
//     }
// }


// export const Fragment = Symbol()
// export const Portal = Symbol()

// export const h = function (tag, data = null, children = null) {
//     let flags = null;
//     if (typeof tag === 'string') {
//         flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML
//     } else if (tag === Fragment) {
//         flags = VNodeFlags.FRAGMENT
//     } else if (tag === Portal) {
//         flags = VNodeFlags.PORTAL
//         tag = data && data.target
//     }

//     return {
//         _isVNode = true
//     }
// }





// // 注释节点
// export const createEmptyVNode = text => {
//     const node = new VNode();
//     node.text = text;
//     node.isComment = true;
//     return node;
// }

// // 文本节点
// export const createTextVNode = text => {
//     const node = new VNode();
//     node.text = String(text);
//     return node;
// }

// // 克隆节点
// export function cloneVNode(vNode, deep) {
//     const cloned = new VNode(
//         vNode.tag,
//         vNode.data,
//         vNode.children,
//         vNode.text,
//         vNode.elm,
//         vNode.context,
//         vNode.componentOptions,
//         vNode.asyncFactory
//     )
//     cloned.ns = vNode.ns;
//     cloned.isStatic = vNode.isStatic;
//     cloned.key = vNode.key;
//     cloned.isComment = vNode.isComment;
//     cloned.isCloned = true;
//     //TODO children 是数组吧 ?
//     if (deep && vNode.children && vNode.children.length) {
//         cloned.children = vNode.children.map(node => cloneVNode(node, deep))
//     }
//     return cloned;
// }

// // 元素节点
// export const createElementVNode = (tag, data, children) => {
//     const node = new VNode();
//     node.tag = tag;
//     node.data = data;
//     node.children = children;
//     return node;
// }
// // 组件节点
// // 函数式组件