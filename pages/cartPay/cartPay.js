// pages/cartPay/cartPay.js
var app = getApp()
const api = require('../../config/api.js')
const util = require('../../utils/util.js')
const client = require('../../utils/graphql.js')
const moment = require('../../utils/moment.js')
moment.locale('zh-cn');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    orders: [],
    ordersNums: 0,
    ordersLength: 0,
    nums: 0,
    order: null,
    orderIndex: 0,
    payment: [{
      name: 'no-1',
      value: '货到付款',
      checked: true
    }, ],
    payValue: 'no-1',
  },

  radioChange(e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    this.setData({
      payValue: e.detail.value
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  Shangtiao: function() {
    let orders = this.data.orders
    let ordersLength = this.data.ordersLength
    let orderIndex = this.data.orderIndex
    let index = orderIndex - 1
    if (index <= ordersLength - 1) {
      this.setData({
        orderIndex: index,
        order: orders[index]
      })
      this.jianchaPayOrder(orders[index])
    }
  },

  Xiatiao: function() {
    let orders = this.data.orders
    let ordersLength = this.data.ordersLength
    let orderIndex = this.data.orderIndex
    let index = orderIndex + 1
    if (index <= ordersLength - 1) {
      this.setData({
        orderIndex: index,
        order: orders[index]
      })
      this.jianchaPayOrder(orders[index])
    }
  },

  onLoad: function(options) {
    let orders = app.globalData.payOrders
    console.log(orders)
    this.setData({
      orders: orders,
      ordersLength: orders.length,
      ordersNums: orders.length,
    })
    this.getOrder(orders[0])
  },

  getOrder: function(value) {
    let that = this
    var order = value
    console.log(order)
    if (!order) {
      wx.redirectTo({
        url: '/pages/order/order',
      })
      return
    }
    order.createdAt = moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss')
    this.setData({
      order: order,
      orderIndex: 0,
    })
    // 检查当前order是否支持威信支付
    that.jianchaPayOrder(order)
    that.updataNums(order)
  },

  jianchaPayOrder: function(value) {
    let order = value
    let payment = this.data.payment
    let newPayment = []
    if (order.weixinpayParams == null) {
      this.setData({
        payment: [payment[0]]
      })
    } else {
      let item = {
        name: 'no-2',
        value: '微信支付',
      }
      this.setData({
        payment: [payment[0], item]
      })
    }
  },

  updataNums: function(order) {
    var items = order.items
    var gifts = order.gifts
    var nums = order.nums,
      itemsNum = 0,
      giftsNum = 0
    if (gifts == "") {
      for (var i = 0; i < items.length; i++) {
        itemsNum += items[i].quantity
      }
      this.setData({
        nums: itemsNum
      })
      return
    } else {
      for (var i = 0; i < items.length; i++) {
        itemsNum += items[i].quantity
      }
      for (var i = 0; i < gifts.length; i++) {
        giftsNum += gifts[i].quantity
      }
      this.setData({
        nums: itemsNum + giftsNum
      })
    }
  },
  //货到付款 确认订单
  confirmOrder: util.throttle(function() {
    let orders = this.data.orders
    let order = this.data.order
    console.log(orders)
    console.log(order)
    wx.showLoading({
      title: '正在提交',
    })
    let newOrders = []
    orders.forEach((item) => {
      if (order.id !== item.id) {
        newOrders.push(item)
      }
    })
    this.setData({
      orders: newOrders,
      order: null,
      ordersLength: newOrders.length,
    })
    if (newOrders.length == 0) {
      wx.redirectTo({
        url: '/pages/order/order',
      })
      return
    }
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '提交成功',
      })
    }, 2000)
    setTimeout(() => {
      this.getOrder(newOrders[0])
    }, 3500)
  }, 2000),
  //微信付款
  gotoPay: util.throttle(function() {
    let that = this
    let weixinpayParams = this.data.order.weixinpayParams
    weixinpayParams = JSON.parse(weixinpayParams)
    that.weixinPay(weixinpayParams)
  }, 1500),
  //支付
  weixinPay: function(weixinpayParams) {
    let that = this
    wx.requestPayment({
      timeStamp: weixinpayParams.timeStamp,
      nonceStr: weixinpayParams.nonceStr,
      package: weixinpayParams.package,
      signType: weixinpayParams.signType,
      paySign: weixinpayParams.paySign,
      success(res) {
        wx.showToast({
          title: '支付成功',
        })
        //然后 用  confirmOrderWXPay 这个api
        console.log("pay success")
        console.log(res)
        that.jiancheOrders()
        // wx.redirectTo({
        //   url: '/pages/order/order',
        // })
      },
      fail(res) {
        wx.showToast({
          title: '支付失败',
        })
        console.log("pay fail")
        console.log(res)
      }
    })
  },

  // 检查剩余orders
  jiancheOrders: function() {
    console.log(111)
    let orders = this.data.orders
    let order = this.data.order
    console.log(orders)
    console.log(order)
    let newOrders = []
    orders.forEach((item) => {
      if (order.id !== item.id) {
        newOrders.push(item)
      }
    })
    this.setData({
      orders: newOrders,
      ordersLength: newOrders.length,
    })
    if (newOrders.length == 0) {
      wx.redirectTo({
        url: '/pages/order/order',
      })
      return
    }
    setTimeout(() => {
      wx.showToast({
        title: '下一个订单',
      })
      this.getOrder(newOrders[0])
    }, 2000)
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // this.hide()
  },

  hide: function() {
    var vm = this
    var interval = setInterval(function() {
      if (vm.data.winH > 0) {
        //清除interval 如果不清除interval会一直往上加
        clearInterval(interval)
        vm.setData({
          winH: vm.data.winH - 5,
          opacity: vm.data.winH / winHeight
        })
        vm.hide()
      }
    }, 10);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})