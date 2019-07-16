

export class VNode{
    constructor(tag,data,children,text,elm,context,componentOptions,asyncFactory){
        this.tag = tag;
        this.data = data;
        this.children = children;
        this.text = text;
        this.elm = elm;
        this.ns = undefined;
        this.context = context;
        this.functionalContext = undefined;
        this.functionalOptions = undefined;
        this.functionalScopeId = undefined;
        this.key = data && data.key;
        this.componentOptions = componentOptions;
        this.componentInstance = undefined;
        this.parent = undefined;
        this.raw = false;
        this.isStatic = false;
        this.isRootInsert = false;
        this.isComment = false;
        this.isCloned = false;
        this.asyncFactory = asyncFactory;
        this.asyncMeta = undefined;
        this.isAsyncPlaceholder = false;
    }
    get child(){
        return this.componentInstance;
    }
}



// 注释节点
export const createEmptyVNode = text =>{
    const node = new VNode();
    node.text = text;
    node.isComment = true;
    return node;
}

// 文本节点
export const createTextVNode = text =>{
    const node = new VNode();
    node.text = String(text);
    return node;
}

// 克隆节点
export function cloneVNode(vNode,deep){
    const cloned = new VNode(
        vNode.tag,
        vNode.data,
        vNode.children,
        vNode.text,
        vNode.elm,
        vNode.context,
        vNode.componentOptions,
        vNode.asyncFactory
    )
    cloned.ns = vNode.ns;
    cloned.isStatic = vNode.isStatic;
    cloned.key = vNode.key;
    cloned.isComment = vNode.isComment;
    cloned.isCloned = true;
    if(deep && vNode.children){
        cloned.children = cloneVNode(vNode.children)
    }
    return cloned;
}