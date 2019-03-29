// pages/shop1/shop1.js
var app = getApp()
const {
  throttle
} = require('../../utils/util.js')
const {
  GetShareInfo,
  GetShareToken
} = require('../../utils/share.js')
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const {
  QueryMenu
} = require('../../models/category/menu.js')
const {
  Product
} = require('../../models/category/product.js')
const {
  AddCartItems
} = require('../../models/shop/addCartItems.js')
const {
  CreateMiniProgramShare
} = require('../../models/share/createMiniProgramShare.js')
const {
  Follow,
  Unfollow
} = require('../../models/shop/follow.js')
const {
  Like,
  Unlike
} = require('../../models/category/like.js')
const {
  CartGroup,
  DeleteCartItem
} = require('../../models/cart.js')
const {
  UpdateCartItem
} = require('../../models/updateCartItem.js')
const {
  DeleteCart
} = require('../../models/deleteCart.js')
const {
  QueryRates
} = require('../../models/category/rates.js')
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
  Member
} = require('../../models/member.js')
const {
  ReadSupplierShareNotify
} = require('../../models/share/readSupplierShareNotify.js')
const moment = require('../../utils/moment.js')
moment.locale('zh-cn');

function sleep(ms) {
  return new Promise((resolve, _) => {
    setTimeout(resolve, ms)
  })
}

var previewSwitch

Page({
  data: {
    cart: {
      count: 0,
      total: 0,
    },
    userId: "", //自己的id
    sharerId: "", //.分享人id
    supplierId: '',
    supplierName: '',
    products: [],
    localList: [],
    showActivePage: true,
    showErrors: true,
    activeDel: [],
    store: null,
    followed: false,
    showDialog: false,
    tanchu_box: {}, //规格弹出层数据
    imgDefault: ["https://assets.jiejie.io/internet/weishangchuan.jpeg"],
    refreshPage: false, //默认关闭show,刷新购物车
    cartGroupId: "", //购物车id
    currTabsIndex: 0,
    currTabsIndex2: 0,
    first: 15,
    after: "",
    fuwu: {
      active:"shop",
      lookNum: '',
      comment_num: 2,
      rates: [],
      stars: [0, 1, 2, 3, 4],
      normalSrc: '../../images/order-details/start_no.png',
      selectedSrc: '../../images/order-details/start_yes.png',
      images: [],
    },
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
    member: {
      points: 0,
      level: 0
    },
    sharePage: {
      flag: true,
      openShare: true
    }
  },

  // 关闭分享引导弹窗
  closeShare: function() {
    let that = this;
    //未登入先关闭,但下一次进入还是会显示
    var sharePage = that.data.sharePage
    console.log(sharePage.flag)
    sharePage.flag = true
    that.setData({
      sharePage: sharePage
    })
    if (sharePage.flagActive == true) return
    let input = {
      clientMutationId:0,
      supplierId:that.data.supplierId
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: ReadSupplierShareNotify(input),
      success: function(res) {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          // client.ErrMsg(res.data.error)
          that.payLogin()
          console.log("请重新登入")
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '温馨提示',
            content: errors[0].message,
          })
          return
        }
        if (res.data.data.readSupplierShareNotify !== null && res.data.data.readSupplierShareNotify.status == "ok") {
          console.log("已阅")
          sharePage.flagActive = true
          that.setData({
            sharePage: sharePage
          })
        }
      },
      fail: function(errors) {
        console.log(errors);
      }
    });
    // ReadSupplierShareNotify
  },

  //打开分享引导弹窗
  openShareView:function(){
    let that = this;
    let userInfo = wx.getStorageSync('userInfo')
    if(!userInfo) {
      that.payLogin()
      return
    }
    var sharePage = that.data.sharePage
    sharePage.flag = false
    that.setData({
      sharePage: sharePage
    })
  },

  //预览图片
  pImage: function(e) {
    console.log(e)
    let ratesindex = e.currentTarget.dataset.ratesindex
    let index = e.currentTarget.dataset.index
    let rate = this.data.fuwu.rates[ratesindex]
    let pathUrls = []
    rate.node.comment.images.forEach((it) => {
      pathUrls.push(it.url)
    })
    previewSwitch = true
    wx.previewImage({
      current: rate.node.comment.images[index].url,
      urls: pathUrls
    })
  },


  // 预览图片
  previewImage: function(e) {
    var current = e.target.dataset.src;
    console.log(current)
    wx.previewImage({
      current: current, // 当前显示图片的http链接  
      urls: this.data.tanchu_box.imageUrls.length == 0 ? this.data.imgDefault : this.data.tanchu_box.imageUrls // 需要预览的图片http链接列表  
    })
  },

  onTabsItemTap: function(e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      currTabsIndex: index
    })
    if (index == 1) {
      this.getRates()
    }
    if (index == 2) {
      this.getCardPoints(this.data.supplierId)
      this.getMember(this.data.supplierId)
    }
  },

  onTabsItemTap2: function(e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      currTabsIndex2: index
    })
    if (index == 1) {
      this.getWithdrawableCards(this.data.supplierId)
    }
  },

  getRates: function() {
    // QueryRates
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    let ratableId = that.data.supplierId
    gql({
      body: QueryRates(ratableId, first, after),
      success: res => {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        let rates = res.data.data.rates.edges
        after = res.data.data.rates.pageInfo.endCursor
        let ratesCount = res.data.data.ratesCount
        // console.log(rates)
        that.updataRates(rates, ratesCount, after)
      },
      fail: res => {}
    });
  },

  getMoreRates: function() {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    let first = that.data.first
    let after = that.data.after
    console.log(after)
    let ratableId = that.data.supplierId
    if (after == "") {
      wx.showToast({
        title: '没有了',
      })
      return
    }
    gql({
      body: QueryRates(ratableId, first, after),
      success: res => {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        let rates = res.data.data.rates.edges
        let fuwuRates = that.data.fuwu.rates
        rates.forEach((item) => {
          fuwuRates.push(item)
        })
        after = res.data.data.rates.pageInfo.endCursor
        let ratesCount = res.data.data.ratesCount
        console.log(rates)
        that.updataRates(fuwuRates, ratesCount, after)
      },
      fail: res => {}
    });
  },


  updataRates: function(rates, ratesCount, after) {
    let that = this
    rates.forEach((item) => {
      if (item.node.comment.images == null) {
        item.node.comment.images = []
      }
      // item.node.comment.time = moment(item.node.comment.updatedAt.toString(), "YYYYMMDD").fromNow(); // 7 年
      item.node.comment.time = moment(item.node.comment.createdAt).format('MM-DD HH:mm')
      if (item.node.comment.replies.edges.length !== 0) {
        item.node.comment.replies.edges.forEach((pro) => {
          // pro.node.time = moment(pro.node.createdAt, "YYYYMMDD").fromNow();
          pro.node.time = moment(pro.node.createdAt).format('MM-DD HH:mm')
        })
      }
      // item.node.comment.time = moment(item.node.comment.updatedAt).format('YY-MM-DD HH:mm:ss')
    })
    let fuwu = that.data.fuwu
    fuwu.rates = rates
    fuwu.comment_num = ratesCount
    this.setData({
      fuwu: fuwu,
      after: after,
    })
  },

  onReachBottom: function() {},

  bindCollection: function() {
    var isLogin = this.isLogin()
    // console.log(isLogin)
    if (isLogin == false) return

    var followed = this.data.followed
    if (followed == true) {
      var follow = false
      this.updateFollow(follow)
    } else {
      var follow = true
      this.updateFollow(follow)
    }
  },

  // 关注 取消关注
  updateFollow: function(followed) {
    var that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var input = {
      clientMutationId: 0,
      id: that.data.supplierId
    }
    if (followed == true) {
      gql({
        body: Follow(input),
        success: function(res) {
          // console.log("true,", res)
          if (res.data.error) {
            var error = res.data.error
            let floowedError = that.floowedError()
            if (floowedError == false) return
          }
          if (res.data.errors) {
            wx.showModal({
              title: '提示',
              content: res.data.errors[0].message,
            })
            that.setData({
              followed: true
            })
            return
          }
          that.setData({
            followed: true
          })
          wx.showToast({
            title: '已关注',
          })
          if (res.data.data.follow.wxCardLists !== null) {
            // console.log(1)
            that.add_card(res.data.data.follow.wxCardLists)
          }
          if (res.data.data.follow.rewardPoints !== 0) {
            wx.showModal({
              title: '获得积分',
              content: '恭喜您首次关注本店铺获得' + res.data.data.follow.rewardPoints + '积分',
            })
          }
        },
        fail: function(res) {}
      });
    } else {
      gql({
        body: Unfollow(input),
        success: function(res) {
          // console.log("false,", res)
          if (res.data.error) {
            var error = res.data.error
            let floowedError = that.floowedError()
            if (floowedError == false) return
          }
          that.setData({
            followed: false
          })
          wx.showToast({
            title: '取消关注',
          })
        },
        fail: function(res) {}
      });
    }
  },

  // 关注未登录状态处理
  floowedError: function() {
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
    return false
  },

  // 点赞
  zanCommentClick: function(e) {
    var isLogin = this.isLogin()
    if (isLogin == false) return
    let fuwu = this.data.fuwu
    let id = e.currentTarget.dataset.id
    let index = e.currentTarget.dataset.index
    let liked = e.currentTarget.dataset.liked
    this.updateLike(id, index, !liked)
  },

  updateLike: function(id, index, liked) {
    var that = this
    let fuwu = that.data.fuwu
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var input = {
      clientMutationId: 0,
      id: id
    }
    // console.log(liked, index)
    if (liked == true) {
      gql({
        body: Like(input),
        success: function(res) {
          if (res.statusCode == 401) {
            that.payLogin()
            return
          }
          // console.log("true,", res)
          fuwu.rates[index].node.comment.liked = true
          fuwu.rates[index].node.comment.likersCount = fuwu.rates[index].node.comment.likersCount + 1
          that.setData({
            fuwu: fuwu
          })
        },
        fail: function(res) {}
      });
    } else {
      gql({
        body: Unlike(input),
        success: function(res) {
          // console.log("false,", res)
          if (res.statusCode == 401) {
            that.payLogin()
            return
          }
          fuwu.rates[index].node.comment.liked = false
          fuwu.rates[index].node.comment.likersCount = fuwu.rates[index].node.comment.likersCount - 1
          that.setData({
            fuwu: fuwu
          })
        },
        fail: function(res) {}
      });
    }
  },

  // 第一次关注添加卡卷
  add_card: function(wxCardLists) {
    wx.addCard({
      cardList: wxCardLists,
      success(res) {
        console.log(res.cardList) // 卡券添加结果
      },
      fail(res) {
        console.log(res)
      }
    })
  },

  // 开启分享
  openShare: function() {
    wx.showShareMenu({
      withShareTicket: true,
    })
  },

  openShare_Yao:function(){
    let that = this
    var sharePage = that.data.sharePage
    sharePage.flag = false
    that.setData({
      sharePage: sharePage
    })
  },
  
  // 打开分享弹出
  lookShare:function(){
    let that = this
    var sharePage = that.data.sharePage
    var lookShare = wx.getStorageSync('lookShare') || ""
    console.log("缓存", lookShare)
    if (lookShare == "") {
      wx.setStorageSync('lookShare', false)
      sharePage.flag = false
    }else {
      sharePage.flag = lookShare
    }
    that.setData({
      sharePage: sharePage
    })
  },

  //关闭分享弹出
  lookedShare:function(){
    let that = this
    var sharePage = that.data.sharePage
    var lookShare = wx.getStorageSync('lookShare')
    wx.setStorageSync('lookShare', true)
    sharePage.flag = true
    that.setData({
      sharePage: sharePage
    })
  },

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

    this.setData({
      // followed: options.followed == false ? false : true, //是否已关注供应商
      supplierId: decodeURIComponent(options.id),
      supplierName: options.name
    })
    var supplierId = decodeURIComponent(options.id)
    app.getOpenId().then((token) => {
      app.globalData.token = token
      console.log(token)
      setTimeout(()=>{
        this.getCategories();
        var isLogin = this.isLogin()
        console.log(isLogin)
        if (isLogin == false) return
        this.getCartGroup(supplierId)
      },200)
    })

    // var isLogin = this.isLogin()
    // console.log(isLogin)
    // if (isLogin == false) return
    // this.getCartGroup(supplierId)
  },

  // 获取购物车列表数据
  getCartGroup: function(id) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });

    gql({
      body: CartGroup(id),
      success: function(res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          // that.getCartGroupError()
          return
        }
        // return
        let items = res.data.data.viewer.cartGroup.items
        if (items == null) {
          items = []
        }
        that.setData({
          cartGroupId: res.data.data.viewer.cartGroup.id,
          localList: items,
          // followed:
        })
        that.calculatedSum1(items)
        that.updateProductChange(items)
      },
      fail: function(res) {}
    });
  },

  getCartGroupError: function() {
    wx.showModal({
      title: '登录提示',
      content: '部分功能需要登录以后才能使用喔',
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
    return false
  },

  getCategories: function() {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    let input = {
      id: that.data.supplierId,
      supplierId: that.data.supplierId
    }
    gql({
      body: QueryMenu(that.data.supplierId),
      success: function(res) {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res.data.error)
          return
        }

        if (res.data.data.viewer.id) {
          that.setData({
            userId: res.data.data.viewer.id,
          })
        }
        
        if (res.data.data.supplier !== null) {
          wx.setNavigationBarTitle({
            title: res.data.data.supplier.name,
          })
          that.lookShare()
          let fuwu = that.data.fuwu
          fuwu.comment_num = res.data.data.ratesCount
          let sharePage = that.data.sharePage
          sharePage.name = res.data.data.supplier.name
          sharePage.shareReward = res.data.data.supplier.shareReward
          // sharePage.flag = res.data.data.readSupplierShareNoify
          // sharePage.flagActive= res.data.data.readSupplierShareNoify
          that.setData({
            fuwu: fuwu,
            followed: res.data.data.supplier.followed,
            supplierName: res.data.data.supplier.name,
            supplierId: res.data.data.supplier.id,
            store: {
              id: res.data.data.supplier.id,
              name: res.data.data.supplier.name, //商店名
              address: res.data.data.supplier.address, //地址
              industryName: res.data.data.supplier.industryName, //行业选择
              monthSales: res.data.data.supplier.monthSales, //销量
              businesses: res.data.data.supplier.businesses, //主营
              area: res.data.data.supplier.area,
              logo: res.data.data.supplier.logo,
              deliveryRate: res.data.data.supplier.deliveryRate.toFixed(1),
              deliveryRate1: parseInt(res.data.data.supplier.deliveryRate / 1),
              productRate: res.data.data.supplier.productRate.toFixed(1),
              productRate1: parseInt(res.data.data.supplier.productRate / 1),
              serviceRate: res.data.data.supplier.serviceRate.toFixed(1),
            },
            sharePage: sharePage
          })
          // if (res.data.data.supplier.area !== null) {
          //   app.globalData.areaId = res.data.data.supplier.area.id
          // }
        }
        if (res.data.data.viewer.categories.length > 0) {
          // console.log('categories:', res.data)
          let classifySeleted = res.data.data.viewer.categories[0].id
          that.setData({
            categories: res.data.data.viewer.categories,
            classifySeleted: classifySeleted,
            classifyViewedName: res.data.data.viewer.categories[0].name
          })
          that.getProductsByCategory(classifySeleted)
        } else {
          //没数据时需要处理的
          wx.showToast({
            title: '暂时没有数据'
          })
        }

      },
      fail: function(res) {}
    });
  },

  // 获取产品
  getProductsByCategory: function(categoryId) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });

    gql({
      body: Product(that.data.supplierId, categoryId),
      success: function(res) {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res.data.error)
          return
        }
        // console.log('products:-->', res.data.data.viewer.supplierProducts.edges)
        // 更新被选中状态
        var products = res.data.data.viewer.supplierProducts.edges
        var localList = that.data.localList
        if (localList !== undefined && localList.length !== 0) {
          let dataIds = localList.map(item => item.product.id)
          // console.log(dataIds)
          let productsIds = []
          products.forEach(pro => {
            productsIds.push(pro.node.product.id)
            if (dataIds.indexOf(pro.node.product.id) > -1) {
              // console.log(pro.node.product.id,pro.node.name)
              pro.node.selected = true
            } else {
              pro.node.selected = false
            }
          })
          // console.log(productsIds)
        }

        var newProducts = []
        products.forEach(pro => {
          newProducts.push({
            node: {
              id: pro.node.id,
              kindDesc: pro.node.kindDesc,
              kindName: pro.node.kindName,
              name: pro.node.name.replace(/\s+/, ''),
              pkind: pro.node.pkind,
              price: pro.node.price,
              unit: pro.node.unit,
              imageUrls: pro.node.product.imageUrls,
              promotionProduct: pro.node.promotionProduct,
              unitList: pro.node.unitList,
              selected: pro.node.selected,
              product: pro.node.product
            },
            data: that.productTitle(pro.node),
          })
        })
        // console.log(newProducts)
        // console.log(localList)
        newProducts.forEach((pro) => {
          localList.forEach((item) => {
            if (pro.node.selected == true) {
              if (pro.node.product.id === item.product.id) {
                pro.cart = item
              }
            }
          })
        })
        that.setData({
          products: newProducts,
        })
        // console.log(newProducts)
      },
      fail: function(res) {}
    });
  },
  //去登录
  goLogin: function() {
    wx.navigateTo({
      url: '/pages/authorize/index',
      success: res => {
        this.setData({
          refreshPage: true,
        })
      }
    })
  },

  onShow: function(options) {
    if (previewSwitch) {
      previewSwitch = false
      return
    }
    if (this.data.refreshPage == true) {
      this.getCartGroup(this.data.supplierId)
    }
    let userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      this.setData({
        userInfo: null,
      })
    } else {
      this.setData({
        userInfo: userInfo
      })
    }
    this.setData({
      currTabsIndex: 0
    })
    // console.log(userInfo)
  },

  onUnload: function() {

  },

  tapClassify: function(e) {
    var id = e.target.dataset.id;
    var name = e.target.dataset.name;
    this.setData({
      classifyViewed: id,
      classifyViewedName: name
    });
    var self = this;
    setTimeout(function() {
      self.setData({
        classifySeleted: id
      });
    }, 100);
    this.getProductsByCategory(id)
  },

  showCartDetail: function() {
    // console.log(this.data.localList)
    if (this.data.localList.length == 0) return
    this.setData({
      showCartDetail: !this.data.showCartDetail
    });
  },
  hideCartDetail: function() {
    this.setData({
      showCartDetail: false
    });
  },


  //商品栏加减
  addProductItem: function(e) {
    let that = this
    let products = that.data.products
    let id = e.currentTarget.dataset.id
    let index = e.currentTarget.dataset.index
    var num = products[index].cart.quantity
    num = products[index].cart.quantity + 1
    // return
    let input = {
      clientMutationId: 0,
      id: id,
      quantity: num
    }
    console.log(input)
    // return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: UpdateCartItem(input),
      success: function(res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res.data.error)
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '温馨提示',
            content: errors[0].message,
          })
          return
        }
        products[index].cart.quantity = products[index].cart.quantity + 1
        var items = res.data.data.updateCartItem.cartGroup.items
        if (items == null) {
          items = []
        }
        that.setData({
          localList: items,
          products: products,
        })
        that.calculatedSum1(items)
      },
      fail: function(errors) {
        console.log(errors);
      }
    });
  },
  jianProductItem: throttle(function(e) {
    let that = this
    let products = that.data.products
    let id = e.currentTarget.dataset.id
    let index = e.currentTarget.dataset.index
    console.log(products[index].cart.quantity)
    var num = products[index].cart.quantity
    num = products[index].cart.quantity - 1
    // return
    let input = {
      clientMutationId: 0,
      id: id,
      quantity: num
    }
    console.log(input)
    // if(input.quantity == 0) return
    // return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: UpdateCartItem(input),
      success: function(res) {
        console.log(res)
        console.log(2)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res.data.error)
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '温馨提示',
            content: errors[0].message,
          })
          return
        }
        var items = res.data.data.updateCartItem.cartGroup.items
        if (items == null) {
          items = []
        }
        if (items.length == 0) {
          that.setData({
            localList: items,
          })
          that.calculatedSum1(items)
          that.updateProductChange(items)
          return
        }
        products[index].cart.quantity = products[index].cart.quantity - 1
        that.setData({
          localList: items,
          products: products,
        })
        that.calculatedSum1(items)
        that.updateProductChange(items)
      },
      fail: function(errors) {
        console.log(errors);
      }
    });
  }, 400),

  // 购物车加减改变商品栏
  updateProductChange: function(items) {
    // console.log(items)
    var newProducts = this.data.products
    if (items !== undefined && items.length !== 0) {
      let dataIds = items.map(item => item.product.id)
      // console.log(dataIds)
      let productsIds = []
      newProducts.forEach(pro => {
        productsIds.push(pro.node.product.id)
        if (dataIds.indexOf(pro.node.product.id) > -1) {
          // console.log(pro.node.product.id,pro.node.name)
          pro.node.selected = true
        } else {
          pro.node.selected = false
        }
      })
    } else {
      newProducts.forEach(pro => {
        pro.node.selected = false
      })
    }
    newProducts.forEach((pro) => {
      if (pro.cart && pro.cart.quantity == 0) {
        pro.node.selected = false
        pro.cart = undefined
      }
      // console.log("pro===>", pro)
      items.forEach((item) => {
        if (pro.node.selected == true) {
          if (pro.node.product.id === item.product.id) {
            pro.cart = item
            if (pro.cart.quantity == 0) {
              pro.node.selected = false
            }
          }
        }
      })
    })

    this.setData({
      products: newProducts,
    })
    // console.log(newProducts)
  },

  // 购物车加减
  addCartItem: function(e) {
    let that = this
    let localList = that.data.localList
    let id = e.currentTarget.dataset.id
    let index = e.currentTarget.dataset.index
    var num = localList[index].quantity
    num = localList[index].quantity + 1
    let input = {
      clientMutationId: 0,
      id: id,
      quantity: num
    }
    console.log(input)
    // return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: UpdateCartItem(input),
      success: function(res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res.data.error)
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '温馨提示',
            content: errors[0].message,
          })
          return
        }
        var items = res.data.data.updateCartItem.cartGroup.items
        if (items == null) {
          items = []
        }
        that.setData({
          localList: items
        })
        that.calculatedSum1(items)
        that.updateProductChange(items)
      },
      fail: function(errors) {
        console.log(errors);
      }
    });
  },

  jianCartIten: throttle(function(e) {
    let that = this
    let localList = that.data.localList
    let id = e.currentTarget.dataset.id
    let index = e.currentTarget.dataset.index
    var num = localList[index].quantity
    num = localList[index].quantity - 1
    let input = {
      clientMutationId: 0,
      id: id,
      quantity: num
    }
    console.log(input)
    // return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: UpdateCartItem(input),
      success: function(res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res.data.error)
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '温馨提示',
            content: errors[0].message,
          })
          return
        }
        var items = res.data.data.updateCartItem.cartGroup.items
        if (items == null) {
          items = []
        }
        that.setData({
          localList: items
        })
        that.calculatedSum1(items)
        that.updateProductChange(items)
      },
      fail: function(errors) {
        console.log(errors);
      }
    });
  }, 400),

  //删除购物车行
  deleteCartItem: function(e) {
    console.log(e)
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    let input = {
      clientMutationId: 0,
      id: e.currentTarget.dataset.id
    }
    gql({
      body: DeleteCartItem(input),
      success: function(res) {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res.data.error)
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '温馨提示',
            content: errors[0].message,
          })
          return
        }
        // console.log(res)
        var items = res.data.data.deleteCartItem.cartGroup.items
        if (items == null) {
          items = []
        }
        that.setData({
          localList: items
        })
        that.calculatedSum1(items)
      }
    })
  },

  calculatedSum1: function(loaclList) {
    var count = 0
    var total = 0
    // console.log(loaclList)
    if (loaclList.length == 0) {
      this.setData({
        showCartDetail: false,
        cart: {
          count: count,
          total: total,
        }
      })
      return
    }
    for (var i = 0; i < loaclList.length; i++) {
      // count += loaclList[i].quantity
      total += loaclList[i].price * loaclList[i].quantity
    }
    this.setData({
      cart: {
        count: loaclList.length,
        total: total,
      }
    })
  },

  getStorageCart: function(currentStatu) {
    wx.getStorage({
      key: 'cart',
      success: res => {
        if (currentStatu == null) {
          this.setData({
            localList: res.data,
            cartList: res.data,
          })
          setTimeout(() => {
            wx.hideToast()
          }, 1000)
          this.calculatedSum(res.data)
          return
        } else {
          this.setData({
            localList: res.data,
            cartList: res.data,
            currentStatu: currentStatu
          })
          setTimeout(() => {
            wx.hideToast()
          }, 1000)
          this.calculatedSum(res.data)
          this.biaoshi(res.data)
        }
      },
    })
  },

  //提取 规格
  productTitle: function(node) {
    var {
      name,
      ...other
    } = node;
    // console.log(name)
    var ml = null;
    name = name.replace(/(\d+(ml|g))/, (m) => {
      ml = m;
      return ""
    })
    return {
      name: name,
      nodes: [{
        name: 'div',
        children: [{
          type: 'text',
          text: name.replace(/\s+/, ''),
        }, {
          name: 'span',
          attrs: {
            class: 'ml-text'
          },
          children: [{
            type: 'text',
            text: ml
          }]
        }]
      }],
      ...other
    };
  },
  // =================

  bindGoto_detail: function(e) {
    var id = e.currentTarget.dataset.item.node.id
    var index = e.currentTarget.dataset.index
    // console.log(e.target.dataset.item)
    var item = e.currentTarget.dataset.item.node
    var cart = e.currentTarget.dataset.item.cart
    // console.log(item,cart)
    var quantity = 0
    if (item.promotionProduct == null) {
      quantity = 1
    } else {
      quantity = item.promotionProduct.quantity == 0 ? 1 : item.promotionProduct.quantity
      item.sales = item.promotionProduct.sales
      if (cart !== undefined) {
        // quantity = cart.quantity
      }
    }
    let product_detail = {
      cart: item.cart,
      id: item.id,
      name: item.name,
      price: item.price,
      unit: item.unit,
      quantity: quantity,
      num: quantity,
      supplier:{
        id:this.data.supplierId,
        name:this.data.supplierName,
      },
      pkind: item.pkind,
      kindName: item.kindName,
      kindDesc: item.kindDesc,
      promotionProduct: item.promotionProduct,
      img: item.imageUrls.length == 0 ? undefined : item.imageUrls[0],
      imageUrls: item.imageUrls,
      imgDefault: this.data.imgDefault,
      amount: item.promotionProduct == null ? 0 : item.promotionProduct.amount,
      sales: item.promotionProduct == null ? 0 : item.promotionProduct.sales,
      inventory: item.promotionProduct == null ? item.unitList[0].inventory : item.promotionProduct.inventory - item.promotionProduct.sales,
      boughtQuantity: item.promotionProduct == null ? 0 : item.promotionProduct.boughtQuantity,
      customerLimit: item.promotionProduct == null ? 0 : item.promotionProduct.customerLimit,
      discountRate: item.promotionProduct == null ? 0 : item.promotionProduct.discountRate,
      discountAmount: item.promotionProduct == null ? 0 : item.promotionProduct.discountAmount,
    }
    this.setData({
      refreshPage: true
    })
    app.globalData.product_detail = product_detail
    wx.navigateTo({
      url: '/pages/category/product/product?id=' + encodeURIComponent(id),
    })
  },
  // ==============
  // 显示弹出详情
  bindShowActive: function(e) {
    var index = e.currentTarget.dataset.index
    // console.log(e.target.dataset.item)
    var item = e.currentTarget.dataset.item.node
    var cart = e.currentTarget.dataset.item.cart
    // console.log(item,cart)
    var quantity = 0
    if (item.promotionProduct == null) {
      quantity = 1
    } else {
      quantity = item.promotionProduct.quantity == 0 ? 1 : item.promotionProduct.quantity
      item.sales = item.promotionProduct.sales
      if (cart !== undefined) {
        // quantity = cart.quantity
      }
    }
    this.setData({
      tanchu_box: {
        cart: item.cart,
        id: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        quantity: quantity,
        num: quantity,
        pkind: item.pkind,
        kindName: item.kindName,
        kindDesc: item.kindDesc,
        promotionProduct: item.promotionProduct,
        img: item.imageUrls.length == 0 ? undefined : item.imageUrls[0],
        imageUrls: item.imageUrls,
        imgDefault: this.data.imgDefault,
        amount: item.promotionProduct == null ? 0 : item.promotionProduct.amount,
        sales: item.promotionProduct == null ? 0 : item.promotionProduct.sales,
        inventory: item.promotionProduct == null ? item.unitList[0].inventory : item.promotionProduct.inventory - item.promotionProduct.sales,
        boughtQuantity: item.promotionProduct == null ? 0 : item.promotionProduct.boughtQuantity,
        customerLimit: item.promotionProduct == null ? 0 : item.promotionProduct.customerLimit,
        discountRate: item.promotionProduct == null ? 0 : item.promotionProduct.discountRate,
        discountAmount: item.promotionProduct == null ? 0 : item.promotionProduct.discountAmount,
      },
      showActivePage: false,
    })
  },

  closeActivePage: function() {
    this.setData({
      showActivePage: true,
      tanchu_box: {}
    })
  },
  closeErrors: function() {
    // 点击其他区域隐藏
    this.setData({
      showErrors: true,
    })
  },
  onHide: function() {
    this.setData({
      showActivePage: true,
      tanchu_box: {},
      showCartDetail: false,
    })
  },

  // 购买登录提示
  payLogin: function() {
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
  },

  //加入购物车
  addCar: throttle(function(e) {
    var that = this
    var isLogin = that.isLogin()
    console.log(isLogin)
    if (isLogin == false) return
    var isInventory = that.isInventory()
    if (isInventory == false) return
    var item = that.data.tanchu_box
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var input = {
      clientMutationId: 0,
      items: [{
        productId: item.id,
        quantity: item.quantity,
        unit: item.unit
      }],
    }
    gql({
      body: AddCartItems(input),
      success: function(res) {
        // console.log(res.data.errors)
        if (res.statusCode == "401") {
          // client.ErrMsg(res.data.error)
          that.payLogin()
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
        wx.showToast({
          title: '已添加',
        })
        that.getCartGroup(that.data.supplierId)
      },
      fail: function(res) {
        wx.showToast({
          title: '操作失败',
          icon: 'none',
          duration: 2000,
        })
      },
    })
  }, 1000),

  //立即购买
  goToCar: throttle(function(e) {
    var that = this
    var isLogin = that.isLogin()
    if (isLogin == false) return
    var isInventory = that.isInventory()
    if (isInventory == false) return
    var item = that.data.tanchu_box
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var input = {
      clientMutationId: 0,
      items: [{
        productId: item.id,
        quantity: item.quantity,
        unit: item.unit
      }],
    }
    gql({
      body: AddCartItems(input),
      success: function(res) {
        // console.log(res.data.errors)
        if (res.statusCode == "401") {
          // client.ErrMsg(res.data.error)
          that.payLogin()
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
        that.setData({
          showDialog: false,
        })
        let url = "shop"
        that.setData({
          refreshPage: true,
        })
        wx.navigateTo({
          url: '/pages/cart/index?url=' + url,
        })
      },
      fail: function(res) {
        wx.showToast({
          title: '操作失败',
          icon: 'none',
          duration: 2000,
        })
      },
    })
  }, 1500),
  //删除购物车
  deleteCart: function(e) {
    let that = this;
    let input = {
      clientMutationId: 0,
      id: that.data.cartGroupId,
    }
    console.log(input)
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    wx.showModal({
      title: '清除购物车',
      content: '确定要清除购物车吗？',
      success: function(res) {
        if (res.confirm) {
          gql({
            body: DeleteCart(input),
            success: function(res) {
              // console.log(res)
              if (res.data.data.deleteCartGroup.status == "ok") {
                var localList = []
                that.setData({
                  localList: localList,
                  showCartDetail: false,
                })
                that.updateProductChange(localList)
              } else {
                wx.showToast({
                  title: '删除',
                  icon: '删除失败'
                })
              }
            },
            fail: function(errors) {
              console.log(errors);
            }
          });
        } else if (res.cancel) {
          console.log('取消')
        }
      }
    })
  },
  // 去结算
  goToCar1: throttle(function(e) {
    var isLogin = this.isLogin()
    console.log(isLogin)
    if (isLogin == false) return
    let url = "shop"
    this.setData({
      refreshPage: true,
    })
    wx.navigateTo({
      url: '/pages/cart/index?url=' + url,
    })
  }, 1000),

  toggleDialog: function(e) {
    var isLogin = this.isLogin()
    console.log(isLogin)
    if (isLogin == false) return
    // console.log(e.target.dataset.item)
    var item = e.target.dataset.item
    // console.log(item)
    var quantity = 0
    if (item.promotionProduct == null) {
      quantity = 1
    } else {
      quantity = item.promotionProduct.quantity == 0 ? 1 : item.promotionProduct.quantity
      item.sales = item.promotionProduct.sales
    }
    this.setData({
      tanchu_box: {
        id: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        quantity: quantity,
        num: quantity,
        kindName: item.kindName,
        kindDesc: item.kindDesc,
        promotionProduct: item.promotionProduct,
        img: item.imageUrls.length == 0 ? undefined : item.imageUrls[0],
        amount: item.promotionProduct == null ? 0 : item.promotionProduct.amount,
        sales: item.promotionProduct == null ? 0 : item.promotionProduct.sales,
        inventory: item.promotionProduct == null ? item.unitList[0].inventory : item.promotionProduct.inventory - item.promotionProduct.sales,
        boughtQuantity: item.promotionProduct == null ? 0 : item.promotionProduct.boughtQuantity,
        customerLimit: item.promotionProduct == null ? 0 : item.promotionProduct.customerLimit,
        discountRate: item.promotionProduct == null ? 0 : item.promotionProduct.discountRate,
        discountAmount: item.promotionProduct == null ? 0 : item.promotionProduct.discountAmount,
      },
      showDialog: true
    })
    console.log(this.data.tanchu_box)
  },

  closeDialog: function(e) {
    this.setData({
      tanchu_box: {},
      showDialog: false
    })
  },
  // 是否登入
  isLogin: function() {
    let userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showModal({
        title: '登录提示',
        content: '需要登录以后才可以进行购买等相关操作',
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
      return false
    } else {
      return true
    }
  },
  // 库存是否足够
  isInventory: function() {
    let inventory = this.data.tanchu_box.inventory
    if (inventory <= 0) {
      wx.showToast({
        title: '库存不足',
      })
      return false
    } else {
      return true
    }
  },

  bindMinus: function() {
    var item = this.data.tanchu_box;
    // 如果大于1时，才可以减
    if (item.quantity > 1) {
      item.quantity--;
    }
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = item.quantity <= 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      tanchu_box: item,
      minusStatus: minusStatus
    });
  },
  /* 点击加号 */
  bindPlus: function() {
    var item = this.data.tanchu_box;
    if (item.inventory <= 0) {
      item.quantity = 0
      this.setData({
        tanchu_box: item,
      })
      return
    }
    if (item.quantity >= item.inventory) {
      item.quantity = item.inventory
    } else {
      // 不作过多考虑自增1
      item.quantity++;
    }
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = item.quantity < 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      tanchu_box: item,
      minusStatus: minusStatus
    });
  },
  aaa: function(inputData) {
    if (parseInt(inputData).toString() == "NaN") {
      return false
    } else {
      return true
    }
  },
  /* 输入框事件 */
  bindManual: function(e) {
    var item = this.data.tanchu_box;
    // var reg = this.aaa(e.detail.value)
    // console.log(reg)
    // if (reg == false) return
    // item.quantity = e.detail.value
    // this.setData({
    //   tanchu_box:item
    // })
    // return
    if (item.inventory <= 0) {
      item.quantity = 0
      this.setData({
        tanchu_box: item,
      })
      return
    }
    if (e.detail.value >= item.inventory) {
      item.quantity = item.inventory
      this.setData({
        tanchu_box: item,
      })
      return
    }
    var guding1 = Math.ceil(item.amount / item.price)
    if (item.amount == 0) {
      console.log("没amount", item.amount, item.quantity, e.detail.value, item.num)
      item.quantity = e.detail.value < item.num ? item.num : e.detail.value
      this.setData({
        tanchu_box: item
      });
      return
    } else {
      console.log("有amount", item.amount, guding1, e.detail.value)
      item.quantity = e.detail.value <= guding1 ? guding1 : e.detail.value
    }
    if (guding1 == 0) {
      console.log("0", guding1)
      item.quantity = e.detail.value;
    } else {
      console.log("!=0", guding1)
      item.quantity = e.detail.value <= guding1 ? guding1 : e.detail.value
    }
    this.setData({
      tanchu_box: item
    });
    // 将数值与状态写回
  },
  // bindfocusManual:function(){
  //   var item = this.data.tanchu_box;
  //   item.quantity = ""
  //   this.setData({
  //     tanchu_box:item,
  //   })
  // },
  bindPickerChange: function(e) {
    // console.log('picker发送选择改变，携带值为', e.detail.value)
    var item = this.data.tanchu_box;
    var array = this.data.array
    item.quantity = array[e.detail.value]
    this.setData({
      tanchu_box: item
    })
  },

  //    用户点击右上角分享  
  onShareAppMessage: function(res) {
    let that = this
    var supplierId = that.data.supplierId
    // let sharePage = that.data.sharePage
    // sharePage.flag = true
    // that.setData({
    //   sharePage: sharePage
    // })
    // that.closeShare()
    that.lookedShare()
    var fromPage = that.route + "?supplierId=" + supplierId
    var toPage = that.route + "?supplierId=" + supplierId
    var token = app.globalData.UserId + new Date().getTime()
    GetShareToken(supplierId, fromPage, toPage, token).then((t) => {
      console.log("得到token")
      // console.log(t)
    })
    let url = '/pages/category/category?id=' + encodeURIComponent(supplierId) + '&t=' + encodeURIComponent(token)
    console.log(url)
    if (res.from === 'button') {

      console.log(res.target, res)
      return {
        title: that.data.supplierName,
        path: url
      }
      return
    }
    
    return {
      title: that.data.supplierName,
      path: url
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
        var statusCode = res.statusCode
        if (statusCode == "401") {
          // client.ErrMsg(res)
          return
        }
        if (res.data.data.member !== null) {
          that.setData({
            member: res.data.data.member
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
      body: ExchangeableCards(supplierId, first, after),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          console.log(1)
          return
        }
        // console.log(res)
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
  updataCards: function(value) {
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
      body: WithdrawableCards(supplierId, first, after),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        // console.log(res)
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
  checkCard: throttle(function(e) {
    let that = this
    let card = e.currentTarget.dataset.item
    let currTabsIndex2 = that.data.currTabsIndex2
    console.log(card)
    // currTabsIndex 页面为０
    if (currTabsIndex2 == 0) {
      wx.showModal({
        title: '兑换提示',
        content: '本张优惠卷需要  ' + card.points + "  积分",
        success(res) {
          if (res.confirm) {
            that.exchangeCard(card)
          }
        }
      })
    } else if (currTabsIndex2 == 1) {
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
  add_receiveCard: function(wxCardLists) {
    let that = this
    previewSwitch = true
    wx.addCard({
      cardList: wxCardLists,
      success(res) {
        // console.log(res)
        that.getWithdrawableCards(that.data.supplierId)
      },
      fail(res) {
        console.log(res)
      },
    })
  },

  // 添加卡卷
  add_card: function(wxCardLists, card) {
    let that = this
    let member = that.data.member
    member.points = member.points - card.points //减少积分
    that.setData({
      member: member,
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
      },
      complete() {
        previewSwitch = true
      },
    })
  },
})