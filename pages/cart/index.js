const api = require('../../config/api.js')
const util = require('../../utils/util.js')
const client = require('../../utils/graphql.js')
const { CartGroups, AvailableCards } = require('../../models/cart.js')
const { CreateCartOrder } = require('../../models/createCartOrder.js')
const { DefaultAddress } = require('../../models/address/defaultAddress.js')
const { UpdateCartItem } = require('../../models/updateCartItem.js')
const {
  ExchangeableCards
} = require('../../models/cards/exchangeableCards.js')
const {
  WithdrawPointCard
} = require('../../models/cards/withdrawPointCard.js')
const {
  ConfirmCodes
} = require('../../models/cards/confirmCodes.js')
const { Member } = require('../../models/member.js')
const { DeleteCart } = require('../../models/deleteCart.js')
const moment = require('../../utils/moment.js')
moment.locale('zh-cn');

const app = getApp()
Page({
  data: {
    carts: [],
    defaultAddress: null,
    isShowToast: false,
    totalPrice: 0, //所有订单的总价格
    discountTotal: 0, //所有订单的总优惠价
    toastText: '',
    cartNull: true,
    inputNum: null, //弹出框的用户输入值
    inputData: {}, // 弹出框对应的某个产品的相关数据，
    menuBox: {
      active: false,
    },
    url: "",//来自哪里
    formIds: [],
    cardLists: {
      active: "use",
      cartGroupId: "",
      cards: [],
    },
    exchangeCardLists: {
      active: "created",
      cartGroupId: "",
      cards: [],
    },
    currTabsIndex: 0, //卡卷列表页
    member: {
      points: 0,
      level: 0
    }
  },
  onTabsItemTap: function (e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      currTabsIndex: index
    })
    if (index == 1) {
      this.getCardPoints()
    }
  },

  toIndexPage: function () {
    wx.switchTab({
      url: "/pages/index/index"
    });
  },
  onLoad: function (options) {
    if (options.url) {
      url: options.url
    }
  },

  //获取每个购物车卡卷
  openCard: function (id) {
    let that = this;
    let cardLists = that.data.cardLists
    let cartGroupId = id
    cardLists.cartGroupId = cartGroupId
    let carts = that.data.carts
    carts.forEach((car) => {
      if (car.id == cartGroupId) {
        // console.log(car)
        car.availableCards.edges.forEach((item) => {
          item.node.expireAtDate = moment(item.node.expireAt).format('YYYY-MM-DD')
          if (item.node.card.leastCost !== 0) {
            // console.log(item)
            if (car.total >= (item.node.card.leastCost / 100)) {
              item.node.card.active = true
            } else {
              item.node.card.active = false
            }
          } else {
            item.node.card.active = true
          }
        })
        cardLists.cards = car.availableCards.edges
      }
    })
    that.setData({
      cardLists: cardLists
    })
    // console.log(cardLists)
  },

  // 获取购物车列表数据
  getCartGroups: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: CartGroups,
      success: function (res) {
        // console.log(res)　
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        let cartGroups = res.data.data.viewer.cartGroups
        let totalPrice = 0;
        let discountTotal = 0;
        for (let i = 0; i < cartGroups.length; i++) {
          totalPrice = totalPrice + cartGroups[i].total;
          discountTotal = discountTotal + cartGroups[i].discountTotal;
          let sum = 0;
          for (let n = 0; n < cartGroups[i].items.length; n++) {
            sum += parseInt(cartGroups[i].items[n].quantity);
          }
          cartGroups[i].sum = sum;
          // 进入购物车默认已经选择
          cartGroups[i].selected = true;
        }
        let cartNull = that.data.cartNull;
        if (cartGroups.length == 0) cartNull = false
        let newCartGroups = that.updateCards(cartGroups)
        console.log(newCartGroups)
        that.setData({
          carts: newCartGroups,
          cartNull: cartNull
        })
        that.sum();
      },
      fail: function (res) {
      }
    });
  },

  //处理可用卡卷
  updateCards: function (cartGroups) {
    cartGroups.forEach((it) => {
      if (it.availableCards.edges.length !== 0) {
        it.card = it.availableCards.edges[0].node
      } else {
        it.card = null
      }
    })
    return cartGroups
  },

  formSubmit: function (e) {
    var formIds = this.data.formIds
    formIds.push(e.detail.formId)
    this.setData({
      formIds: formIds
    })
    // console.log("0000", e)
    // e.stopPropagation()
  },

  //提交订单
  CreateCartOrder: util.throttle(function (e) {
    let that = this;
    wx.showLoading({
      title: '正在提交',
    })
    // console.log(that.data.formIds)
    let selectCartGroupIds = []
    let cartGroups = []
    let carts = that.data.carts;
    // return
    for (let i = 0; i < carts.length; i++) {
      if (carts[i].selected) {
        selectCartGroupIds.push(carts[i].id)
        cartGroups.push({
          cartGroupId: carts[i].id,
          cardCode: carts[i].card !== null ? carts[i].card.code : ""
        })
      }
    }
    if (that.data.defaultAddress == null) {
      that.showToast(that, '您还没有选择地址哦')
      return
    } else if (selectCartGroupIds.length == 0) {
      that.showToast(that, '您还没有选择产品哦')
      return
    }

    let formIds = that.data.formIds
    let newFormIds = []
    formIds.forEach((item) => {
      if (item !== undefined) {
        newFormIds.push(item)
      }
    })
    let input = {
      clientMutationId: 0,
      addressId: that.data.defaultAddress.id,
      // cartGroupIds: selectCartGroupIds,
      cartGroups: cartGroups,
      formIds: newFormIds
    }
    console.log(input)

    // return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: CreateCartOrder(input),
      success: function (res) {
        wx.hideLoading()
        console.log(res)
        if (res.data.errors) {
          wx.showModal({
            title: '购买失败',
            content: res.data.errors[0].message,
          })
          return
        } else {
          // 下单成功
          let orders = res.data.data.createCartOrders.orders
          let newOrders = []
          orders.forEach((item) => {
            if (item.weixinpayParams !== null) {
              newOrders.push(item)
            }
          })
          if (newOrders.length == 0) {
            wx.navigateTo({
              url: '/pages/order/order',
            })
          } else {
            app.globalData.payOrders = newOrders
            wx.navigateTo({
              url: '/pages/cartPay/cartPay',
            })
          }
        }
      },
      fail: function (res) {
        wx.showToast({
          title: '提交失败',
        })

        setTimeout(() => {
          wx.hideToast()
        }, 2000)
      }
    });
  }, 5000),

  sum: function () {
    let that = this;
    let carts = that.data.carts;
    let totalPrice = 0;
    for (let i = 0; i < carts.length; i++) {
      if (carts[i].selected) {
        if (carts[i].card == null) {
          totalPrice += carts[i].total
        } else {
          totalPrice += carts[i].total
          totalPrice = totalPrice - carts[i].card.card.reduceCost / 100
        }
      }
    }
    that.setData({
      totalPrice: totalPrice
    })
  },

  slectCartGroupIds: function (e) {
    let that = this;
    let carts = that.data.carts;
    let index = e.currentTarget.dataset.index;
    let selected = carts[index].selected;
    carts[index].selected = !selected;
    that.setData({
      carts: carts
    });
    that.sum();
  },

  //获取默认地址
  getDefaultAddress: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let addresses = wx.getStorageSync('addressList');
    let address = null;

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
      success: function (res) {
        let defaultAddress = res.data.data.viewer.defaultAddress
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
      fail: function (errors) {
        console.log(errors);
      }
    });
  },

  showToast: function (that, toastText) {
    that.setData({
      isShowToast: true,
      toastText: toastText,
    })
    setTimeout(function () {
      that.setData({
        isShowToast: false,
      })
    }, 1000)
  },

  showModalBtn: function (e) {
    let cartSelected = e.currentTarget.dataset.cartSelected;
    let cartIndex = parseInt(e.currentTarget.dataset.cartIndex);
    let productIndex = parseInt(e.currentTarget.dataset.productIndex);
    let productQuantity = parseInt(e.currentTarget.dataset.productQuantity);
    let inputData = { productIndex: productIndex, cartIndex: cartIndex, productQuantity: productQuantity };

    if (!cartSelected) return;
    this.setData({
      inputData: inputData
    })
    this.inputModal.showModal();
  },

  bindInputChange: function (e) {
    this.setData({
      inputNum: e.detail.inputNum
    })
  },

  onConfirm: function () {
    let that = this;
    let carts = that.data.carts;
    let index = that.data.inputData.productIndex;
    let cartIndex = that.data.inputData.cartIndex;
    let num = that.data.inputNum;
    let input = {
      clientMutationId: 0,
      id: carts[cartIndex].items[index].id,
      quantity: num
    }
    if (num == null) {
      that.inputModal.hideModal();
      return
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });

    // return
    gql({
      body: UpdateCartItem(input),
      success: function (res) {
        console.log(res.data.data)
        // return
        let sum = 0;
        let cartGroup = res.data.data.updateCartItem.cartGroup;
        for (let i = 0; i < carts.length; i++) {
          //默认选择
          if (cartGroup.items == null && num === 0) {
            //删除该项产品
            carts[cartIndex].items.splice(index, 1);
          } else {
            if (cartIndex === i) carts[i] = cartGroup;
          }
          carts[i].selected = true
          if (carts[i].availableCards.edges.length !== 0) {
            carts[i].card = carts[i].availableCards.edges[0].node
          } else {
            carts[i].card = null
          }

          for (let n = 0; n < carts[i].items.length; n++) {
            sum += parseInt(carts[i].items[n].quantity);
          }
          carts[i].sum = sum;
        }
        if (carts[cartIndex].items.length <= 0) carts.splice(cartIndex, 1); // 该笔订单没有任何产品时，删除该订单
        that.sum();
        that.setData({
          carts: carts
        })
        wx.showToast({
          title: '修改成功',
          icon: 'success',
          duration: 1000
        })
      },
      fail: function (errors) {
        console.log(errors);
      }
    });
    that.inputModal.hideModal();
  },

  deleteCart: function (e) {
    let that = this;
    let carts = that.data.carts;
    let cartId = e.currentTarget.dataset.id;
    let cartIndex = e.currentTarget.dataset.index;
    let input = {
      clientMutationId: 0,
      id: cartId
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    wx.showModal({
      title: '删除订单',
      content: '确定要删除该订单么？',
      success: function (res) {
        if (res.confirm) {
          gql({
            body: DeleteCart(input),
            success: function (res) {
              if (res.data.data.deleteCartGroup.status == "ok") {
                for (let i = 0; i < carts.length; i++) {
                  if (i == cartIndex) carts.splice(cartIndex, 1);
                }
                let cartNull = that.data.cartNull;
                if (carts.length == 0) cartNull = false
                that.setData({
                  carts: carts,
                  cartNull: cartNull
                })
                that.sum();
              } else {
                wx.showToast({
                  title: '删除',
                  icon: '删除失败'
                })
              }
            },
            fail: function (errors) {
              console.log(errors);
            }
          });
        } else if (res.cancel) {
          console.log('取消')
        }
      }
    })
  },

  onShow: function () {
    this.getDefaultAddress();
    this.getCartGroups();
    this.inputModal = this.selectComponent("#inputModal"); //引入自定义组件
  },

  selectAddress: util.throttle(function (e) {
    wx.navigateTo({
      url: '/pages/address/select/select',
    })
  }, 2000),

  onPullDownRefresh: function () {

  },

  onReachBottom: function () {

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
  onHide: function () {
    this.setData({
      menuBox: {
        active: false,
      },
    })
    this.inputModal.hideModal()
  },

  //点击我显示底部弹出框
  clickme: function (e) {
    this.showModal();
    console.log(e.currentTarget.dataset.supplierid)
    this.openCard(e.currentTarget.dataset.id)
    this.getMember(e.currentTarget.dataset.supplierid)
    this.setData({
      supplierId: e.currentTarget.dataset.supplierid
    })
  },

  getMember: function (id) {
    let that = this
    let supplierId = id
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: Member(supplierId),
      success: function (res) {
        // console.log(res)
        if (res.data.data.member !== null) {
          that.setData({
            member: res.data.data.member
          })
        }
      },
    })
  },

  //显示对话框
  showModal: function () {
    // 显示遮罩层
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(600).step()
    this.setData({
      animationData: animation.export(),
      showModalStatus: true
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export()
      })
    }.bind(this), 100)
  },
  //隐藏对话框
  hideModal: function () {
    // 隐藏遮罩层
    let cardLists = this.data.cardLists
    let exchangeCardLists = this.data.exchangeCardLists
    cardLists.cards = []
    exchangeCardLists.cards = []
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
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export(),
        showModalStatus: false,
        cardLists: cardLists,
        currTabsIndex: 0,
        exchangeCardLists: exchangeCardLists,
      })
    }.bind(this), 200)
  },
  //选择优惠卷
  checkCard: util.throttle(function (e) {
    let that = this
    let card = e.currentTarget.dataset.item
    let cartGroupId = e.currentTarget.dataset.cartgroupid
    let currTabsIndex = that.data.currTabsIndex
    if (currTabsIndex == 0) { //可使用卡卷
      that.useCards(card, cartGroupId)
    } else if (currTabsIndex == 1) {
      wx.showModal({
        title: '兑换提示',
        content: '本张优惠卷需要  ' + card.points + "  积分",
        success(res) {
          if (res.confirm) {
            that.exchangeCard(card)
          }
        }
      })
    }

    // that.updataCarts(cartGroupId)
  }, 1500),

  //可使用卡卷方法
  useCards: function (card, cartGroupId) {
    let that = this
    let carts = that.data.carts
    carts.forEach((it) => {
      if (it.id == cartGroupId) {
        it.card = card
      }
    })
    that.hideModal()
    that.setData({
      carts: carts,
    })
    //有优惠卷,修改价格
    that.sum()
  },

  //不使用优惠卷
  checkCard_no: function (e) {
    let that = this
    let cartGroupId = e.currentTarget.dataset.cartgroupid
    let carts = that.data.carts
    carts.forEach((it) => {
      if (it.id == cartGroupId) {
        it.card = null
      }
    })
    that.hideModal()
    that.setData({
      carts: carts,
    })
    that.sum()
  },
  updataCarts: function (cartGroupId) {
    let carts = this.data.carts
    carts.forEach((it) => {
      if (it.id == cartGroupId) {
        console.log(it)
        it.total = it.total - it.card.card.reduceCost / 100
      }
    })
    this.setData({
      carts: carts
    })
  },
  //兑换列表
  getCardPoints: function () {
    let that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    gql({
      body: ExchangeableCards(that.data.supplierId, first, after),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        console.log(res)
        // return
        let cards = res.data.data.supplier.exchangeableCards.edges
        let newCards = that.updataCards(cards) //修改结构
        let exchangeCardLists = that.data.exchangeCardLists
        let member = that.data.member
        let updata_newCards = []
        newCards.forEach((item) => {
          // console.log(item.node.points)
          if (member.points >= item.node.points) {
            updata_newCards.push(item)
          }
        })
        exchangeCardLists.cards = updata_newCards
        that.setData({
          exchangeCardLists: exchangeCardLists,
        })
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },

  //修改card数据结构
  updataCards: function (value) {
    let cards = value
    cards.forEach((item) => {
      item.node.card = {
        id: item.node.id,
        kind: item.node.kind,
        name: item.node.name,
        kindName: item.node.kindName,
        leastCost: item.node.leastCost,
        reduceCost: item.node.reduceCost,
        inventory: item.node.inventory,
        wxCardId: item.node.wxCardId,
        applyPromotion: item.node.applyPromotion,
        createdAt: item.node.createdAt,
      }
      item.node.expireAtDate = moment(item.node.card.createdAt).format('YYYY-MM-DD')
      item.node.points = item.node.exchangePoints
    })
    return cards
  },

  //兑换卡卷方法
  exchangeCard: function (card) {
    let that = this
    let isInventory = that.isInventory(card)
    if (isInventory == false) return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let input = {
      clientMutationId: 0,
      cardId: card.id,
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
  add_card: function (wxCardLists, card) {
    let that = this
    let member = that.data.member
    member.points = member.points - card.points //减少积分
    that.setData({
      member: member,
    })
    wx.addCard({
      cardList: wxCardLists,
      success(res) {
        // console.log(res.cardList) // 卡券添加结果
        let cardLists = that.data.exchangeCardLists
        cardLists.cards.forEach((item) => { //减少库存
          if (item.node.id == card.id) {
            item.node.card.inventory = item.node.card.inventory - 1
          }
        })
        that.setData({
          exchangeCardLists: cardLists,
        })
        that.confirmCodes(res.cardList)  //返回成功手动添加卡卷
      },
      fail(res) {
        console.log(res)
      }
    })
  },

  //验证库存
  isInventory: function (card) {
    if (card.card.inventory <= 0) {
      wx.showToast({
        title: '库存不足',
      })
      return false
    } else {
      return true
    }
  },

  confirmCodes: function (cardList) {
    let that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let newCardList = []
    cardList.forEach((item) => {
      newCardList.push({
        code: item.code,
        cardId: item.cardId
      })
    })
    let input = {
      clientMutationId: 0,
      cardList: newCardList
    }
    console.log(input)
    // return
    gql({
      body: ConfirmCodes(input),
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
        setTimeout(() => {
          that.getCartGroups()
          wx.showToast({
            title: '兑换成功',
          })
        }, 1000)

      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },

})