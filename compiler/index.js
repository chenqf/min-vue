import {
    parseHTML
} from "./html-parse.js";
import {
    no
} from "../util/index.js";




// 事件
export const onRE = /^@|^v-on:/
// 指令
export const dirRE = /^v-|^@|^:/
// for 循环
export const forAliasRE = /([^]*?)\s+(?:in|of)\s+([^]*)/
// for 循环中第一个分组 (obj,key,index)
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
// 要么(开头,要么)结尾,或者两者兼得
export const stripParensRE = /^\(|\)$/g;
// 匹配指令的参数 <div v-on:click.stop="handleClick"></div> 中的 click.stop
export const argRE = /:(.*)$/;
// 检测属性是否是绑定 v-bind || :
export const bindRE = /^:|^v-bind:/
// 匹配修饰符 click.stop
export const modifierRE = /\.[^.]+/g
// 用于解码 https://github.com/mathiasbynens/he
// TODO export const decodeHTMLCached = cached(he.decode);
export const decodeHTMLCached = (str) => str;
// 匹配默认的分隔符 "{{}}"
export const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g

export function makeAttrsMap(attrs) {
    const map = {}
    for (let i = 0, l = attrs.length; i < l; i++) {
        map[attrs[i].name] = attrs[i].value
    }
    return map
}

export function createASTElement(tag, attrs = [], parent) {
    return {
        type: 1,
        tag,
        attrsList: attrs,
        attrsMap: makeAttrsMap(attrs),
        parent,
        children: []
    }
}

export function parseText(text) {
    const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g
    if (!defaultTagRE.test(text)) {
        return void 0;
    }

    const tokens = [];
    let lastIndex = defaultTagRE.lastIndex = 0;
    let match, index;
    while (match = defaultTagRE.exec(text)) {
        index = match.index;
        if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push(`_s(${match[1].trim()})`);
        lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)))
    }
    return tokens.join('+')
}


export function parse(template) {
    let platformIsPreTag = no
    let platformMustUseProp = no
    let platformGetTagNamespace = no

    // transforms = pluckModuleFunction(options.modules, 'transformNode')
    // preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
    // postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')

    const stack = []
    const preserveWhitespace = false; // 是否放弃标签间的空格
    let root
    let currentParent
    let inVPre = false // 识当前解析的标签是否在拥有 v-pre 的标签之内
    let inPre = false // inPre 变量用来标识当前正在解析的标签是否在 <pre></pre> 标签之内
    let warned = false

    parseHTML(template, {
        // shouldKeepComment:true,//启用注释
        start(tag, attrs, unary, start, end) {
            const element = createASTElement(tag, attrs, currentParent)
            if (!root) {
                root = element
            } else if (currentParent) {
                currentParent.children.push(element)
            }

            if (!unary) {
                currentParent = element;
                stack.push(currentParent);
            }
        },
        end(tagName, start, end) {
            stack.pop();
            currentParent = stack[stack.length - 1];
        },
        chars(text) {
            text = text.trim();
            if (text) {
                const children = currentParent.children;
                let expression = parseText(text);
                if (expression) {
                    children.push({
                        type: 2,
                        expression,
                        text
                    })
                } else {
                    children.push({
                        type: 3,
                        text
                    })
                }
            }
        },
        comment(text) {
            console.log('comment: ', text)
        }
    })

    return root;
}


export const getVNodeCode = function (node) {
    if (node.type === 1) {
        return `h(${JSON.stringify(node.tag)},${JSON.stringify(node.attrsMap)},${node.children.length>1?'[' + node.children.map(n=>getVNodeCode(n)) + ']':getVNodeCode(node.children[0])})`
    } else if (node.type === 2) {
        return JSON.stringify(node.text)
    } else if (node.type === 3) {
        return JSON.stringify(node.text)
    }
}

export const createVNodeFnByAST = function(node){
    let code = getVNodeCode(node);    
    return new Function('h','return ' + code);
}