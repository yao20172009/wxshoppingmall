const app = getApp()
const util = require('../../utils/util.js')
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const { GetMemberList } = require('../../models/supplier.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    first:10,
    after:"",
    items:[],
    theEnd: false,
  },

  goToCards:function(e){
    let item =  e.currentTarget.dataset.item
    let id = item.supplier.id
    // app.globalData.shopMember = item
    wx.navigateTo({
      url: '/pages/shopCards/shopCards?id=' + encodeURIComponent(id),
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getMemberList()
  },
  //获得会员列表
  getMemberList:function(){
    let that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    gql({
      body: GetMemberList(first,after),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        // console.log(res)
        let items = res.data.data.viewer.members.edges
        items.forEach((item)=>{
          if (item.node.supplier.exchangeableCards.edges.length !==0){
            item.node.haveCard = true
          }else {
            item.node.haveCard = false
          }
        })
        // console.log(items)
        that.setData({
          items: items,
          after: res.data.data.viewer.members.pageInfo.endCursor
        })
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },

  getMoreMemberLists: function () {
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
    let first = that.data.first
    let after = that.data.after
    gql({
      body: GetMemberList(first, after),
      //Bｏｄｙ == 数据结构　　
      success: function (res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        // return
        var after = res.data.data.viewer.members.pageInfo.endCursor
        that.setData({
          after: after
        })
        if (after !== "") {
          let itemsAfter = res.data.data.viewer.members.edges
          itemsAfter.forEach((item) => {
            if (item.node.supplier.exchangeableCards.edges.length !== 0) {
              item.node.haveCard = true
            } else {
              item.node.haveCard = false
            }
          })
          var items = that.data.items
          itemsAfter.forEach((item) => {
            items.push(item)
          })
          that.setData({
            items: items
          })
        }
        //total服务端的返回的总共页数
      },
      fail: function (res) { }
    });
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
    // console.log(app.globalData.updataEvent)
    if (app.globalData.updataEvent == true) {
      this.getMemberList()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    app.globalData.updataEvent == null
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
    console.log(1)
    this.getMoreMemberLists()
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {
  
  // }
})