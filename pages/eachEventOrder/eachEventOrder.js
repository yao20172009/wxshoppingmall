var app = getApp()
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const {
  formatTimeDay,
  throttle
} = require('../../utils/util.js')
const {
  CreateOrder
} = require('../../models/event/createOrder.js')
const {
  DefaultAddress
} = require('../../models/address/defaultAddress.js')
const {
  AvailableCardsItems
} = require('../../models/cart.js')
const moment = require('../../utils/moment.js')
moment.locale('zh-cn');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    defaultAddress: null,
    order: null,
    note: "",
    noteUpdata: "", //修改
    ifName: true, //默认隐藏
    cardLists: {
      active: "use",
      cartGroupId: "",
      cards: [],
    },
  },

  openBeizhu: function() {
    //打开
    this.setData({
      ifName: false,
      noteUpdata: this.data.note,
    })
  },

  closeBeizhu: function() {
    // 隐藏
    this.setData({
      ifName: true,
    })
  },

  setValue: function(e) {
    this.setData({
      noteUpdata: e.detail.value
    })
  },
  //确定   备注
  confirm: function() {
    this.setData({
      note: this.data.noteUpdata,
      ifName: true,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var order = app.globalData.activeOrder
    if (order.gift !== null) {
      order.giftNum = Math.floor(order.quantity / order.num) * order.gift.quantity
    }
    order.total = order.price * order.quantity
    order.leastCost = 0 //优惠卷减钱
    order.card = null
    this.setData({
      order: order
    })
    console.log(order)
    let productId = order.id
    let quantity = order.quantity
    let unit = order.unit
    this.openCard(productId, quantity, unit)
  },

  // 创建订单
  createOrder: throttle(function(e) {
    let that = this;
    if (this.data.defaultAddress == null) {
      wx.showModal({
        title: '请选择地址',
        content: '您还未选择地址',
        confirmText: "去选择",
        success(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/address/select/select',
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
      return
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var item = that.data.order
    var items = [{
      productId: item.id,
      quantity: item.quantity,
      unit: item.unit,
    }]
    var input = {}
    if(item.card == null ){
      input = {
        addressId: that.data.defaultAddress.id,
        note: that.data.note,
        formId: e.detail.formId,
        items: items,
        clientMutationId: 0,
      }
    }else {
      input = {
        addressId: that.data.defaultAddress.id,
        note: that.data.note,
        formId: e.detail.formId,
        cardCode: item.card.code,
        items: items,
        clientMutationId: 0,
      }
    }
    console.log(input)
    // return
    gql({
      body: CreateOrder(input),
      //　ｂｏｄｙ == 数据结构
      success: function(res) {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '购买失败',
            content: errors[0].message,
          })
          return
        }
        if (res.data.data.createOrder !== null) {
          let id = res.data.data.createOrder.order.id
          app.globalData.updataEvent = true
          // wx.navigateBack({})
          wx.showToast({
            title: '购买成功',
          })
          wx.redirectTo({
            url: '/pages/order/detail/detail?id=' + encodeURIComponent(id),
          })
        }
      },
      fail: function(res) {
        console.log("event 错误" + res)
      }
    })

  }, 5000),
  
  bindGoBack: function() {
    wx.navigateBack({})
  },

  //获取购物车卡卷
  openCard: function(productId, quantity, unit) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let items = [{
      productId: productId,
      quantity: quantity,
      unit: unit,
    }]
    gql({
      body: AvailableCardsItems(items),
      success: function(res) {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        if (res.data.data.availableCards == null) return
        let cards = res.data.data.availableCards.edges
        let newCards = []
        cards.forEach((item) => {
          item.node.expireAtDate = moment(item.node.expireAt).format('YYYY-MM-DD')
          if (item.node.card.applyPromotion == true) {
            newCards.push(item)
          }
        })

        let order = that.data.order
        if(newCards.length !== 0) {
          order.card = newCards[0].node
          that.sum(order)
        }
        let cardLists = that.data.cardLists
        cardLists.cards = newCards
        that.setData({
          cardLists: cardLists,
          order: order,
        })
        console.log(cardLists)
      },
    })
  },

  //点击我显示底部弹出框
  clickme: function(e) {
    this.showModal();
  },

  //显示对话框
  showModal: function() {
    // 显示遮罩层
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export(),
      showModalStatus: true
    })
    setTimeout(function() {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 200)
  },
  //隐藏对话框
  hideModal: function() {
    // 隐藏遮罩层
    let cardLists = this.data.cardLists
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export(),
    })
    setTimeout(function() {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export(),
        showModalStatus: false,
        cardLists: cardLists,
      })
    }.bind(this), 200)
  },
  //选择优惠卷
  checkCard: function(e) {
    let that = this
    let card = e.currentTarget.dataset.item
    let order = that.data.order
    let total = 0 //使用优惠卷钱条件
    console.log(card)
    order.card = card
    that.hideModal()
    that.setData({
      order: order,
    })
    //有优惠卷,修改价格
    that.sum(order)
    // that.updataCarts(cartGroupId)
  },
  //不使用优惠卷
  checkCard_no: function(e) {
    let that = this
    let card = e.currentTarget.dataset.item
    let order = that.data.order
    order.card = null
    that.hideModal()
    that.setData({
      order: order,
    })
    that.sum(order)
  },

  sum: function (value) {
    let order = value
    if (order.card == null) {
      order.leastCost = 0
    } else {
      order.leastCost = order.card.card.reduceCost / 100
    }
    this.setData({
      order:order
    })
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
    this.getDefaultAddress()
  },

  selectAddress: function(e) {
    wx.navigateTo({
      url: '/pages/address/select/select',
    })
  },
  //获取默认地址
  getDefaultAddress: function() {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let addresses = wx.getStorageSync('addressList');
    let address = null;
    if (addresses == null) return;
    for (let i = 0; i < addresses.length; i++) {
      if (addresses[i].selected != undefined && addresses[i].selected == true) {
        address = addresses[i];
        that.setData({
          defaultAddress: address
        })
        break;
      }
    }
    if (address != null) return;
    gql({
      body: DefaultAddress,
      success: function(res) {
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        let defaultAddress = res.data.data.viewer.defaultAddress
        console.log(defaultAddress)
        if (defaultAddress) {
          wx.setStorage({
            key: 'selectedAddress',
            data: defaultAddress
          })
          defaultAddress.selected = true
          that.setData({
            defaultAddress: defaultAddress
          })
        }
      },
      fail: function(errors) {
        console.log(errors);
      }
    });
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    app.globalData.activeOrder = null
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
  // onShareAppMessage: function () {

  // }
})