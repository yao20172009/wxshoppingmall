const { Base64 } = require('./base64');
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatTimeDay = t => {
  const time = new Date(t);
  // const year = time.getFullYear();
  const month = time.getMonth() + 1;
  const day = time.getDate();
  const hours = time.getHours();
  const minutes = time.getMinutes();
  // const seconds = time.getSeconds();

  return `${month}月${day}日${hours}时${minutes}分`;
}

const statusDescs = (status, flag) => {
  switch (status) {
    case 'waiting':
    case 'wait': {
      if (flag) return '距离活动开始还有';
      return '请等待';
    }
    case 'started': {
      if (flag) return '距离活动结束还有';
      return '马上抢购';
    }
    case 'end': return '活动已结束';
    // case 'timing': return <Loading color="#FFF" size= "11px" margin= "4px" />;
    case 'suspend': return '已售罄';
    case 'pending': return '领取奖励';
    case 'success': return '成功'; // 只有grab 的时候在alert 里会用到
    case 'always': return '已经抢过其他商品';
    case 'created': return '已经领取奖励';
    case 'insufficient': return '已售罄';
    case 'total_amount_zero': return '已售罄';
    case 'no-executies': return '没有机会';
    case 'lack-multi-item': return '没有机会';
    case 'state-invalid': return '活动未开始/已结束';
    // default: return <Loading color="#FFF" size= "11px" margin= "4px" />;
  }
}

const getStatus = (item) => {
  const { td, status, grabs, end_at, start_at, total_amount } = item;
  const now = Date.now() + td;

  if (grabs && grabs.length) {
    const pending = grabs.find(grab => grab.status == 'pending');
    const created = grabs.find(grab => grab.status == 'created');

    if (pending) return 'pending';
    if (created) return 'created';

    return grabs[0].status;
  }

  if (total_amount < 1) return 'suspend';
  if (status == 'waiting' || status == 'wait' || status == 'started' || status == 'timing') {
    if (now < start_at) {
      return 'wait';
    } else if (now > end_at) {
      return 'end';
    }
    return 'started';
  }
  return status;
}


const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const defaultSettings = {
  codec: 'mp3',
  recordMode: 'holding'
}

const loadSettings = () => {
  var setting = defaultSettings
  try {
    setting = wx.getStorageSync('settings')
    if (typeof setting === 'string') {
      setting = JSON.parse(setting)
    } else if (typeof setting !== 'object') {
      setting = defaultSettings
    }
  } catch (e) {
    setting = defaultSettings
  }
  return setting
}

const getSetting = key => {
  let settings = loadSettings()
  return settings[key]
}

const setSetting = (key, value) => {
  let settings = loadSettings()
  settings[key] = value

  try {
    wx.setStorageSync('settings', settings)
    console.log('set settings', settings)
    syncGlobalSetting(settings)
  } catch (e) {
  }
}

const syncGlobalSetting = settings => {
  let app = getApp()
  app.globalData.settings = settings
}

const sitePath = (path) => {
  let app = getApp()
  return app.globalData.website + "/" + path;
}

const socketPath = (openid) => {
  let app = getApp()
  return app.globalData.wssite + "?openid=" + openid;
}

const btoa = (raw) => {
  return Base64.encode(raw)
}


function throttle(fn, gapTime) {
  if (gapTime == null || gapTime == undefined) {
    gapTime = 1500
  }

  let _lastTime = null

  // 返回新的函数
  return function () {
    let _nowTime = + new Date()
    if (_nowTime - _lastTime > gapTime || !_lastTime) {
      fn.apply(this, arguments)   //将this和参数传给原函数
      _lastTime = _nowTime
    }
  }
}

/*获取当前页带参数的url*/
// function getCurrentPageUrlWithArgs() {
//   var pages = getCurrentPages()    //获取加载的页面
//   var currentPage = pages[pages.length - 1]    //获取当前页面的对象
//   var url = currentPage.route    //当前页面url
//   var options = currentPage.options    //如果要获取url中所带的参数可以查看options

//   //拼接url的参数
//   var urlWithArgs = url + '?'
//   for (var key in options) {
//     var value = options[key]
//     urlWithArgs += key + '=' + value + '&'
//   }
//   urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1)

//   return urlWithArgs
// }

function selectedShopDetail(shopId) {
  var app = getApp();
  for (var i = 0; i < app.globalData.shops.length; ++i) {
    if (app.globalData.shops[i].id == shopId) {
      return app.globalData.shops[i]
    }
  }
  return null;
}
function isEmptyObject(obj) {
  if ((typeof obj === "object" && !(obj instanceof Array)) || ((obj instanceof Array) && obj.length <= 0)) {
    var isEmpty = true;
    for (var prop in obj) {
      isEmpty = false;
      break;
    }
    return isEmpty;
  }
  return false;
}

function filterEmptyObject(list) {
  var cartList = [];
  for (var index in list) {
    if (!this.isEmptyObject(list[index])) {
      cartList.push(list[index])
    }
  }
  return cartList;
}

function showLoading(){
  wx.showLoading({
    title: '加载中',
  })
}

function hideLoading(){
  wx.hideLoading()
}


/**
 * 格式化时间
 * @param  {Datetime} source 时间对象
 * @param  {String} format 格式
 * @return {String}        格式化过后的时间
 */
function formatDate(source, format) {
  var o = {
    'M+': source.getMonth() + 1, // 月份
    'd+': source.getDate(), // 日
    'H+': source.getHours(), // 小时
    'm+': source.getMinutes(), // 分
    's+': source.getSeconds(), // 秒
    'q+': Math.floor((source.getMonth() + 3) / 3), // 季度
    'f+': source.getMilliseconds() // 毫秒
  };
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (source.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
    }
  }
  return format;
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}



module.exports = {
  formatTime: formatTime,
  formatTimeDay: formatTimeDay,
  // statusDescs: statusDescs,
  // getStatus: getStatus,
  loadSettings,
  getSetting,
  setSetting,
  sitePath,
  btoa,
  socketPath,
  throttle: throttle,//点击 防止多次跳转
  // getCurrentPageUrl: getCurrentPageUrl,
  // getCurrentPageUrlWithArgs: getCurrentPageUrlWithArgs,
  selectedShopDetail: selectedShopDetail,
  isEmptyObject: isEmptyObject,
  filterEmptyObject: filterEmptyObject,
  showLoading: showLoading,
  hideLoading: hideLoading,
  formatDate: formatDate,
  mergeDeep: mergeDeep
}

