import axios from 'axios';
import qs from 'qs';
import { useAxiosLoading } from './useAxiosLoading';

// 拦截器顺序（洋葱模型）： 局部请求拦截器 -> 全局请求拦截器-> 局部响应拦截器-> 全局响应拦截器

// 进行中的请求缓存下来
const pendingRequest = new Map();

const RETRY_CONFIG = {
  retryTimes: 0, // 默认为0 不重试，设置不为0则开启请求重试
  delay: 2000 // 请求重试的延迟时间
};

const { setLoading, delLoading } = useAxiosLoading();

class Http {
  #requestTimes = 0; // 重试请求次数
  service = null; // axios实例
  interceptorObj = null; // 局部拦截器对象
  constructor(config) {
    config = { ...RETRY_CONFIG, ...config };
    this.service = axios.create(config);
    this.interceptorObj = config.interceptors;

    // 全局请求拦截器
    this.service.interceptors.request.use(
      config => {
        setLoading(config);
        const t = Date.parse(String(new Date()));
        // 添加时间戳，防止缓存，重复请求取消功能失效
        // 判断get请求
        if (/get/i.test(config.method)) {
          (config.params = config.params || {}).t = t;
        } else if (/post/i.test(config.method)) {
          (config.data = config.data || {}).t = t;
        }

        removePendingReq(config);
        addPendingReq(config);
        return config;
      },
      err => Promise.reject(err)
    );
    // 局部请求拦截器  会将结果返回给下一个拦截器
    this.service.interceptors.request.use(
      this.interceptorObj?.requestInterceptor,
      this.interceptorObj?.requestInterceptorCatch
    );

    // 局部响应拦截器  会将结果返回给下一个拦截器
    this.service.interceptors.response.use(
      this.interceptorObj?.responseInterceptor,
      this.interceptorObj?.responseInterceptorCatch
    );
    // 全局响应拦截器
    this.service.interceptors.response.use(
      response => {
        const config = response.config;
        delLoading(config);
        removePendingReq(config);
        return response.data;
      },
      err => {
        const { config, response } = err;
        const status = response?.status;
        // 提示报错信息
        // alert(`${httpErrorStatusCode(status)}`);
        delLoading(config);
        removePendingReq(config);
        // 失败重试调用
        this.handleRetry(config);
        return Promise.reject(err);
      }
    );
  }

  request(config) {
    return new Promise((resolve, reject) => {
      // 单个http的请求拦截器
      if (config?.interceptors?.requestInterceptor) {
        config = config.interceptors.requestInterceptor(config);
      }
      this.service(config)
        .then(res => {
          // 单个http的响应拦截器
          if (config?.interceptors?.responseInterceptor) {
            res = config.interceptors.responseInterceptor(res);
          }
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  // 取消单个或所有请求
  abort(config) {
    config ? removePendingReq(config) : removeAllPendingReq();
  }

  /**
   * 请求失败重试方式一 （方式二：adapter适配器）
   * @param config AxiosConfig
   * @returns Promise<AxiosResponse<any, any>> | undefined
   */
  handleRetry(config) {
    if (config.retryTimes && this.#requestTimes < config.retryTimes) {
      this.#requestTimes++;
      return sleep(config.delay).then(() => this.service(config));
    }
  }
}

/**
 * 处理异常状态码
 * @param {*} code
 */
function httpErrorStatusCode(code) {
  let errMessage = '未知错误';
  switch (code) {
    case 400:
      errMessage = '错误的请求';
      break;
    case 401:
      errMessage = '未授权，请重新登录';
      break;
    case 403:
      errMessage = '拒绝访问';
      break;
    case 404:
      errMessage = '请求错误,未找到该资源';
      break;
    case 405:
      errMessage = '请求方法未允许';
      break;
    case 408:
      errMessage = '请求超时';
      break;
    case 500:
      errMessage = '服务器端出错';
      break;
    case 501:
      errMessage = '网络未实现';
      break;
    case 502:
      errMessage = '网络错误';
      break;
    case 503:
      errMessage = '服务不可用';
      break;
    case 504:
      errMessage = '网络超时';
      break;
    case 505:
      errMessage = 'http版本不支持该请求';
      break;
    default:
      errMessage = `其他连接错误 --${code}`;
  }
  return errMessage;
}

/**
 * 根据method、url、params、data生成key
 * @param {*} config
 * @returns
 */
function generateReqKey(config) {
  const { method, url, params, data } = config;
  return [method, url, qs.stringify(params), qs.stringify(data)].join('&');
}

/**
 * 新增
 * @param {*} config
 */
function addPendingReq(config) {
  const controller = new AbortController();
  const reqKey = generateReqKey(config);
  config.signal = controller.signal;
  if (!pendingRequest.has(reqKey)) {
    pendingRequest.set(reqKey, controller);
  }
}

/**
 * 取消请求并移除
 * @param {*} config
 */
function removePendingReq(config) {
  const reqKey = generateReqKey(config);
  const controller = pendingRequest.get(reqKey);
  if (controller) {
    controller.abort();
    pendingRequest.delete(reqKey);
  }
}

/**
 * 取消所有请求
 */
function removeAllPendingReq() {
  pendingRequest.forEach(controller => controller.abort());
  pendingRequest.clear();
}

/**
 * 延迟方法
 * @param {number} time
 * @returns {Promise<boolean>}
 */
function sleep(time) {
  return new Promise(resolve => {
    setTimeout(() => resolve(true), time);
  });
}

export default Http;
