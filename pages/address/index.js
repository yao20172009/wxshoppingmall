//index.js
//获取应用实例
var app = getApp()
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const { Address } = require('../../models/address/address.js')
const { UpdateAddress } = require('../../models/address/update.js')
const { DeleteAddress } = require('../../models/address/delete.js')

Page({
  data: {
    addressList: [],
    isShowToast: false,
    toastText: '',
  },

  add: function () {
    wx.navigateTo({
      url: "/pages/address/add/add"
    })
  },

  delete: function (e) {
    let that = this;
    let id = e.currentTarget.dataset.id;
    let index = parseInt(e.currentTarget.dataset.index);
    let addressList = that.data.addressList;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    wx.showModal({
      title: '提示',
      content: '确定要删除该收货地址吗？',
      success: function (res) {
        if (res.confirm) {
          let input = {
            clientMutationId: 0,
            id: id
          }
          gql({
            body: DeleteAddress(input),
            success: function (res) {
              if (res.data.errors) {
                that.setData({
                  isShowToast: true,
                  toastText: res.data.errors[0].message
                })
                setTimeout(function(){
                  that.setData({
                    isShowToast: false,
                  })
                },2000)
                return
              }
              if (res.data.data.deleteAddress.status == 'ok') {
                addressList.splice(index, 1);
                that.setData({
                  addressList: addressList
                })
                wx.showToast({
                  title: '删除成功',
                  icon: 'success',
                  duration: 1000
                });
                that.setStorage_addressList();
              } else {
                wx.showToast({
                  title: '请求不成功',
                  icon: 'fail',
                  duration: 1000
                });
              }
            },
            fail: function (res) {
            }
          });
        }
      }
    })
  },

  // 设置为默认地址
  setDefault: function (e) {
		let that = this;
    let id = e.currentTarget.dataset.id;
    let index = parseInt(e.currentTarget.dataset.index);
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let input = {
      clientMutationId: 0,
      default: true,
      id: id
    }
    if (that.data.addressList[index].default) return;

    gql({
      body: UpdateAddress(input),
      success: function (res) {
        let addressList = that.data.addressList
        let address = res.data.data.updateAddress.address
        var newAddress = []
        for (var i = 0; i < addressList.length; i++){
          if (addressList[i].default == true) {
            addressList[i].default = false
          }
          if (address.id == addressList[i].id) {
            addressList[i] = address
          }
        }
        that.setData({
          addressList: addressList
        })
        that.setStorage_addressList();
        wx.showToast({
  				title: '设置成功',
  				icon: 'success',
  				duration: 1000
  			});
      },
      fail: function (res) {
      }
    });
  },
  
  edit: function (e) {
    let objectId = e.currentTarget.dataset.id;
    let index = e.currentTarget.dataset.index;
		wx.navigateTo({
			url: '/pages/address/add/add?index=' + index + "&active=edit" + "&objectId=" + encodeURIComponent(objectId)
		});
	},

  onLoad: function () {
  },

  onShow: function () {
    this.initShippingAddress();
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
          // that.updataToken()
          return
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