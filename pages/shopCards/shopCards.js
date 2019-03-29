const app = getApp()
const util = require('../../utils/util.js')
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const {
  WithdrawableCards
} = require('../../models/cards/cardPoints.js')
const {
  ExchangeableCards
} = require('../../models/cards/exchangeableCards.js')
const {
  WithdrawPointCard
} = require('../../models/cards/withdrawPointCard.js')
const {
  GetShareInfo,
  GetShareToken
} = require('../../utils/share.js')
const { Member } = require('../../models/member.js')
const moment = require('../../utils/moment.js')
moment.locale('zh-cn');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardLists: {
      active: "created",
      cartGroupId: "",
      cards: [],
    },
    withdCardLists: {
      active: "wait",
      cartGroupId: "",
      cards: [],
    },
    shopMember: null,
    id: "",
    first: 20,
    after: "", //兑换after
    after2: "", //待领取after
    currTabsIndex: 0,
  },

  // 开启分享
  openShare: function () {
    wx.showShareMenu({
      withShareTicket: true,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.openShare()
    if (options.t) {
      let t = decodeURIComponent(options.t)
      if (app.globalData.scene == 1044) {
        if (app.globalData.shareTicket) {
          GetShareInfo(t)
        }
      }
    }
    if (options.id) {
      this.setData({
        id: decodeURIComponent(options.id),
        // shopMember: app.globalData.shopMember
      })
      this.getCardPoints(decodeURIComponent(options.id))
      this.getMember(decodeURIComponent(options.id))
    }
    console.log(this.data.shopMember, )
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
        var statusCode = res.statusCode
        if (statusCode == "401") {
          // client.ErrMsg(res)
          return
        }
        if (res.data.data.member !== null) {
          that.setData({
            shopMember: res.data.data.member
          })
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
      body: ExchangeableCards(supplierId,first,after),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          console.log(1)
          return
        }
        console.log(res)
        // return
        let cards = res.data.data.supplier.exchangeableCards.edges
        let newCards = that.updataCards(cards) //修改结构
        let cardLists = that.data.cardLists
        cardLists.cards = newCards
        that.setData({
          cardLists: cardLists,
          after: res.data.data.supplier.exchangeableCards.pageInfo.endCursor
        })
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },
  //修改card数据结构
  updataCards:function(value){
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

  //待领卷列表
  getWithdrawableCards: function(supplierId) {

    let that = this
    let withdCardLists1 = that.data.withdCardLists
    if (withdCardLists1.cards.length == 0) {
      wx.showLoading({
        title: '数据更新中',
      })
    }

    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    gql({
      body: WithdrawableCards(supplierId,first,after),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        console.log(res)
        let withdCards = res.data.data.withdrawableCards.edges
        // if (withdCards.length == 0) return
        withdCards.forEach((item) => {
          item.node.expireAtDate = moment(item.node.card.createdAt).format('YYYY-MM-DD')
        })
        let withdCardLists = that.data.withdCardLists
        if (withdCardLists.cards.length == 0) {
          wx.hideLoading()
        }
        withdCardLists.cards = withdCards
        that.setData({
          withdCardLists: withdCardLists,
          after2: res.data.data.withdrawableCards.pageInfo.endCursor
        })
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },

  //选择卡卷方法
  checkCard: util.throttle(function(e) {
    let that = this
    let card = e.currentTarget.dataset.item
    let currTabsIndex = that.data.currTabsIndex
    console.log(card)
    // currTabsIndex 页面为０
    if (currTabsIndex == 0) {
      wx.showModal({
        title: '兑换提示',
        content: '本张优惠卷需要  ' + card.points + "  积分",
        success(res) {
          if (res.confirm) {
            that.exchangeCard(card)
          }
        }
      })
    } else if (currTabsIndex == 1) {
      that.receiveCard()
    }
    //currTabsIndex 页面为１
  }, 1500),

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
        console.log(res)
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

  // 待领取卡卷方法
  receiveCard: function() {
    let withdCardLists = this.data.withdCardLists
    console.log(withdCardLists.cards)
    let wxCardLists = []
    withdCardLists.cards.forEach((item) => {
      wxCardLists.push({
        cardExt: item.node.addCardParams.cardExt,
        cardId: item.node.addCardParams.cardId
      })
    })
    if (wxCardLists.length !== 0) {
      this.add_receiveCard(wxCardLists)
    }
  },
  // 添加待领取卡卷
  add_receiveCard: function(wxCardLists, ) {
    let that = this
    wx.addCard({
      cardList: wxCardLists,
      success(res) {
        // console.log(res)
        that.getWithdrawableCards(that.data.id)
      },
      fail(res) {
        console.log(res)
      }
    })
  },

  // 添加卡卷
  add_card: function(wxCardLists, card) {
    let that = this
    let shopMember = that.data.shopMember
    shopMember.points = shopMember.points - card.points //减少积分
    that.setData({
      shopMember: shopMember,
    })
    app.globalData.updataEvent = true
    wx.addCard({
      cardList: wxCardLists,
      success(res) {
        console.log(res.cardList) // 卡券添加结果
        let cardLists = that.data.cardLists
        cardLists.cards.forEach((item) => { //减少库存
          if (item.node.id == card.id) {
            item.node.card.inventory = item.node.card.inventory - 1
          }
        })
        that.setData({
          cardLists: cardLists,
        })
        wx.showToast({
          title: '领取成功',
        })
      },
      fail(res) {
        console.log(res)
      }
    })
  },

  //验证库存
  isInventory: function(card) {
    if (card.card.inventory <= 0) {
      wx.showToast({
        title: '库存不足',
      })
      return false
    } else {
      return true
    }
  },

  onTabsItemTap: function(e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      currTabsIndex: index
    })
    if (index == 1) {
      this.getWithdrawableCards(this.data.id)
    }
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
    if (app.globalData.updataEvent == true) {
      this.getCardPoints(this.data.id)
      this.getMember(this.data.id)
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    app.globalData.updataEvent = null
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    app.globalData.updataEvent = null
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
  getMoreSuppliers: function () {
    let that = this;
    let currTabsIndex = that.data.currTabsIndex
    if (currTabsIndex == 0) {
      that.getMoreAfter()
    } else if (currTabsIndex == 1){
      that.getMoreAfter1()
    }
  },

  //兑换卡卷加载更多
  getMoreAfter:function(){
    let that = this
    if (that.data.after == "") {
      that.setData({
        theEnd: true,
      })
      return
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = that.data.after
    gql({
      body: ExchangeableCards(that.data.id, first, after),
      //Bｏｄｙ == 数据结构　　
      success: function (res) {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        var after = res.data.data.supplier.exchangeableCards.pageInfo.endCursor
        that.setData({
          after: after
        })
        if (after !== "") {
          let cards = res.data.data.supplier.exchangeableCards.edges
          let newCards = that.updataCards(cards) //修改结构
          let cardLists = that.data.cardLists
          newCards.forEach((item) => {
            cardLists.cards.push(item)
          })
          that.setData({
            cardLists: cardLists,
          })
        }
        //total服务端的返回的总共页数
      },
      fail: function (res) { }
    });
  },

  //待领取卡卷加载更多
  getMoreAfter1: function () {
    let that = this
    if (that.data.after2 == "") {
      return
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = that.data.after2
    gql({
      body: WithdrawableCards(that.data.id, first, after),
      //Bｏｄｙ == 数据结构　　
      success: function (res) {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        let withdCards = res.data.data.withdrawableCards.edges
        let after2 = res.data.data.withdrawableCards.pageInfo.endCursor
        that.setData({
          after2: after2
        })       
        if (after2 !== "") {
          let withdCardLists = that.data.withdCardLists
          withdCards.forEach((item) => {
            item.node.expireAtDate = moment(item.node.card.createdAt).format('YYYY-MM-DD')
            withdCardLists.cards.push(item)
          })
          that.setData({
            withdCardLists: withdCardLists,
          }) 
        }
        //total服务端的返回的总共页数
      },
      fail: function (res) { }
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    let that = this;
    var id = that.data.id
    var supplierId = undefined
    var fromPage = that.route
    var toPage = that.route
    var token = app.globalData.UserId + new Date().getTime()
    GetShareToken(supplierId, fromPage, toPage, token).then((t) => {
      // console.log("得到token")
      // console.log(t)
    })
    return {
      title: that.data.shopMember.supplier.name + "兑换卡卷",
      path: '/pages/shopCards/shopCards?id=' + id + '&t=' + encodeURIComponent(token)
    }
  }
})