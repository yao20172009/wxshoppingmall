// pages/wxComment/wxComment.js
var app = getApp()
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const { QueryRates } = require('../../models/category/rates.js')
const moment = require('../../utils/moment.js')
moment.locale('zh-cn');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    stars: [0, 1, 2, 3, 4],
    normalSrc: '../../images/order-details/start_no.png',
    selectedSrc: '../../images/order-details/start_yes.png',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.getRates()
  },

  getRates:function(){
    // QueryRates
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = that.data.after
    let ratableId = that.data.ratableId
    gql({
      body: QueryRates(ratableId, first, after),
      success: res => {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        let rates = res.data.data.rates.edges
        console.log(rates)
        rates.forEach((item)=>{
          item.node.comment.time = moment(item.node.comment.updatedAt, "YYYYMMDD").fromNow(); // 6 年前
        })
        this.setData({
          rates: rates,
          after: res.data.data.rates.pageInfo.endCursor
        })
        // console.log(this.data.after)
      },
      fail: res => {
      }
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
  
  }
})