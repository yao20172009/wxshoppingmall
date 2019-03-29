var app = getApp()
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')

const {
  SearchProducts
} = require('../../models/mallApi/searchProducts.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    search: {
      inputShowed: true,
      inputVal: "",
      commodities: null,
      searchHistory: [],
    },
    first: 10,
    after: "",
    products: [], //产品数据
    hasNextPage: true,
    scrollTop: 0,
    floorstatus: false,
    one:true,
  },

  /**
   * 搜索栏控制函数 - 搜索框输入状态
   */
  showInput: function() {
    let search = this.data.search
    search.inputShowed = true
    this.setData({
      search: search
    });
  },

  hideInput: function() {
    let search = this.data.search
    search.inputVal = ""
    search.inputShowed = false
    this.setData({
      search: search
    });
  },
  /**
   * 搜索栏控制函数 - 反转inputShowed
   */
  switchInputShowed: function() {
    let search = this.data.search
    search.inputShowed = !search.inputShowed;
    this.setData({
      search: search
    });
  },

  /**
   * 搜索栏控制函数 - 清空搜索框内容
   */
  clearInput: function() {
    let search = this.data.search
    search.inputVal = ""
    this.setData({
      search: search
    });
  },

  inputTyping: function(e) {
    let search = this.data.search
    search.inputVal = e.detail.value
    this.setData({
      search: search,
    });
    this.getProducts(e.detail.value)
  },

  getProducts: function(value) {
    let that = this;
    let q = value
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    gql({
      body: SearchProducts(first, after, q),
      success: res => {
        // console.log(res)
        let products = res.data.data.searchProducts.edges
        let hasNextPage = res.data.data.searchProducts.pageInfo.hasNextPage
        let after = res.data.data.searchProducts.pageInfo.endCursor
        products.forEach((pro) => {
          if (pro.node.productUnits !== null) {
            pro.node.productUnits.forEach((unt) => {
              if (unt.isDefault == true) {
                pro.node.price = unt.price
                pro.node.unit = unt.name
                pro.node.unitId = unt.id
                pro.node.inventory = unt.inventory
              }
            })
          }
        })
        that.setData({
          products: products,
          hasNextPage: hasNextPage,
          after: after,
          one: false,
        })
        // console.log(products)
      },
      fail: res => {},
    })
  },

  getMoreProducts: function() {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let hasNextPage = that.data.hasNextPage
    if (hasNextPage == false) return
    let first = that.data.first
    let after = that.data.after
    let q = that.data.search.inputVal
    gql({
      body: SearchProducts(first, after, q),
      　 //　ｂｏｄｙ == 数据结构　　
      success: function(res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        let products = that.data.products
        let newProducts = res.data.data.searchProducts.edges
        let hasNextPage = res.data.data.searchProducts.pageInfo.hasNextPage
        let after = res.data.data.searchProducts.pageInfo.endCursor
        newProducts.forEach((pro) => {
          // pro.node.name = oneMenuName + " - " + pro.node.name
          if (pro.node.productUnits !== null) {
            pro.node.productUnits.forEach((unt) => {
              if (unt.isDefault == true) {
                pro.node.price = unt.price
                pro.node.unit = unt.name
                pro.node.unitId = unt.id
                pro.node.inventory = unt.inventory
              }
            })
          }
        })
        newProducts.forEach((item) => {
          products.push(item)
        })
        that.setData({
          products: products,
          hasNextPage: hasNextPage,
          after: after,
        })
        // console.log(products)
      },
      fail: function(res) {}
    })
  },
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

    app.globalData.product_detail = product_detail
    wx.navigateTo({
      url: '/pages/category/product/product?id=' + encodeURIComponent(id),
    })
  },

  // downloadMoreItem: function (e) {
  //   console.log(11)
  //   this.getMoreProducts()
  // },

  //  商品点击事件 - 待完善
  itemTap: function (e) {
    let products = this.data.products
    let index = e.currentTarget.dataset.idx
    let item = products[index].node
    let id = item.id
    let product_detail = {
      cart: null,
      id: id,
      name: item.name,
      price: item.price,
      unit: item.unit,
      quantity: 1,
      inventory: item.inventory,
      imageUrls: item.imageUrls,
      supplier: item.supplier
    }
    app.globalData.product_detail = product_detail
    wx.navigateTo({
      url: '/pages/category/product/product?id=' + encodeURIComponent(id),
    })
  },

  // goTop: function (e) {
  //   this.setData({
  //     scrollTop: 0
  //   })
  // },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

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
    // console.log(11)
    this.getMoreProducts()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})