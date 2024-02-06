- [x] 全局处理请求拦截、错误
- [x] 可实例化多个请求，在同一项目中有多个个性化请求封装
- [x] 可针对单个请求拦截单独处理
- [x] 取消重复请求
- [x] 接口失败重试
- [x] 手动取消请求
- [x] 封装 loading
- [ ] try catch 处理

## 栗子

```js
import Http from './index';

const http = new Http({
  baseURL: '',
  timeout: 10000,
  withCredentials: true,
  interceptors: {
    requestInterceptor(config) {
      console.log('局部【请求】拦截器');
      return config;
    },
    requestInterceptorsCatch(err) {
      return Promise.reject(err);
    },
    responseInterceptor(response) {
      console.log('局部【响应】拦截器', response);
      // ...  提示处理
      return response; // 会将结果返回给下一个拦截器，应该返回response，而不是response.data
    },
    responseInterceptorCatch(err) {
      return Promise.reject(err);
    }
  }
});

export const testActivityInfo = () => {
  const config = {
    method: 'get',
    url: '/activity/v1/info',
    retryTimes: 2, // 重试2次 , 默认为0 不重试，设置不为0则开启请求重试
    retryDelay: 1000 // 每次重试延迟时间，默认为0
  };
  const api = http.request(config);
  return {
    api,
    abort: () => api.abort(config)
  };
};

testActivityInfo.http();
testActivityInfo.abort(); //取消
```
