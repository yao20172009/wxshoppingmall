// pages/myOrder/myOrder.js
var app = getApp()
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const { OrdersComment } = require('../../models/order/queryOrders.js')
const moment = require('../../utils/moment.js')
moment.locale('zh-cn');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    carts: [],
    orders: [],
    scrollTop: 0,
    theEnd: false, //用于判断加载更多数据是 没有了
    first: 10,
    after: "",
    menuBox: {
      active: false,
    },
  },

  openMenu: function () {
    var menuBox = this.data.menuBox
    if (menuBox.active == false) {
      this.setData({
        menuBox: {
          active: true
        }
      })
    } else {
      this.setData({
        menuBox: {
          active: false
        }
      })
    }
    console.log(this.data.menuBox)
  },

  colseMenu: function () {
    if (this.data.menuBox.active == false) {
      return
    }
    this.setData({
      menuBox: {
        active: false,
      }
    })
  },

  goUrls: function (e) {
    console.log(e.currentTarget.dataset.index)
    var index = e.currentTarget.dataset.index
    if (index == "1" || index == "2" || index == "3") {
      let userInfo = wx.getStorageSync('userInfo')
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
        return
      }
    }
    if (index == "1") {
      wx.navigateTo({
        url: '/pages/cart/index',
      })
    } else if (index == "2") {
      wx.navigateTo({
        url: '/pages/order/order',
      })
    } else if (index == "3") {
      wx.navigateTo({
        url: '/pages/my/feedback/feedback',
      })
    } else if (index == "4") {
      wx.switchTab({
        url: '/pages/my/index',
      })
    } else if (index == "5") {
      wx.switchTab({
        url: '/pages/index/index',
      })
    } else if (index == "6") {
      wx.switchTab({
        url: '/pages/eachEvent/eachEvent',
      })
    }
    this.setData({
      menuBox: {
        active: false,
      }
    })
  },

  goToCartPage: function () {
    wx.navigateTo({
      url: '/pages/cart/index',
    })
  },

  goTop: function (e) {
    if (wx.pageScrollTo) {
      wx.pageScrollTo({
        scrollTop: 0
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getOrders()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  toIndexPage: function () {
    wx.switchTab({
      url: "/pages/index/index"
    });
  },

  onShow: function () {
    wx.hideToast()
    // this.setData({
    //   shops: app.globalData.shops.shops
    // })
    // this.goTop()
    console.log(app.globalData.updataEvent)
    if (app.globalData.updataEvent == true) {
      this.getOrders()
    }
  },

  // 获取订单列表
  getOrders: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var first = that.data.first
    let after = ''
    let status = "finished"
    let rated = false
    gql({
      body: OrdersComment(first, after,status, rated),
      success: res => {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        var orders = res.data.data.viewer.orders.edges
        // console.log(orders)
        // this.setData({
        //   orders:res.data.data.viewer.orders.edges
        // })
        var itemNum = 0
        var giftNum = 0
        for (var i = 0; i < orders.length; i++) {
          orders[i].itemNum = itemNum
          orders[i].giftNum = giftNum
          for (var j = 0; j < orders[i].node.items.length; j++) {
            orders[i].node.createdAt = moment(orders[i].node.createdAt).format('YYYY-MM-DD HH:mm:ss')
            orders[i].itemNum += orders[i].node.items[j].quantity - 0
          }
          for (var k = 0; k < orders[i].node.gifts.length; k++) {
            if (orders[i].node.gifts.length !== 0) {
              orders[i].giftNum += orders[i].node.gifts[k].quantity - 0
            }
          }
        }

        this.setData({
          orders: orders,
          after: res.data.data.viewer.orders.pageInfo.endCursor
        })
        console.log(this.data.orders)
      },
      fail: res => {
      }
    });
  },

  getMoreOrder: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });

    if (that.data.after == "") {
      that.setData({
        theEnd: true,
      })
      return
    }
    let status = "finished"
    let rated = false
    gql({
      body: OrdersComment(that.data.first, that.data.after, status, rated),　//　ｂｏｄｙ == 数据结构　　
      success: function (res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        var after = res.data.data.viewer.orders.pageInfo.endCursor
        that.setData({
          after: after
        })
        if (after !== "") {
          var moreOrders = res.data.data.viewer.orders.edges //数据结构
          var orders = that.data.orders
          var itemNum = 0
          var giftNum = 0
          for (var i = 0; i < moreOrders.length; i++) {
            moreOrders[i].itemNum = itemNum
            moreOrders[i].giftNum = giftNum
            for (var j = 0; j < moreOrders[i].node.items.length; j++) {
              moreOrders[i].itemNum += moreOrders[i].node.items[j].quantity - 0
            }
            for (var k = 0; k < moreOrders[i].node.gifts.length; k++) {
              if (moreOrders[i].node.gifts.length !== 0) {
                moreOrders[i].giftNum += moreOrders[i].node.gifts[k].quantity - 0
              }
            }
          }

          moreOrders.forEach((item) => {
            orders.push(item)
          })
          that.setData({
            orders: orders
          })
        }
        //total服务端的返回的总共页数
      },
      fail: function (res) { }
    });
  },

  goToDetail: function (e) {
    console.log("去评价")
    // return
    var id = e.currentTarget.dataset.id
    var url = "/pages/orderEvaluation/evaluation/evaluation?id=" + encodeURIComponent(id)
    wx.navigateTo({
      url: url
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    app.globalData.updataEvent = null
    this.setData({
      menuBox: {
        active: false,
      },
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    app.globalData.updataEvent == null
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
    this.getMoreOrder()
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // }
})