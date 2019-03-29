//index.js
//获取应用实例
var app = getApp()
const util = require('../../../utils/util.js')
const api = require('../../../config/api.js')
const client = require('../../../utils/graphql.js')
const { Address } = require('../../../models/address/address.js')

Page({
  data: {
    addressList: [],
    selectedAddress: {}
  },

  selectTap: util.throttle(function (e) {
    let that = this;
    let id = e.currentTarget.dataset.id;
    let index = parseInt(e.currentTarget.dataset.index);
    let addressList = that.data.addressList;

    for (let i = 0; i < addressList.length; i++) {
      if (i === index) {
        addressList[i].selected = true;
        wx.setStorage({
          key: 'selectedAddress',
          data: addressList[i]
        })
      } else {
        addressList[i].selected = false;
      }
    }

    that.setData({
      addressList: addressList
    });
    that.setStorage_addressList();
    wx.navigateBack({
      delta: 0,
      success: function(res){
        // success
      },
    })
  }, 1000),

  addAddess: function () {
    wx.navigateTo({
      url: "/pages/address/add/add"
    })
  },

  editAddess: function (e) {
    let objectId = e.currentTarget.dataset.id;
    let index = e.currentTarget.dataset.index;
		wx.navigateTo({
			url: '/pages/address/add/add?index=' + index + "&active=edit" + "&objectId=" + encodeURIComponent(objectId)
		});
  },

  onLoad: function () {
    let that = this;
    //从Page/cart购物车获取用户选择的地址
    wx.getStorage({
      key: 'selectedAddress',
      success: function (res) {
        that.setData({
          selectedAddress: res.data
        })
      }
    })
  },

  onShow: function () {
    this.initShippingAddress();
    //从Page/cart购物车获取用户选择的地址
    // wx.getStorage({
    //   key: 'selectedAddress',
    //   success:  (res) =>{
    //     console.log(res)
    //     this.setData({
    //       selectedAddress: res.data
    //     })
    //   }
    // })
  },

  initShippingAddress: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: Address,
      success: function (res) {
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        // return
        let addresses = res.data.data.viewer.addresses;
        // addresses = null
        if (addresses == null) return;
        if (addresses.length == 0) return;
        console.log(1)
        for (let i = 0; i < addresses.length; i++) {
          if (addresses[i].id == that.data.selectedAddress.id) {
            addresses[i].selected = true;
          } else {
            addresses[i].selected = false;
          }
          
        }
        that.setData({
          addressList: res.data.data.viewer.addresses
        })
        that.setStorage_addressList()
      },
      fail: function (res) {
      }
    });
  },

  // 更新地址缓存
  setStorage_addressList:function(){
    var addressList = wx.getStorageSync('addressList') || [];
    addressList = this.data.addressList
    try {
      wx.setStorageSync('addressList', addressList)
    } catch (e) {
      console.log(e)
    }
    // console.log(this.data.addressList)
  },
})
