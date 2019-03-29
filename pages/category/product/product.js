var app = getApp()
var server = require('../../../utils/util.js');
const api = require('../../../config/api.js')
const client = require('../../../utils/graphql.js')
const {
  ProductId
} = require('../../../models/category/product.js')
const {
  AddCartItems
} = require('../../../models/shop/addCartItems.js')
const {
  Like,
  Unlike
} = require('../../../models/category/like.js')
const {
  QueryRates
} = require('../../../models/category/rates.js')
const moment = require('../../../utils/moment.js')
moment.locale('zh-cn');
var previewSwitch

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLike: true,
    // banner
    imgUrls: [
"https://assets.jiejie.io/internet/weishangchuan.jpeg",
"https://assets.jiejie.io/internet/weishangchuan.jpeg",
    ],
    indicatorDots: true, //是否显示面板指示点
    autoplay: true, //是否自动切换
    interval: 3000, //自动切换时间间隔,3s
    duration: 1000, //  滑动动画时长1s
    // 商品详情介绍
    detailImg: [
"https://assets.jiejie.io/internet/weishangchuan.jpeg", "https://assets.jiejie.io/internet/weishangchuan.jpeg",
"https://assets.jiejie.io/internet/weishangchuan.jpeg",
    ],
    product: null,
    showDialog: false,
    tanchu_box: {}, //规格弹出层数据
    imgDefault: ["https://assets.jiejie.io/internet/weishangchuan.jpeg"],
    refreshPage: false, //默认关闭show,刷新购物车
    fuwu: {
      active:"detail",
      lookNum: '',
      comment_num: 2,
      rates: [],
      stars: [0, 1, 2, 3, 4],
      normalSrc: '../../../images/order-details/start_no.png',
      selectedSrc: '../../../images/order-details/start_yes.png',
    },
    isRates: true, //评论默认展开
    first:10,
    after:""
  },

  //预览图片
  pImage: function (e) {
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

  showRates: function() {
    let isRates = this.data.isRates
    if (isRates == true) {
      this.setData({
        isRates: false
      })
    } else {
      this.setData({
        isRates: true
      })
    }
  },

  getProduct: function(id) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });

    gql({
      body: ProductId(id),
      success: function(res) {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res.data.error)
          return
        }
        console.log(res)
        let product = res.data.data.product
        if(product == null) return
        product.name = product.name.replace(/\s+/, '')
        product.productUnits.forEach((pro) => {
          if (pro.isDefault == true) {
            product.price = pro.price
            product.unit = pro.name
            product.inventory = pro.inventory
            product.quantity = 1
          }
        })
        that.setData({
          product: product
        })
        // console.log(res)
      },
      fail: function(res) {}
    })
  },

  //预览图片
  previewImage: function(e) {
    var current = e.target.dataset.src;
    wx.previewImage({
      current: current, // 当前显示图片的http链接  
      urls: this.data.product.imageUrls.length !== 0 ? this.data.product.imageUrls : this.data.imgUrls // 需要预览的图片http链接列表  
    })
  },
  // 收藏
  addLike() {
    this.setData({
      isLike: !this.data.isLike
    });
  },
  // 跳到购物车
  toCar() {
    let url = "shop"
    this.setData({
      refreshPage: true,
    })
    wx.navigateTo({
      url: '/pages/cart/index?url=' + url,
    })
  },
  // 立即购买
  immeBuy() {
    wx.showToast({
      title: '购买成功',
      icon: 'success',
      duration: 2000
    });
  },
  //加入购物车
  addCar: function(e) {
    var that = this
    var isLogin = that.isLogin()
    console.log(isLogin)
    if (isLogin == false) return
    var isInventory = that.isInventory()
    if (isInventory == false) return
    var item = that.data.product
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
    if (input.items[0].quantity == 0) {
      wx.showToast({
        title: '数量不能为0',
      })
      return
    }
    gql({
      body: AddCartItems(input),
      success: function(res) {
        // console.log(res.data.errors)
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
        // that.getCartGroup(that.data.supplierId)
      },
      fail: function(res) {
        wx.showToast({
          title: '操作失败',
          icon: 'none',
          duration: 2000,
        })
      },
    })
  },

  //立即购买
  goToCar: function(e) {
    var that = this
    var isLogin = that.isLogin()
    console.log(isLogin)
    if (isLogin == false) return
    var isInventory = that.isInventory()
    if (isInventory == false) return
    var item = that.data.product
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
    if (input.items[0].quantity == 0) {
      wx.showToast({
        title: '数量不能为0',
      })
      return
    }
    gql({
      body: AddCartItems(input),
      success: function(res) {
        // console.log(res.data.errors)
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
  },

  // 是否登入
  isLogin: function() {
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
      return false
    } else {
      return true
    }
  },

  // 库存是否足够
  isInventory: function() {
    let inventory = this.data.product.inventory
    if (inventory <= 0) {
      wx.showToast({
        title: '库存不足',
      })
      return false
    } else {
      return true
    }
  },

  toggleDialog: function(e) {
    var isLogin = this.isLogin()
    if (isLogin == false) return
    this.setData({
      showDialog: true,
    })
    // console.log(this.data.product)
  },

  closeDialog: function(e) {
    this.setData({
      showDialog: false
    })
  },

  bindMinus: function() {
    var item = this.data.product;
    // 如果大于1时，才可以减
    if (item.quantity > 1) {
      item.quantity--;
    }
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = item.quantity <= 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      product: item,
      minusStatus: minusStatus
    });
  },
  /* 点击加号 */
  bindPlus: function() {
    var item = this.data.product;
    if (item.quantity >= item.inventory) {
      // item.quantity = item.inventory
      item.quantity++
    } else {
      item.quantity++;
    }
    var minusStatus = item.quantity < 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      product: item,
      minusStatus: minusStatus
    });
  },
  /* 输入框事件 */
  bindManual: function(e) {
    var item = this.data.product;
    if (e.detail.value >= item.inventory) {
      if (item.num !== 0) {
        if (e.detail.value >= item.inventory) {
          item.quantity = item.inventory
        } else {
          item.quantity = item.num
        }
      } else {
        item.quantity = e.detail.value
      }
      this.setData({
        product: item,
      })
      return
    }
    var guding1 = Math.ceil(item.amount / item.price)
    if (item.amount == 0) {
      console.log("没amount", item.amount, item.quantity, e.detail.value, item.num)
      // item.quantity = e.detail.value < item.num ? item.num : e.detail.value
      item.quantity = e.detail.value
      this.setData({
        product: item
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
      product: item
    });
    // 将数值与状态写回
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    if (options.id) {
      this.setData({
        id: decodeURIComponent(options.id),
        product: app.globalData.product_detail
      })
      this.getProduct(decodeURIComponent(options.id))
      this.getRates(decodeURIComponent(options.id))
      console.log(app.globalData.product_detail)
    }
  },

  getRates: function(ratableId) {
    // QueryRates
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    gql({
      body: QueryRates(ratableId, first, after),
      success: res => {
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        let rates = res.data.data.rates.edges
        after = res.data.data.rates.pageInfo.endCursor
        let ratesCount = res.data.data.ratesCount
        // console.log(rates)
        // console.log(this.data.after)
        that.updataRates(rates, ratesCount,after)
      },
      fail: res => {}
    });
  },

  getMoreRates: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    let first = that.data.first
    let after = that.data.after
    console.log(after)
    let ratableId = that.data.id
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
      fail: res => { }
    });
  },

  updataRates: function (rates, ratesCount, after) {
    let that = this
    rates.forEach((item) => {
      if (item.node.comment.images == null) {
        item.node.comment.images = []
      }
      item.node.comment.replies.edges = [] //设置回复消息为空
      item.node.comment.time = moment(item.node.comment.createdAt).format('MM-DD HH:mm')
      if (item.node.comment.replies.edges.length !== 0) {
        item.node.comment.replies.edges.forEach((pro) => {
          pro.node.time = moment(pro.node.createdAt).format('MM-DD HH:mm')
        })
      }
    })
    let fuwu = that.data.fuwu
    fuwu.rates = rates
    fuwu.comment_num = ratesCount
    this.setData({
      fuwu: fuwu,
      after: after
    })
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
    console.log(liked, index)
    if (liked == true) {
      gql({
        body: Like(input),
        success: function(res) {
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    app.globalData.product_detail = null
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
  onShareAppMessage: function() {
    let title ="¥" + this.data.product.price + " /" + this.data.product.unit
    let url = '/pages/category/product/product?id=' + encodeURIComponent(this.data.product.id)
      return {
        title,
        path:url
      }
  }
})