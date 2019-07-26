import {
    parseHTML
} from "./html-parse.js";

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


export function parse(template) {
    let currentParent;
    let root;
    let stack = [];

    parseHTML(template, {
        // shouldKeepComment:true,//启用注释
        start(tag, attrs, unary, start, end) {
            const element = {
                type: 1,
                tag: tag,
                parent: null,
                attrsList: attrs,
                children: []
            }
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
            console.log('text:', text);

        },
        comment(text) {
            console.log('comment: ', text)
        }
    })

    return root;
}