var app = getApp()
const api = require('../../../config/api.js')
const client = require('../../../utils/graphql.js')
const { AlterOrder } = require('../../../models/order/alterOrder.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    item: {},
    orderId: "",
    itemId: "",
    promotionProduct: null,
    promotionProductId: "",
    items: null,
    eventNum: 0,
    formIds: [],
    nums: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    let matchItem = app.globalData.matchItem
    let items = app.globalData.matchItems
    if (options.orderId) {
      this.setData({
        orderId: decodeURIComponent(options.orderId),
        eventNum: options.eventNum,
      })
    }
    if (matchItem.promotionProduct !== null) {
      let promotionProduct = matchItem.promotionProduct.substitutions
      console.log(promotionProduct)
      items.forEach((item) => {
        if (item.promotionProductSub !== null) {
          if (item.productId == item.promotionProductSub.id) {
            promotionProduct.forEach((pro) => {
              if (item.productId == pro.id) {
                pro.active = true
                pro.quantity = item.quantity
                pro.specialPrice = item.price
                pro.unit = item.unit
              }
              if (pro.product.id == matchItem.product.id) {
                console.log(1)
              }
            })
          }
        } else {
          if (item.product.id == matchItem.promotionProduct.product.id) {
            matchItem.promotionProduct.quantity = item.quantity
            matchItem.promotionProduct.active = true
          } else {
            matchItem.promotionProduct.quantity = 0
            matchItem.promotionProduct.active = false
          }
        }
      })
      this.setData({
        promotionProduct: promotionProduct,
        promotionProductId: matchItem.promotionProduct.id
      })
    }
    this.setData({
      item: matchItem,
      items: items
    })

    console.log(this.data.item)
    // this.get_peidanNums(matchItem)
    // console.log(this.data.items)
  },
  get_peidanNums: function (matchItem) {
    let nums = 0
    matchItem.promotionProduct.substitutions.forEach((item) => {
      nums += item.quantity
    })
    nums = nums + matchItem.promotionProduct.quantity
    console.log(nums)
    this.setData({
      nums: nums
    })
  },

  checkItem: function (e) {
    // console.log(e)
    let item = this.data.promotionProduct
    let index = e.currentTarget.dataset.index
    if (item[index].active == true) {
      item[index].active = false
      item[index].quantity = 0
    } else {
      item[index].active = true
      item[index].quantity = 1
    }
    this.setData({
      promotionProduct: item
    })
  },

  checkItem_old: function (e) {
    let item = this.data.item
    if (item.promotionProduct.active == true) {
      item.promotionProduct.active = false
      item.promotionProduct.quantity = 0
    } else {
      item.promotionProduct.active = true
      item.promotionProduct.quantity = 1
    }
    this.setData({
      item: item
    })
  },

  addItem: function (e) {
    let item = this.data.promotionProduct
    let index = e.currentTarget.dataset.index
    item[index].quantity = item[index].quantity + 1
    this.setData({
      promotionProduct: item
    })
  },
  jianItem: function (e) {
    let item = this.data.promotionProduct
    let index = e.currentTarget.dataset.index
    let quantity = e.currentTarget.dataset.quantity
    if (quantity == 1) {
      item[index].quantity = 0
      item[index].active = false
    } else {
      item[index].quantity = item[index].quantity - 1
    }
    this.setData({
      promotionProduct: item
    })
  },

  formSubmit: function (e) {
    var formIds = this.data.formIds
    formIds.push(e.detail.formId)
    let newFormIds = []
    formIds.forEach((item) => {
      if (item !== undefined) {
        newFormIds.push(item)
      }
    })
    this.setData({
      formIds: newFormIds
    })
    // console.log("0000", e)
    // e.stopPropagation()
  },

  saveChange: function (e) {
    let that = this
    let newItems = that.pushNewItems()
    let newItem = that.pushNewItem()
    newItems.push(newItem)// 原产品跟分配产品合并
    let contrast = that.contrastFun(newItems)
    console.log(contrast)
    let inputIems = that.updataInputItems(newItems)
    // console.log("inputIems", inputIems)
    if (that.data.eventNum < contrast) {
      wx.showModal({
        title: '超出限制',
        content: '超过原订单可配单总数量' + that.data.eventNum,
      })
      return
    } else if (that.data.eventNum > contrast) {
      wx.showModal({
        title: '低于限制',
        content: '低于原订单可配单总数量' + that.data.eventNum,
      })
      return
    }
    let input = {
      clientMutationId: 0,
      id: that.data.orderId,
      formIds: that.data.formIds,
      items: inputIems,
    }
    console.log(input)

    // return
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: AlterOrder(input),
      success: res => {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
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
        if (res.data.data.alterOrder.order !== null) {
          wx.navigateBack()
        }
      },
      fail: res => {
        console.log("请求失败", res)
      }
    });
  },
  //对比总数量
  contrastFun: function (value) {
    let num = 0
    let items = value
    items.forEach((item) => {
      if (item.promotionProduct !== null) {
        num += item.quantity
      }
    })
    return num
  },

  //原产品修改结构返回
  pushNewItem: function (value) {
    let item = this.data.item
    let newItem = {
      productId: item.promotionProduct.id,
      quantity: item.promotionProduct.quantity,
      unit: item.promotionProduct.unit,
      // id: item.id
    }
    return newItem
  },
  //分配产品修改结构返回
  pushNewItems: function () {
    let that = this
    let substitutions = that.data.promotionProduct
    let promotionProductId = that.data.promotionProductId
    let newItems = []
    substitutions.forEach((item) => {
      if (item.active == true) {
        newItems.push({
          productId: item.id,
          // 订单明细所购买商品ID, 新增项目有效
          quantity: item.quantity,
          // 订单明细所购买商品数量
          unit: item.unit,
          // 订单明细所购买商品单位, 新增项目有效
          id: "",
          // 订单明细, 新增项目为空
        })
      }
    })
    return newItems
  },

  // 原items与要上传的items对比
  updataInputItems: function (value) {
    let newItems = value
    let items = this.data.items
    // console.log("items", items)
    items.forEach((item) => {
      if (item.promotionProduct == null) {
        newItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit
        })
      }
    })
    return newItems
  },

  bindChangeOrder: function (e) {
    wx.showModal({
      title: '配单',
      content: '您是否要配置其他口味的产品',
      confirmText: "确定",
      success: res => {
        if (res.confirm) {
          console.log('用户点了确定')
          this.setData({
            isChangeOrder: false
          })
        } else {
          this.setData({
            isChangeOrder: true
          })
        }
      },
      fail: res => {

      }
    })
  },

  //加减原订单
  jianOldItem: function (e) {
    let item = this.data.item
    if (item.promotionProduct.quantity > 1) {
      item.promotionProduct.quantity = item.promotionProduct.quantity - 1
    } else {
      item.promotionProduct.active = false
      item.promotionProduct.quantity = 0
    }
    this.setData({
      item: item
    })
  },

  addOldItem: function (e) {
    let item = this.data.item
    item.promotionProduct.quantity = item.promotionProduct.quantity + 1
    this.setData({
      item: item
    })
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
    console.log(this.data.order)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    app.globalData.matchItem == null
    app.globalData.matchItems = null
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