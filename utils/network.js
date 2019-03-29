/**
 * 封封微信的的request
 */
function request(url, data = {}, method = "GET") {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: url,
      data: data,
      method: method,
      header: {
        'Content-Type': 'application/json',
        // 'X-JinHuoBao-Token': wx.getStorageSync('token')
      },
      success: function (res) {
        console.log(res)
        if (res.statusCode == 200) {
          if (res.data.errno == 401) {
            // 清除登录相关内容,目前还未做登录这块
            // try {
            //   wx.removeStorageSync('userInfo');
            //   wx.removeStorageSync('token');
            // } catch (e) {
            //   // Do something when catch error
            // }
            // 切换到登录页面
            // wx.navigateTo({
            //   url: '/pages/auth/login/login'
            // });
            resolve(res.data)
          } else {
            resolve(res.data);
          }
        } else {
          reject(res.errMsg);
        }

      },
      fail: function (err) {
        reject(err)
      }
    })
  });
}


module.exports = {
  request,
}