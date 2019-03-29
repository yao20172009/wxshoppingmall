//封装graphql

const GraphQL = function(obj) {
  if (!obj.url) {
    throw "请提供GraphQL请求URL(.url)"
  }
  return function (_obj) {
    if (!_obj.body) {
      throw "请提供GraphQL请求body"
		}
		// return network.request(obj.url, JSON.stringify(_obj.body), 'POST')
    return wx.request({
      url: obj.url,
      method: 'POST',
      data: JSON.stringify(_obj.body),
      success: _obj.success,
      fail: _obj.fail,
      header: _obj.header,
      complete: _obj.complete
    })
  }
}

// 封装请求 401 未识别用户信息错误返回
const ErrMsg = function (statusCode){
    wx.navigateTo({
      url: "/pages/authorize/index"
    })
}

module.exports = {
  GraphQL,
  ErrMsg
};