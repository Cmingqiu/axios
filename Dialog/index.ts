/* 使用createApp实例化组件 */

import { createApp, createVNode, render } from 'vue';
import Dialog from './index.vue';

export function $Dialog(el: HTMLElement, options?: any) {
  const app = createApp(Dialog, options);
  const instance = app.mount(document.createElement('div')) as InstanceType<
    typeof Dialog
  >;
  el.style.transform = el.style.transform || `translate(0)`;
  el.appendChild(instance.$el);
  instance.show();
  return app; // instance;
}

/* export function $Dialog(option?: any) {
  const vnode = createVNode(Dialog, option);
  const el = document.createElement('div');
  document.body.appendChild((render(vnode, el), el));
  vnode.component?.exposed?.show();
  console.log(vnode);
} */
