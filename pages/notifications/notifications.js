// pages/notifications/notifications.js
const app = getApp()
const util = require('../../utils/util.js')
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const {
  Notifications
} = require('../../models/notifications/notifications.js')
const {
  ReadNotification,
  ReadAllNotifications,
  // DeleteNotification
} = require('../../models/notifications/readNotification.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    first: 10,
    after: "",
    items: [],
    theEnd: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getNotices()
  },


  getNotices: function () {
    let that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    // let read = true
    gql({
      body: Notifications(first, after),
      success: (res) => {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        let items = res.data.data.notifications.edges
        that.setData({
          items: items,
          after: res.data.data.notifications.pageInfo.endCursor
        })
      },
      fail: (res) => { },
    })
  },

  getMoreMessages: function () {
    let that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = that.data.after
    if (after == "") {
      that.setData({
        theEnd: true,
      })
      return
    }
    // let read = true
    gql({
      body: Notifications(first, after),
      success: (res) => {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        let moreItems = res.data.data.notifications.edges
        let items = that.data.items
        if (moreItems.length !== 0) {
          moreItems.forEach((moreItem) => {
            items.push(moreItem)
          })
        }
        that.setData({
          items: items,
          after: res.data.data.notifications.pageInfo.endCursor
        })
      },
      fail: (res) => { },
    })
  },
  // 已读单个
  readItem: function (e) {
    let that = this
    if (e.currentTarget.dataset.read == true) {
      return
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let id = e.currentTarget.dataset.id
    let input = {
      id: id,
      clientMutationId: 0
    }
    gql({
      body: ReadNotification(input),
      success: (res) => {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        // console.log(id)
        let items = that.data.items
        items.forEach((item) => {
          if (item.node.id == id) {
            item.node.read = true
          }
        })
        that.setData({
          items: items
        })
      }
    })
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
    this.getMoreMessages()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})