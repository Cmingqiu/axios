import { $Dialog } from '@/components/Dialog';
const domMap = new WeakMap();

export function useAxiosLoading() {
  const setLoading = config => {
    const { loadingDom } = config;
    if (!loadingDom) return;
    const record = domMap.get(loadingDom);
    if (record) {
      record.count++;
    } else {
      const instance = $Dialog(loadingDom);
      domMap.set(loadingDom, { count: 1, instance });
    }
  };

  const delLoading = config => {
    const { loadingDom = undefined } = config || {};
    if (!loadingDom) return;
    const record = domMap.get(loadingDom);
    if (--record.count === 0) {
      record.instance.unmount();
      // loadingDom.removeChild(record.instance.$el);
      domMap.delete(loadingDom);
    }
  };

  return {
    setLoading,
    delLoading
  };
}
