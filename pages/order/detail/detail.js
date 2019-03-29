// pages/myOrderDetails/myOrderDetails.js
var app = getApp()
const api = require('../../../config/api.js')
const util = require('../../../utils/util.js')
const client = require('../../../utils/graphql.js')
const moment = require('../../../utils/moment.js')
moment.locale('zh-cn');
const {
  Order
} = require('../../../models/order/queryOrder.js')
const {
  UpdateOrder
} = require('../../../models/order/updateOrder.js')
const {
  CreateOrderCancelApplication
} = require('../../../models/order/createOrderCancelApplication.js')
const {
  DeleteOrderCancelApplication
} = require('../../../models/order/deleteOrderCancelApplication.js')
const {
  CreateOrderNote
} = require('../../../models/order/createOrderNote.js')
const {
  ReceiveOrder
} = require('../../../models/order/receiveOrder.js')
const {
  Member
} = require('../../../models/member.js')
const {
  ExchangeableCards
} = require('../../../models/cards/exchangeableCards.js')
const {
  WithdrawPointCard
} = require('../../../models/cards/withdrawPointCard.js')
var previewSwitch

Page({
  /**
   * 页面的初始数据
   */
  data: {
    id: "",
    order: null,
    nums: 0,
    button_text: "申请撤销",
    note: "",
    noteUpdata: "", //修改
    ifName: true, //默认隐藏
    isApplication: true, //默认隐藏撤销申请框
    application_text: "",
    message_text: "",
    myId: "",
    myAvatar: "",
    currTabsIndex: 0,
    fuwu: {
      evaluate_contant: ['服务评分', '物流评分', '商品评分'],
      stars: [0, 1, 2, 3, 4],
      normalSrc: '../../../images/order-details/start_no.png',
      selectedSrc: '../../../images/order-details/start_yes.png',
      score: 0,
      scores: [0, 0, 0],
      comment: "",
    },
    showModal: false, //兑换弹出框
    cards: [], //兑换列表
    member: {
      points: 0,
      level: 1,
    },
    usePoints: 0, //兑换需求积分
    choose: false,
    checkIndex: "",
    cardId: "",
    payment: [{
      name: 'no-1',
      value: '货到付款',
      checked: true
    }, ],
    payValue: 'no-1',
  },

//预览图片
  pImage: function (e) {
    let paths = this.data.fuwu.images
    let pathUrls = []
    paths.forEach((item)=>{
      pathUrls.push(item.path_server)
    })
    previewSwitch = true
    wx.previewImage({
      current: paths[e.currentTarget.dataset.index].path_server,
      urls: pathUrls
    })
    this.setData({
      stop:true,
    })
  },

  radioChange(e) {
    // console.log('radio发生change事件，携带value值为：', e.detail.value)
    if (this.data.order.status == 6) {
      wx.showToast({
        title: '订单已完成',
      })
      return
    } else if (this.data.order.cancelApplication !== null) {
      wx.showToast({
        title: '订单在处理',
      })
      return
    }
    this.setData({
      payValue: e.detail.value
    })
    if (e.detail.value == "no-2") {
      this.gotoPay()
    }
  },

  //微信付款
  gotoPay: function() {
    let that = this
    let weixinpayParams = this.data.order.weixinpayParams
    weixinpayParams = JSON.parse(weixinpayParams)
    that.weixinPay(weixinpayParams)
  },
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
        // that.getOrder()
        let order = that.data.order
        order.paidAmount = order.amount
        that.setData({
          order: order
        })
        // wx.redirectTo({
        //   url: '/pages/order/order',
        // })
      },
      fail(res) {
        wx.showToast({
          title: '支付失败',
        })
        let payment = that.data.payment
        payment[0].checked = true
        that.setData({
          payment: payment
        })
        console.log("pay fail")
        console.log(res)
      }
    })
  },


  onTabsItemTap: function(e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      currTabsIndex: index
    })
  },

  setNotes: function(e) {
    this.setData({
      message_text: e.detail.value
    })
  },

  sendNotes: function() {
    console.log("点击了发送")
    let that = this
    var order = that.data.order
    if (order.cancelApplication !== null && order.cancelApplication.status == 1) {
      wx.showToast({
        title: '订单已撤销',
      })
      return
    }
    if (that.data.message_text == "") {
      return
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var input = {
      clientMutationId: 0,
      orderId: order.id,
      content: that.data.message_text,
    }
    gql({
      body: CreateOrderNote(input),
      success: res => {
        // console.log(res)
        if (res.data.data.createOrderNote.orderNote !== null) {
          var order = that.data.order
          var node = {}
          node.node = res.data.data.createOrderNote.orderNote
          order.orderNotes.edges.push(node)
          that.setData({
            order: order,
            message_text: "",
          })
        }
      },
      fail: res => {}
    });
  },

  receiveOrder: function(e) {
    let that = this
    wx.showModal({
      title: '确认收货',
      content: '您现在是否要确定订单商品送达？',
      confirmText: "确定",
      success(res) {
        if (res.confirm) {
          let gql = client.GraphQL({
            url: api.WxGqlApiUrl + app.globalData.token
          });
          var input = {
            clientMutationId: 0,
            id: that.data.order.id,
          }
          // console.log(input)
          gql({
            body: ReceiveOrder(input),
            success: res => {
              console.log(res)
              if (res.data.errors) {
                wx.showModal({
                  title: '操作失败',
                  content: res.data.errors[0].message,
                })
                return
              }
              if (res.data.data.receiveOrder.order !== null) {
                // let order = that.data.order
                // order.status = 6
                // order.statusName = "已完成"
                // that.setData({
                //   order: order
                // })
                let order = res.data.data.receiveOrder.order
                order.createdAt = moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss')
                if (order.rated == true) {
                  that.updateFuwu(order)
                }
                that.setData({
                  order: order,
                  showModal: true,
                })
                that.getMember(order.supplier.id) //获取积分
                that.updataNums(order)
              }
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })

  },

  openBeizhu: function() {
    //打开
    this.setData({
      ifName: false,
      noteUpdata: this.data.order.note,
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
    let that = this
    var order = that.data.order
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var input = {
      clientMutationId: 0,
      id: order.id,
      note: that.data.noteUpdata,
    }
    gql({
      body: UpdateOrder(input),
      success: res => {
        // console.log(res)
        if (res.data.errors) {
          wx.showModal({
            title: '操作失败',
            content: res.data.errors[0].message,
          })
          return
        }
        order.note = that.data.noteUpdata
        this.setData({
          order: order,
          ifName: true,
        })
      },
      fail: res => {}
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var id = options.id
    this.setData({
      id: decodeURIComponent(id)
    })
    // console.log(options)
  },

  onShow: function() {
    if (previewSwitch) {
      previewSwitch = false
      return
    }
    util.showLoading()
    this.getOrder()
    console.log("app.globalData.scene", app.globalData.scene)
  },

  onHide: function(){

  },

  // 获取订单详情
  getOrder: function() {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: Order(that.data.id),
      success: res => {
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        util.hideLoading()
        var order = res.data.data.viewer.order
        var myId = res.data.data.viewer.id
        var myAvatar = res.data.data.viewer.avatar
        console.log(order)
        order.createdAt = moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss')
        if (order.rated == true) {
          that.updateFuwu(order)
        }
        this.setData({
          order: order,
          myId: myId,
          myAvatar: myAvatar,
        })
        if (order.status == 6) {
          that.getMember(order.supplier.id) //获取积分
        }
        that.jianchaPayOrder(order)
        that.updataNums(order)
        // wx.setNavigationBarTitle({
        //   title: this.data.order.supplier.name,
        // })
      },
      fail: res => {}
    });
  },

  jianchaPayOrder: function(value) {
    let order = value
    let payment = this.data.payment
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

  updateFuwu: function(order) {
    var that = this
    let fuwu = that.data.fuwu
    let myId = that.data.myId
    fuwu.scores[0] = order.rateSet.service
    fuwu.scores[1] = order.rateSet.delivery
    fuwu.scores[2] = order.rateSet.order.value
    fuwu.comment = order.rateSet.order.comment.content
    fuwu.images = order.rateSet.order.comment.images
    var newImags = []
    if (fuwu.images !== null) {
      fuwu.images.forEach((item) => {
        newImags.push({
          path: "",
          path_key: item.key,
          path_server: item.url,
        })
      })
    }
    fuwu.images = newImags
    that.setData({
      fuwu: fuwu
    })
  },

  goToShop: function(e) {
    return
    let id = this.data.order.supplier.id
    let name = this.data.order.supplier.name
    let url = "/pages/category/category?id=" + encodeURIComponent(id) + "&name=" + name
    wx.redirectTo({
      url: url,
    })
  },

  goPeidan: function(e) {
    console.log("您需要配单")
    let itemId = e.currentTarget.dataset.itemid
    let item = e.currentTarget.dataset.item
    let orderId = this.data.order.id
    let order = this.data.order

    let eventNum = 0
    order.items.forEach((item) => {
      if (item.promotionProduct && item.promotionProduct.id == item.promotionProduct.id) {
        eventNum += item.quantity
      }
    })

    console.log(eventNum)
    wx.showModal({
      title: '配单',
      content: '您是否要配置该系列其他产品数量',
      confirmText: "确定",
      success(res) {
        if (res.confirm) {
          console.log('用户点了确定')
          app.globalData.matchItem = item
          app.globalData.matchItems = order.items
          wx.navigateTo({
            url: '/pages/order/match/match?orderId=' + encodeURIComponent(orderId) + '&eventNum=' + eventNum,
          })
        }
      },
      fail: res => {

      }
    })
  },

  goToPingjia: function(e) {
    let orderId = this.data.order.id
    let active = "add"
    wx.navigateTo({
      url: '/pages/orderEvaluation/evaluation/evaluation?id=' + encodeURIComponent(orderId) + "&active=" + active
    })
  },

  updatePingjia: function(e) {
    let orderId = this.data.order.id
    let active = "update"
    app.globalData.rateSet = this.data.order.rateSet
    wx.navigateTo({
      url: '/pages/orderEvaluation/evaluation/evaluation?id=' + encodeURIComponent(orderId) + "&active=" + active
    })
  },

  onPullDownRefresh: function() {

  },
  onReachBottom: function() {

  },

  setApplicationValue: function(e) {
    this.setData({
      application_text: e.detail.value
    })
  },

  openApplication: function() {
    this.setData({
      isApplication: false,
      application_text: "",
    })
  },

  closeApplication: function() {
    this.setData({
      isApplication: true,
      application_text: "",
    })
  },

  sendApplication: function(e) {
    var that = this

    if (that.data.application_text == "") {
      wx.showToast({
        title: "不能为空"
      })
      return
    }

    if (that.data.order.cancelApplication !== null && that.data.order.cancelApplication.status == 1) {
      wx.showToast({
        title: '订单已撤销',
      })
      return
    }

    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var input = {
      clientMutationId: 0,
      orderId: that.data.order.id,
      reason: that.data.application_text,
      formId: e.detail.formId
    }
    gql({
      body: CreateOrderCancelApplication(input),
      success: res => {
        // console.log(res)
        var createO = res.data.data.createOrderCancelApplication
        if (createO.orderCancelApplication !== null) {
          var order = that.data.order
          // console.log(order)
          order.cancelApplication = {
            status: createO.orderCancelApplication.status,
            statusDesc: createO.orderCancelApplication.statusDesc,
            reason: createO.orderCancelApplication.reason,
            id: createO.orderCancelApplication.id,
          }
          that.setData({
            isApplication: true,
            order: order,
          })
        }
      },
      fail: res => {

      }
    })
  },

  //取消申请
  waitProcessing: function() {
    var that = this
    wx.showModal({
      title: '操作提示',
      content: '订单撤销申请正在受理中，如需取消申请，请点击确定',
      confirmText: "确定",
      success(res) {
        if (res.confirm) {
          console.log("您取消了 撤销申请")
          let gql = client.GraphQL({
            url: api.WxGqlApiUrl + app.globalData.token
          });
          var input = {
            clientMutationId: 0,
            id: that.data.order.cancelApplication.id,
          }
          // console.log(input)
          gql({
            body: DeleteOrderCancelApplication(input),
            success: res => {
              // console.log(res)
              if (res.data.data.deleteOrderCancelApplication.status == "ok") {
                var order = that.data.order
                order.cancelApplication = null
                that.setData({
                  order: order,
                })
              }
            },
            fail: res => {

            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {
  //   let that = this;
  //   var id = that.data.id
  //   return {
  //     title: '订单',
  //     path: '/pages/order/detail/detail?id=' + id
  //   }
  // },

  onUnload: function() {
    // app.globalData.scene = null
  },

  showDialogBtn: function() {
    this.setData({
      showModal: true
    })
  },
  /**
   * 弹出框蒙层截断touchmove事件
   */
  preventTouchMove: function() {},
  /**
   * 隐藏模态对话框
   */
  hideModal: function() {
    this.setData({
      showModal: false,
      choose: false,
      // usePoints: 0,
      // checkIndex: "",
    });
  },
  /**
   * 对话框取消按钮点击事件
   */
  onCancel: function() {
    this.hideModal();
  },
  /**
   * 对话框确认按钮点击事件
   */
  onConfirm: util.throttle(function() {
    // wx.showToast({
    //   title: '提交成功',
    //   icon: 'success',
    //   duration: 2000
    // })
    let that = this
    let checkIndex = that.data.checkIndex
    let cards = that.data.cards
    let usePoints = that.data.usePoints
    if (usePoints == 0) return
    that.exchangeCard(cards[checkIndex])
    // that.hideModal();
  }, 3000),

  //兑换卡卷方法
  exchangeCard: function(card) {
    let that = this
    let isInventory = that.isInventory(card)
    if (isInventory == false) return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let input = {
      clientMutationId: 0,
      cardId: card.node.id,
      quantity: 1,
    }
    console.log(input)
    // return
    gql({
      body: WithdrawPointCard(input),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '兑换失败',
            content: errors[0].message,
          })
          return
        }
        // console.log(res)
        that.hideModal();
        let wxCardLists = res.data.data.withdrawPointCard.wxCardLists
        if (wxCardLists.length !== 0) {
          that.add_card(wxCardLists, card)
        }
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },

  // 添加卡卷
  add_card: function(wxCardLists, card) {
    let that = this
    let member = that.data.member
    member.points = member.points - card.node.exchangePoints //减少积分
    that.setData({
      member: member,
    })
    wx.addCard({
      cardList: wxCardLists,
      success(res) {
        console.log(res.cardList) // 卡券添加结果
        wx.showToast({
          title: '兑换成功',
        })
        that.setData({
          showModal: false,
        })
      },
      fail(res) {
        console.log(res)
      }
    })
  },

  //验证库存
  isInventory: function(card) {
    if (card.node.inventory <= 0) {
      wx.showToast({
        title: '库存不足',
      })
      return false
    } else {
      return true
    }
  },

  getMember: function(id) {
    let that = this
    let supplierId = id
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: Member(supplierId),
      success: function(res) {
        // console.log(res)
        if (res.data.data.member !== null) {
          that.setData({
            member: res.data.data.member
          })
          that.getCardPoints(supplierId) //获取兑换物品
        }
      },
    })
  },
  //兑换列表
  getCardPoints: function(supplierId) {
    let that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    gql({
      body: ExchangeableCards(supplierId, first, after),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        // console.log(res)
        if (app.globalData.scene == 1014 && that.data.order.status == 6) {
          that.setData({
            showModal: true,
          })
        }
        let cards = res.data.data.supplier.exchangeableCards.edges
        let member = that.data.member
        let newCards = []
        cards.forEach((item) => {
          item.node.checked = false
          if (member.points >= item.node.exchangePoints) {
            newCards.push(item)
          }
        })
        let usePoints = 0
        let cardId = ""
        //.默认选择第一个
        if (newCards.length !== 0) {
          newCards[0].node.checked = true
          usePoints = newCards[0].node.exchangePoints
          cardId = newCards[0].node.id
        }
        that.setData({
          cards: newCards,
          usePoints: usePoints,
          cardId: cardId,
        })
        console.log("newCards", newCards)
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },
  //选择优惠卷
  checkCard: util.throttle(function(e) {
    let that = this
    let checkIndex = e.currentTarget.dataset.index
    let card = e.currentTarget.dataset.card
    let choose = that.data.choose
    console.log(checkIndex, card)
    let cards = that.data.cards
    cards.forEach((item) => {
      if (item.node.id == card.node.id) {
        choose = true
        // if(item.active == true) {
        //   choose = false
        // }else {
        //   choose = true
        // }
      }
    })
    that.setData({
      checkIndex: checkIndex,
      choose: choose,
      usePoints: cards[checkIndex].node.exchangePoints
    })
    console.log(choose, checkIndex, card)
  }, 100),

  checkboxChange(e) {
    console.log('checkbox发生change事件，携带value值为：', )
    // console.log(e.detail.value)
    let id = e.detail.value
    console.log(id)
    let cards = this.data.cards
    let usePoints = 0
    cards.forEach((item) => {
      if (item.node.id == id) {
        usePoints = item.node.exchangePoints
      }
    })
    this.setData({
      usePoints: usePoints,
      cardId: id,
    })
  },
  onConfirms: util.throttle(function() {
    let that = this
    let cards = that.data.cards
    let cardId = that.data.cardId
    console.log(cardId)
    let card = null
    cards.forEach((item) => {
      if (item.node.id == cardId) {
        card = item
      }
    })
    let usePoints = that.data.usePoints
    if (usePoints == 0) return
    that.exchangeCard1(card)
  }, 3000),

  //兑换卡卷方法
  exchangeCard1: function(card) {
    let that = this
    let isInventory = that.isInventory(card)
    if (isInventory == false) return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let input = {
      clientMutationId: 0,
      cardId: card.node.id,
      quantity: 1,
    }
    console.log(input)
    // return
    gql({
      body: WithdrawPointCard(input),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '兑换失败',
            content: errors[0].message,
          })
          return
        }
        // console.log(res)
        that.hideModal();
        let wxCardLists = res.data.data.withdrawPointCard.wxCardLists
        if (wxCardLists.length !== 0) {
          that.add_card(wxCardLists, card)
        }
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },
})