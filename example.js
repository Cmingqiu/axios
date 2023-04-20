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
    retryTimes: 1, // 重试1次
    delay: 1000
  };
  const api = http.request(config);
  return {
    api,
    abort: () => api.abort(config)
  };
};

testActivityInfo.http();
testActivityInfo.abort(); //取消
