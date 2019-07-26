import {
    makeMap
} from "../util/index.js";

const expectHTML = true;
// 匹配属性
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
// 匹配开始标签开始部分
const startTagOpen = new RegExp(`^<${qnameCapture}`)
// 匹配开始标签结束部分
const startTagClose = /^\s*(\/?)>/
// 匹配结束标签
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
// 匹配注释
const comment = /^<!\--/
// 匹配条件注释
const conditionalComment = /^<!\[/
// 匹配DOCTYPE
const doctype = /^<!DOCTYPE [^>]+>/i
// 匹配默认的分隔符 "{{}}"
const defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g

const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;
const decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t',
    '&#39;': "'"
};

//纯粹的文本标签
export const isPlainTextElement = makeMap('script,style,textarea', true)
// script style
export const isForbiddenTag = makeMap('script,style', true)
//段落标签
export const isNonPhrasingTag = makeMap('area,base,br,col,embed,frame,hr,img,input,isindex,' +
    'keygen,link,meta,param,source,track,wbr', true)
//一元标签
export const isUnaryTag = makeMap(
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr', true
)

//可以省略结束标签的标签
export const canBeLeftOpenTag = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source', true)


function getShouldDecode(href) {
    let div = document.createElement('div')
    div.innerHTML = href ? `<a href="\n"/>` : `<div a="\n"/>`
    return div.innerHTML.indexOf('&#10;') > 0
}

function decodeAttr(value, shouldDecodeNewlines) {
    var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
    return value.replace(re, function (match) {
        return decodingMap[match];
    })
}

export const shouldDecodeNewlines = getShouldDecode(false)
export const shouldDecodeNewlinesForHref = getShouldDecode(true)

export function parseHTML(html, options) {
    html = html.trim();
    let commentCallback = options.comment || function () {};
    let startCallback = options.start || function () {};
    let endCallback = options.end || function () {};
    let charsCallback = options.chars || function () {};

    let stack = []; //存放标签名,用于校验
    let index = 0; // 索引
    let last; //还未parse的模板
    let lastTag; // 保存在栈顶的标签名

    while (html) {
        last = html;
        //上一个节点不是纯粹的文本节点 script,style,textarea
        if (!lastTag || !isPlainTextElement(lastTag)) {
            let textEnd = html.indexOf('<')
            // < 开头
            if (textEnd === 0) {
                //注释节点
                if (comment.test(html)) {
                    const commentEnd = html.indexOf('-->')
                    if (commentEnd >= 0) {
                        if (options.shouldKeepComment) {
                            commentCallback(html.substring(4, commentEnd), index, index + commentEnd + 3)
                        }
                        advance(commentEnd + 3)
                        continue
                    }
                }
                //条件注释
                if (conditionalComment.test(html)) {
                    const conditionalEnd = html.indexOf(']>')
                    if (conditionalEnd >= 0) {
                        advance(conditionalEnd + 2)
                        continue
                    }
                }
                //DOCTYPE
                const doctypeMatch = html.match(doctype)
                if (doctypeMatch) {
                    advance(doctypeMatch[0].length)
                    continue
                }
                //结束标签
                const endTagMatch = html.match(endTag)
                if (endTagMatch) {
                    const curIndex = index
                    advance(endTagMatch[0].length)
                    parseEndTag(endTagMatch[1], curIndex, index)
                    continue
                }
                //开始标签
                const startTagMatch = parseStartTag()
                if (startTagMatch) {
                    handleStartTag(startTagMatch)
                    continue;
                }
            }

            let text, rest, next;
            if (textEnd >= 0) {
                rest = html.slice(textEnd)
                while (
                    !endTag.test(rest) &&
                    !startTagOpen.test(rest) &&
                    !comment.test(rest) &&
                    !conditionalComment.test(rest)
                ) {
                    // < in plain text, be forgiving and treat it as text
                    next = rest.indexOf('<', 1)
                    if (next < 0) break
                    textEnd += next
                    rest = html.slice(textEnd)
                }
                text = html.substring(0, textEnd)
                advance(textEnd)
            }

            if (textEnd < 0) {
                text = html
                html = '';
            }

            if (text) {
                charsCallback(text);
            }
        }
        //此节点时纯粹的文本节点 script style textarea
        else {
            let endTagLength = 0
            const stackedTag = lastTag.toLowerCase()
            const reStackedTag = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i');
            const rest = html.replace(reStackedTag, function (all, text, endTag) {
                endTagLength = endTag.length
                charsCallback(text)
                return ''
            })
            index += html.length - rest.length;
            html = rest;
            parseEndTag(stackedTag, index - endTagLength, index)
        }

        // 整个字符串是一个文本节点
        if (html === last) {
            charsCallback(html);
            break;
        }

    }


    function parseStartTag() {
        // 结构：["<div", "div", index: 0, groups: undefined, input: "..."]
        const start = html.match(startTagOpen)
        if (start) {
            const match = {
                tagName: start[1],
                attrs: [],
                start: index
            }
            // 调整index以及html
            advance(start[0].length);
            // 循环匹配属性
            let end, attr;
            //匹配不到结束标签 && 能够获取属性
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                advance(attr[0].length);
                match.attrs.push(attr);
            }
            //结束后
            if (end) {
                match.unarySlash = end[1]; // 存储结束标签中是否有 /
                advance(end[0].length);
                match.end = index;
                return match;
            }
        }
    }

    // 检测是否缺少闭合标签
    // 处理 stack 栈中剩余的标签 ---- 不传参数
    // 解析 </br> 与 </p> 标签，与浏览器的行为相同
    function parseEndTag(tagName, start, end) {
        let pos, lowerCasedTagName
        if (start == null) start = index
        if (end == null) end = index
        if (tagName) {
            lowerCasedTagName = tagName.toLowerCase()
        }

        // 寻找当前解析的结束标签所对应的开始标签在 stack 栈中的位置
        if (tagName) {
            for (pos = stack.length - 1; pos >= 0; pos--) {
                if (stack[pos].lowerCasedTag === lowerCasedTagName) {
                    break
                }
            }
        } else {
            pos = 0;
        }

        if (pos >= 0) {
            for (let i = stack.length - 1; i >= pos; i--) {

                if ((i > pos || !tagName) && !(expectHTML && canBeLeftOpenTag(stack[i].tag))) {
                    console.warn(`tag <${stack[i].tag}> has no matching end tag.`)
                }
                endCallback(stack[i].tag, start, end)
            }
            stack.length = pos
            lastTag = pos && stack[pos - 1].tag
        } else if (lowerCasedTagName === 'br') {
            startCallback(tagName, [], true, start, end)
        } else if (lowerCasedTagName === 'p') {
            startCallback(tagName, [], false, start, end)
            endCallback(tagName, start, end)
        }
    }

    function handleStartTag(match) {
        const tagName = match.tagName
        const unarySlash = match.unarySlash
        if (expectHTML) {
            if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
                parseEndTag(lastTag)
            }
            if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
                parseEndTag(tagName)
            }
        }
        const unary = isUnaryTag(tagName) || !!unarySlash; // 是否是一元标签
        const l = match.attrs.length; // 属性的个数
        const attrs = new Array(l);

        //格式化 match.attrs
        for (let i = 0; i < l; i++) {
            const args = match.attrs[i];
            const value = args[3] || args[4] || args[5] || ''
            const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href' ?
                options.shouldDecodeNewlinesForHref :
                options.shouldDecodeNewlines
            attrs[i] = {
                name: args[1],
                value: decodeAttr(value, shouldDecodeNewlines)
            }
        }

        //非一元标签
        if (!unary) {
            stack.push({
                tag: tagName,
                lowerCasedTag: tagName.toLowerCase(),
                attrs: attrs
            })
            lastTag = tagName
        }
        startCallback(tagName, attrs, unary, match.start, match.end)
    }

    // 修改模板不断解析后的位置，以及截取模板字符串，保留未解析的template
    function advance(n) {
        index += n;
        html = html.substring(n)
    }
}







