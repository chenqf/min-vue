// import Vue from './instance/index.js';
import {
    h,
    Fragment,
    Portal
} from './vdom/vnode.js';
import render from './vdom/render.js';

// 子组件 - 函数式组件
function MyFunctionalComp(props) {
  return h('div', null, props.text)
}
// 父组件的 render 函数中渲染了 MyFunctionalComp 子组件
class ParentComponent {
  localState = 'one'

  mounted() {
    setTimeout(() => {
      this.localState = 'two'
      this._update()
    }, 2000)
  }

  render() {
    return h(MyFunctionalComp, {
      text: this.localState
    })
  }
}


// 有状态组件 VNode
const compVNode = h(ParentComponent)

render(compVNode, document.getElementById('container'))
// setTimeout(() => {
//     render(nextVNode, container)
// }, 2000);