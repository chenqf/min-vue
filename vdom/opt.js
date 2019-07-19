

// 获取父节点
export const getParentNode = function(element){
    return element.parentNode;
}

//设置文本内容
export const setTextContent = function(element,text){
    return element.setTextContent = text;
}

//删除节点
export const removeChild = function(parent,element){
    return parent.removeChild(element)
}

//追加节点
export const appendChild = function(parent,element){
    return parent.appendChild(element)
}

//插入节点
export const insertBefore = function(parent,element,refElement){
    return parent.insertBefore(element,refElement)
}


//创建标签
export const createElement = function(tag){
    return document.createElement(tag);
}

//创建文本
export const createTextNode = function(text){
    return document.createTextNode(text);
}

//创建注释
export const createComment = function(comment){
    return document.createComment(comment);
}
