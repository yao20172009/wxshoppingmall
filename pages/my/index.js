const {
  GetShareInfo,
  GetShareToken
} = require('../../utils/share.js')

const app = getApp()

Page({
  data: {
    balance: 0,
    freeze: 0,
    score: 0,
    score_sign_continuous: 0,
    aaa: false,
    orderItems: [
      {
        typeId: 0,
        name: '全部',
        url: '/pages/order/order',
        imageurl: '../../images/order-details/allOrder.png',
      },
      {
        typeId: 1,
        name: '待评价',
        url: '/pages/orderEvaluation/orderEvaluation',
        imageurl: '../../images/order-details/daiPingjia.png',
      },
    ],
  },

  toOrder:function(e){
    let active = this.yanzheng(1)
    if (active == true) return
    let url = e.currentTarget.dataset.url
    console.log(url)
    wx.navigateTo({
      url: url,
    })
  },

  yanzheng: function(index) {
    var userInfo = this.data.userInfo
    if (!userInfo) {
      wx.showModal({
        title: '登录提示',
        content: '需要登录以后才可以进行操作',
        cancelText: "取消",
        confirmText: "登录",
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定')
            wx.navigateTo({
              url: "/pages/authorize/index"
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
      return true
    }
  },

  bindGoTo1: function() {
    this.yanzheng(1)
  },

  // 开启分享
  openShare: function() {
    wx.showShareMenu({
      withShareTicket: true,
    })
  },

  onLoad(options) {
    this.openShare()
    if (options.t) {
      let t = decodeURIComponent(options.t)
      if (app.globalData.scene == 1044) {
        if (app.globalData.shareTicket) {
          GetShareInfo(t)
        }
      }
    }

  },
  onShow() {
    let that = this;
    let userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      that.setData({
        userInfo: null
      })
    } else {
      that.setData({
        userInfo: userInfo,
        version: app.globalData.version
      })
    }
  },
  aboutUs: function() {
    wx.navigateTo({
      url: '/pages/systemSetupPage/aboutUsPage/aboutUsPage'
    });
  },
  getPhoneNumber: function(e) {
    if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
      wx.showModal({
        title: '提示',
        content: '无法获取手机号码',
        showCancel: false
      })
      return;
    }
    var that = this;
    wx.request({
      url: 'https://jiejie.io/',
      data: {
        token: wx.getStorageSync('token'),
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      },
      success: function(res) {
        if (res.data.code == 0) {
          wx.showToast({
            title: '绑定成功',
            icon: 'success',
            duration: 2000
          })
          that.getUserApiInfo();
        } else {
          wx.showModal({
            title: '提示',
            content: '绑定失败',
            showCancel: false
          })
        }
      }
    })
  },
  getUserApiInfo: function() {
    var that = this;
    wx.request({
      url: 'https://jiejie.io/',
      data: {
        token: wx.getStorageSync('token')
      },
      success: function(res) {
        if (res.data.code == 0) {
          that.setData({
            apiUserInfoMap: res.data.data,
            userMobile: res.data.data.base.mobile
          });
        }
      }
    })

  },

  relogin: function() {
    wx.navigateTo({
      url: "/pages/authorize/index"
    })
  },
  recharge: function() {
    wx.navigateTo({
      url: "/pages/recharge/index"
    })
  },
  withdraw: function() {
    wx.navigateTo({
      url: "/pages/withdraw/index"
    })
  },
  //    用户点击右上角分享  
  onShareAppMessage: function() {
    let that = this
    var supplierId = undefined
    var fromPage = that.route
    var toPage = that.route
    var token = app.globalData.UserId + new Date().getTime()
    GetShareToken(supplierId, fromPage, toPage, token).then((t) => {})
    return {
      title: that.data.userInfo !== null ? that.userInfo.nickName : "",
      path: '/pages/my/index?&areaId=' + app.globalData.areaId + '&t=' + encodeURIComponent(token)
    }
  }
})