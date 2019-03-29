// pages/authorize/index.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //判断小程序的API，回调，参数，组件等是否在当前版本可用。
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  bindGetUserInfo: function (e) {
    if (!e.detail.userInfo) {
      return;
    }
    console.log(e)
    wx.setStorageSync('userInfo', e.detail.userInfo)
    // wx.setStorageSync('encryptedData', e.detail.encryptedData)
    this.login(e.detail.userInfo, e.detail.encryptedData, e.detail.iv);
  },
  login: function (userInfo, encryptedData, iv) {
    let that = this;
    // 登录
    // console.log(nickName,encryptedData,iv)
    // return
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        var code = res.code;
        if (code) {
          wx.setStorage({
            key: "code",
            data: res.code
          })
          console.log('获取用户登录凭证code：' + code);
          // --------- 发送凭证 ------------------
          wx.request({
            url: 'https://api.jiejie.io/wxserver/openid',
            data: { code: code },
            success: function (res) {
              // console.log(res)
              if (res.data.reply.errcode == 10000) {
                // 去注册
                that.registerUser();
                return;
              }
              if (res.data.reply.errcode != 0) {
                // 登录错误
                wx.hideLoading();
                wx.showModal({
                  title: '提示',
                  content: '无法登录，请重试',
                  showCancel: false
                })
                return;
              }
              wx.setStorageSync('token', res.data.reply.token)
              wx.setStorageSync('openid', res.data.reply.openid)
              app.globalData.openid = res.data.reply.openid
              app.globalData.token = res.data.reply.token
              if (res.data.reply.token) {
                // wx.setStorage({
                //   key: "openid",
                //   data: res.data.reply.openid
                // });
                // console.log(res.data.reply.openid)
                setTimeout(() => {
                  wx.request({
                    url: 'https://api.jiejie.io/wxserver/bind_user',
                    data: {
                      token: res.data.reply.token,
                      userInfo: JSON.stringify(userInfo),
                      encryptedData: encryptedData,
                      iv: iv,
                      // sessionKey: res.data.reply.session_key
                    },
                    success: res => {
                      // console.log(res.data.reply.openid)
                      // console.log("发送 bind_user")
                      // console.log(nickName)
                    }
                  })
                }, 100)
              }

              // if (this.openidReadyCallback) {
              //   this.openidReadyCallback(res)
              // }
              // 回到原来的地方放
              app.globalData.updataEvent = true
              wx.showLoading({
                title: '获取成功',
                success: res => {
                  setTimeout(() => {
                    wx.navigateBack();
                  }, 500)
                }
              })
            },
          })
          // ------------------------------------
        } else {
          // console.log('获取用户登录态失败：' + res.errMsg);
        }
      }
    })
  },

  registerUser: function () {
    var that = this;
    wx.login({
      success: function (res) {
        var code = res.code; // 微信登录接口返回的 code 参数，下面注册接口需要用到
        wx.getUserInfo({
          success: function (res) {
            var iv = res.iv;
            var encryptedData = res.encryptedData;
            // 下面开始调用注册接口
            console.log(res)
          }
        })
      }
    })
  },
})