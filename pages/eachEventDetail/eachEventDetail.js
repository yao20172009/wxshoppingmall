var app = getApp()
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const util = require('../../utils/util.js')
const {
  formatTimeDay
} = require('../../utils/util.js')
const {
  ActiveDetaill
} = require('../../models/event/promotionProducts.js')
const {
  CurrentPromotion
} = require('../../models/event/currentPromotion.js')
const {
  CreateOrder
} = require('../../models/event/createOrder.js')
const {
  DefaultAddress
} = require('../../models/address/defaultAddress.js')
const {
  GetShareInfo,
  GetShareToken
} = require('../../utils/share.js')
const moment = require('../../utils/moment.js')
moment.locale('zh-cn');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    movies: ["https://assets.jiejie.io/internet/product01.jpg", "https://assets.jiejie.io/internet/product02.jpg"],
    id: "", //订单id
    currentPromotion: {}, //期数详细
    currentTime: "", //服务器 服务器时间
    startTime: "", //活动开始时间
    endTime: "", //活动结束世界
    promotionProduct: null,
    maxtime: "",
    isHiddenLoading: true,
    isHiddenToast: true,
    dataList: {},
    countDownDay: "00",
    countDownHour: "00",
    countDownMinute: "00",
    countDownSecond: "00",
    event_text: "距离活动结束还有",
    event_text1: "距离活动开始还有",
    disabled: false, // 活动可买按钮控制
    listActive: true, //true本期,false下一期
    showDialog: false,
    tanchu_box: {}, //规格弹出层数据
    minusStatus: 'disabled', // 使用data数据对象设置样式名
    defaultAddress: null, //地址
    showErrors: false, //显示错误
    bank: false,
    isInventory: true, //默认有库存
    menuBox: {
      active: false,
    },
    sharePage: {
      flag: true,
      openShare: true
    },
    shareActive:false,
  },

  openShare_Yao: function () {
    let that = this
    var sharePage = that.data.sharePage
    sharePage.flag = false
    that.setData({
      sharePage: sharePage
    })
  },

  //关闭分享弹出
  lookedShare: function () {
    let that = this
    var sharePage = that.data.sharePage
    sharePage.flag = true
    that.setData({
      sharePage: sharePage
    })
  },


  // 预览图片
  previewImage: function(e) {
    var current = e.target.dataset.src;
    // console.log(current)
    wx.previewImage({
      current: current, // 当前显示图片的http链接  
      urls: this.data.imageUrls.length !== 0 ? this.data.imageUrls : this.data.movies // 需要预览的图片http链接列表  
    })
  },

  createOrder: util.throttle(function(e) {
    // console.log(e.detail.formId)
    console.log("click", 1)
    var item = this.data.tanchu_box
    if (item.customerLimit !== 0) {
      if ((item.boughtQuantity - 0) + (item.quantity - 0) >= item.customerLimit - 0 + 1) {
        var num = item.customerLimit - item.boughtQuantity
        console.log("剩余购买数量", (item.boughtQuantity - 0) + (item.quantity - 0), num)
        wx.showModal({
          title: '温馨提示',
          content: '超过限制购买总数量，剩余可购买' + num,
        })
        return
      }
    }
    if (item.quantity < item.num) {
      wx.showModal({
        title: '温馨提示',
        content: '未满足活动购买最低数量，无法购买',
      })
      return
    }
    if (item.inventory - item.quantity < 0) {
      wx.showModal({
        title: '温馨提示',
        content: '库存不足，无法购买',
      })
      return
    }
    app.globalData.activeOrder = item
    wx.navigateTo({
      url: '/pages/eachEventOrder/eachEventOrder',
    })
    return

    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var item = that.data.tanchu_box
    var items = [{
      productId: item.id,
      quantity: item.quantity,
      unit: item.unit
    }]

    var input = {
      addressId: that.data.defaultAddress.id,
      // note: String,
      formId: e.detail.formId,
      items: items,
      clientMutationId: 0,
    }
    gql({
      body: CreateOrder(input),
      //　ｂｏｄｙ == 数据结构
      success: function(res) {
        // console.log(res)
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '购买失败',
            content: errors[0].message,
          })
          return
        }
        if (res.data.data.createOrder !== null) {
          wx.showToast({
            title: '购买成功',
          })
          var promotionProduct = that.data.promotionProduct
          promotionProduct.sales = promotionProduct.sales - 0 + items[0].quantity - 0
          that.setData({
            tanchu_box: {},
            showDialog: false,
            promotionProduct: promotionProduct,
          })
        }
      },
      fail: function(res) {
        console.log("event 错误" + res)
      }
    })

  }, 1500),

  toggleDialog: function(e) {
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
    var amount = e.target.dataset.amount
    var quantity = e.target.dataset.quantity
    if (amount == 0) {
      quantity = quantity == 0 ? 1 : quantity
    } else {
      quantity = Math.ceil(amount / e.target.dataset.price)
    }

    // console.log(e.target.dataset)
    this.setData({
      tanchu_box: {
        id: e.target.dataset.id,
        name: e.target.dataset.name,
        price: e.target.dataset.price,
        unit: e.target.dataset.unit,
        quantity: quantity,
        imageurls: e.target.dataset.imageurls,
        inventory: e.target.dataset.inventory,
        amount: amount,
        num: quantity,
        kindDesc: e.target.dataset.kinddesc,
        discountAmount: e.target.dataset.discountamount,
        discountRate: e.target.dataset.discountrate,
        customerLimit: e.target.dataset.customerlimit,
        boughtQuantity: e.target.dataset.boughtquantity,
        gift: e.target.dataset.gift,
        supplier: e.target.dataset.supplier,
        productId: e.target.dataset.productid
      },
      showDialog: true
    })
  },

  closeDialog: function(e) {
    this.setData({
      tanchu_box: {},
      showDialog: false
    })
  },

  bindMinus: function(e) {
    var item = this.data.tanchu_box;
    var quantity = e.target.dataset.quantity == 0 ? 1 : e.target.dataset.quantity
    // 如果大于1时，才可以减
    if (item.amount == 0) {
      console.log("没amount", item.amount)
      if (item.quantity > 1 && item.quantity > quantity) {
        item.quantity--;
      }
    } else {
      var guding = Math.ceil(item.amount / item.price)
      console.log("有amount", item.amount, guding, quantity)
      if (item.quantity > guding && item.quantity > quantity) {
        item.quantity--;
      }
    }
    var guding1 = Math.ceil(item.amount / item.price)
    if (guding1 == 0) {
      // 只有大于一件的时候，才能normal状态，否则disable状态
      var minusStatus = item.quantity <= quantity ? 'disabled' : 'normal';
    } else {
      var minusStatus = item.quantity <= guding1 ? 'disabled' : 'normal';
    }
    // 将数值与状态写回
    this.setData({
      tanchu_box: item,
      minusStatus: minusStatus
    });
  },
  /* 点击加号 */
  bindPlus: function() {
    var item = this.data.tanchu_box;
    if (item.quantity >= item.inventory) {
      // item.quantity = item.inventory
      item.quantity++
    } else {
      item.quantity++;
    }
    var minusStatus = item.quantity < 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      tanchu_box: item,
      minusStatus: minusStatus
    });
  },
  /* 输入框事件 */
  bindManual: function(e) {
    var item = this.data.tanchu_box;
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
        tanchu_box: item,
      })
      return
    }
    var guding1 = Math.ceil(item.amount / item.price)
    if (item.amount == 0) {
      console.log("没amount", item.amount, item.quantity, e.detail.value, item.num)
      // item.quantity = e.detail.value < item.num ? item.num : e.detail.value
      item.quantity = e.detail.value
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

  // 开启分享
  openShare: function() {
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
    var id = decodeURIComponent(options.id)
    // console.log(id)
    this.setData({
      id: id,
      listActive: options.listActive,
      listActive1: options.listActive1,
      bank: true,
      // 使用encodeURIComponent()转义 接收id
    });
    this.getActiveDetaill(id, options.listActive, options.listActive1)
    // console.log(id, options.listActive, options.listActive1)
    // this.getCurrentPromotion(options.listActive, options.listActive1) //当前期数

  },

  getActiveDetaill: function(id, listActive, listActive1) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    var id = id
    gql({
      body: ActiveDetaill(id),
      success: function(res) {
        console.log(res)
        util.hideLoading()
        var statusCode = res.statusCode
        if (statusCode == 401) {
          // wx.navigateBack()
          client.ErrMsg(res)
          return
        }
        var promotionProduct = res.data.data.promotionProduct
        var currentPromotion = res.data.data.currentPromotion
        // var nextPromotion = res.data.data.nextPromotion
        var currentTime = res.data.data.currentTime
        // console.log(promotionProduct)
        var startTime = promotionProduct.startTime
        var endTime = promotionProduct.endTime
        let sharePage = that.data.sharePage
        sharePage.name = promotionProduct.supplier.name
        sharePage.shareReward = promotionProduct.supplier.shareReward
        that.setData({
          sharePage: sharePage,
          startTime: formatTimeDay(promotionProduct.startTime),
          endTime: formatTimeDay(promotionProduct.endTime)
        })

        that.updataPromotionProduct(promotionProduct)
        that.updataTime1(currentTime, startTime, endTime)
      },
      fail: function(res) {},
    })
  },

  updataTime1: function(currentTime, startTime, endTime) {
    // 处理时间
    // console.log(currentTime, startTime, endTime)
    var isStart = Date.parse(startTime) / 1000 - Date.parse(currentTime) / 1000;
    if (isStart >= 0) {
      // console.log('大于等于0，活动未开始', isStart)
      var totalSecond = Date.parse(startTime) / 1000 - Date.parse(currentTime) / 1000;
      this.setData({
        event_text: "距离活动开始还有",
        disabled: true,
      })
      this.setTimeStart(totalSecond)
    } else {
      // console.log('小于等于0,活动已开始', isStart)
      var totalSecond = Date.parse(endTime) / 1000 - Date.parse(currentTime) / 1000;
      this.setTimeEnd(totalSecond)
    }

  },
  //活动结束还有
  setTimeEnd: function(totalSecond, listActive1) {
    // console.log("开始，定时器启动")
    var interval = setInterval(function() {
      // 秒数
      var second = Math.abs(totalSecond);

      // 天数位
      var day = Math.floor(second / 3600 / 24);
      var dayStr = day.toString();
      if (dayStr.length == 1) dayStr = '0' + dayStr;

      // 小时位
      var hr = Math.floor((second - day * 3600 * 24) / 3600);
      var hrStr = hr.toString();
      if (hrStr.length == 1) hrStr = '0' + hrStr;

      // 分钟位
      var min = Math.floor((second - day * 3600 * 24 - hr * 3600) / 60);
      var minStr = min.toString();
      if (minStr.length == 1) minStr = '0' + minStr;

      // 秒位
      var sec = parseInt(second - day * 3600 * 24 - hr * 3600 - min * 60);
      var secStr = sec.toString();
      if (secStr.length == 1) secStr = '0' + secStr;

      this.setData({
        countDownDay: dayStr,
        countDownHour: hrStr,
        countDownMinute: minStr,
        countDownSecond: secStr,
      });
      totalSecond--;
      if (totalSecond < 0) {
        clearInterval(interval);
        wx.showToast({
          title: '活动已结束',
        });
        this.setData({
          disabled: true,
          event_text: "活动已结束",
          event_text2: "活动已结束",
          event_text3: "活动已结束",
          countDownDay: '00',
          countDownHour: '00',
          countDownMinute: '00',
          countDownSecond: '00',
        });
      }
    }.bind(this), 1000);
  },

  //离活动开始还有
  setTimeStart: function(totalSecond, ) {
    // console.log("未开始，定时器启动")
    var interval = setInterval(function() {
      // 秒数
      var second = Math.abs(totalSecond);
      // 天数位
      var day = Math.floor(second / 3600 / 24);
      var dayStr = day.toString();
      if (dayStr.length == 1) dayStr = '0' + dayStr;

      // 小时位
      var hr = Math.floor((second - day * 3600 * 24) / 3600);
      var hrStr = hr.toString();
      if (hrStr.length == 1) hrStr = '0' + hrStr;

      // 分钟位
      var min = Math.floor((second - day * 3600 * 24 - hr * 3600) / 60);
      var minStr = min.toString();
      if (minStr.length == 1) minStr = '0' + minStr;

      // 秒位
      var sec = parseInt(second - day * 3600 * 24 - hr * 3600 - min * 60);
      var secStr = sec.toString();
      if (secStr.length == 1) secStr = '0' + secStr;

      this.setData({
        countDownDay: dayStr,
        countDownHour: hrStr,
        countDownMinute: minStr,
        countDownSecond: secStr,
      });
      totalSecond--;
      if (totalSecond < 0) {
        clearInterval(interval);
        wx.showToast({
          title: '活动已开始',
        });
        this.setData({
          disabled: false,
          listActive: "true",
          event_text: "距离活动结束还有",
          event_text2: "活动已开始",
          countDownDay: '00',
          countDownHour: '00',
          countDownMinute: '00',
          countDownSecond: '00',
        });
        console.log("活动立马开始刷新")
        this.getActiveDetaill(this.data.id)
        // this.getCurrentPromotion(this.data.listActive, this.data.listActive1)
      }
    }.bind(this), 1000);
  },

  updataPromotionProduct(promotionProduct) {
    var that = this
    var promotionProduct = promotionProduct
    wx.setNavigationBarTitle({
      title: promotionProduct.kindName,
    })
    promotionProduct.product.productUnits.forEach((pro) => {
      if (promotionProduct.unit == pro.name) {
        promotionProduct.product.price = pro.price
        promotionProduct.product.unit = pro.name
        // promotionProduct.product.inventory = pro.inventory
      }
    })
    promotionProduct.product.name = promotionProduct.product.name.replace(/\s+/, '')
    // isInNum 剩余库存
    var isInNum = promotionProduct.inventory - promotionProduct.sales
    var quantity = promotionProduct.quantity
    if (isInNum > 0) {
      // 库存 - 销量 > 0 
      if (quantity !== 0) {
        //  有quantity条件
        // isInNum剩余库存是否 <= quantity 条件
        console.log("活动条件,", quantity)
        if (isInNum < quantity) {
          console.log("库存小于活动条件,", isInNum, quantity, )
          //库存小于 活动条件
          that.setData({
            isInventory: false
          })
        }
      } else {
        that.setData({
          isInventory: true
        })
      }
    } else {
      //  库存 - 销量 < 0 
      that.setData({
        isInventory: false
      })
    }
    // console.log(promotionProduct)

    promotionProduct.buyers.edges = promotionProduct.buyers.edges.slice(0, 50)
    if (promotionProduct.productionDate !== null) {
      promotionProduct.productionDate = moment(promotionProduct.productionDate).format('YYYY-MM')
    }
    that.setData({
      promotionProduct: promotionProduct,
      imageUrls: promotionProduct.product.imageUrls
    })
  },

  goToShop: function(e) {
    let id = this.data.promotionProduct.supplier.id
    let name = this.data.promotionProduct.supplier.name
    // let url = "/pages/shop/shop?id=" + encodeURIComponent(id) + "&name=" + name + "&openid=" + app.globalData.openid
    let url = "/pages/category/category?id=" + encodeURIComponent(id) + "&name=" + name + "&token=" + app.globalData.token
    wx.navigateTo({
      url: url,
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
    // this.getDefaultAddress()
    if (app.globalData.updataEvent == true) {
      util.showLoading()
      this.getActiveDetaill(this.data.id, this.data.listActive, this.data.listActive1)
    }
    // setTimeout(()=>{})
  },
  getCurrentPromotion: function(listActive, listActive1) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    gql({
      body: CurrentPromotion(),
      //　ｂｏｄｙ == 数据结构
      success: function(res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          // wx.navigateBack()
          client.ErrMsg(res)
          return
          // wx.showModal({
          //   title: '获取数据失败',
          //   content: '获取数据失败,请返回上一层重新进入',
          // })
          // return
        }
        var startTime = res.data.data.currentPromotion.startTime
        var endTime = res.data.data.currentPromotion.endTime
        var currentTime = res.data.data.currentTime
        // console.log(listActive, listActive1)
        if (listActive1 == 1) {
          console.log(1111)
          var currentPromotion = res.data.data.currentPromotion
          that.saveCurrentPromotion(currentPromotion, startTime, endTime, currentTime, listActive, listActive1)
        } 
        // else {
        //   console.log(2222)
        //   if (res.data.data.nextPromotion !== null) {
        //     var nextPromotion = res.data.data.nextPromotion
        //     var startTime = res.data.data.nextPromotion.startTime
        //     var endTime = res.data.data.nextPromotion.endTime
        //     that.saveNextPromotion(nextPromotion, startTime, endTime, currentTime, listActive, listActive1)
        //   }
        // }
      },
      fail: function(res) {
        console.log("event 错误" + res)
      }
    })
  },

  saveCurrentPromotion: function(currentPromotion, startTime, endTime, currentTime, listActive, listActive1) {
    console.log("本期")
    var currentPromotion = currentPromotion
    currentPromotion.startTime = formatTimeDay(startTime)
    currentPromotion.endTime = formatTimeDay(endTime)
    this.setData({
      currentTime: currentTime, //服务器时间
      startTime: startTime,
      endTime: endTime,
      currentPromotion: currentPromotion, //活动期数详细
    })
    this.e_endTime(currentTime, startTime, endTime, listActive, listActive1) //活动结束倒计时
  },

  // saveNextPromotion: function(nextPromotion, nextStartTime, nextEndTime, currentTime, listActive, listActive1) {
  //   console.log("下一期")
  //   var nextPromotion = nextPromotion
  //   nextPromotion.startTime = formatTimeDay(nextStartTime)
  //   nextPromotion.endTime = formatTimeDay(nextEndTime)
  //   this.setData({
  //     currentTime: currentTime, //服务器时间
  //     startTime: nextStartTime,
  //     endTime: nextEndTime,
  //     nextPromotion: nextPromotion, //活动期数详细
  //   })
  //   this.e_endTime(currentTime, nextStartTime, nextEndTime, listActive, listActive1) //活动结束倒计时
  // },

  // // 距离活动结束
  // e_endTime: function(currentTime, startTime, endTime, listActive, listActive1) {
  //   console.log(currentTime, startTime, endTime, listActive, listActive1)
  //   if (listActive1 == 1) {
  //     var isStart = Date.parse(startTime) / 1000 - Date.parse(currentTime) / 1000;
  //     if (isStart >= 0) {
  //       console.log('大于等于0，活动未开始', isStart)
  //       var totalSecond = Date.parse(startTime) / 1000 - Date.parse(currentTime) / 1000;
  //       this.setData({
  //         event_text:"距离活动开始还有",
  //         listActive: "false",
  //       })
  //       this.setEndTime(totalSecond, listActive1)
  //     } else {
  //       console.log('小于等于0,活动已开始', isStart)
  //       var totalSecond = Date.parse(endTime) / 1000 - Date.parse(currentTime) / 1000;
  //       this.setTime(totalSecond, listActive1)
  //     }
  //   } else {
  //     //下一期
  //     var isStart = Date.parse(startTime) / 1000 - Date.parse(currentTime) / 1000;
  //     if (isStart >= 0) {
  //       console.log('下一期，大于等于0，活动未开始', isStart)
  //       var totalSecond = Date.parse(startTime) / 1000 - Date.parse(currentTime) / 1000;
  //       this.setData({
  //         event_text: "距离活动开始还有",
  //         listActive: "false",
  //       })
  //       this.setEndTime(totalSecond, listActive1)
  //     } else {
  //       console.log('小于等于0,活动已开始', isStart)
  //       var totalSecond = Date.parse(endTime) / 1000 - Date.parse(currentTime) / 1000;
  //       this.setTime(totalSecond, listActive1)
  //     }
  //   }
  // },

  // setTime: function(totalSecond, listActive1) {
  //   console.log("开始，定时器启动")
  //   var interval = setInterval(function() {
  //     // 秒数
  //     var second = Math.abs(totalSecond);

  //     // 天数位
  //     var day = Math.floor(second / 3600 / 24);
  //     var dayStr = day.toString();
  //     if (dayStr.length == 1) dayStr = '0' + dayStr;

  //     // 小时位
  //     var hr = Math.floor((second - day * 3600 * 24) / 3600);
  //     var hrStr = hr.toString();
  //     if (hrStr.length == 1) hrStr = '0' + hrStr;

  //     // 分钟位
  //     var min = Math.floor((second - day * 3600 * 24 - hr * 3600) / 60);
  //     var minStr = min.toString();
  //     if (minStr.length == 1) minStr = '0' + minStr;

  //     // 秒位
  //     var sec = parseInt(second - day * 3600 * 24 - hr * 3600 - min * 60);
  //     var secStr = sec.toString();
  //     if (secStr.length == 1) secStr = '0' + secStr;

  //     this.setData({
  //       countDownDay: dayStr,
  //       countDownHour: hrStr,
  //       countDownMinute: minStr,
  //       countDownSecond: secStr,
  //     });
  //     totalSecond--;
  //     if (listActive1 == 1) {
  //       if (totalSecond < 0) {
  //         clearInterval(interval);
  //         wx.showToast({
  //           title: '活动已结束',
  //         });
  //         this.setData({
  //           disabled: true,
  //           listActive: "false",
  //           event_text: "活动已结束",
  //           event_text2: "活动已结束",
  //           countDownDay: '00',
  //           countDownHour: '00',
  //           countDownMinute: '00',
  //           countDownSecond: '00',
  //         });
  //       }
  //     } else {
  //       if (totalSecond < 0) {
  //         clearInterval(interval);
  //         wx.showToast({
  //           title: '活动已结束',
  //         });
  //         this.setData({
  //           disabled: true,
  //           listActive: "false",
  //           event_text: "活动已结束",
  //           event_text2: "活动已结束",
  //           countDownDay: '00',
  //           countDownHour: '00',
  //           countDownMinute: '00',
  //           countDownSecond: '00',
  //         });
  //       }
  //     }
  //   }.bind(this), 1000);
  // },

  // setEndTime: function (totalSecond, listActive1) {
  //   console.log("未开始，定时器启动")
  //   var interval = setInterval(function() {
  //     // 秒数
  //     var second = Math.abs(totalSecond);
  //     // 天数位
  //     var day = Math.floor(second / 3600 / 24);
  //     var dayStr = day.toString();
  //     if (dayStr.length == 1) dayStr = '0' + dayStr;

  //     // 小时位
  //     var hr = Math.floor((second - day * 3600 * 24) / 3600);
  //     var hrStr = hr.toString();
  //     if (hrStr.length == 1) hrStr = '0' + hrStr;

  //     // 分钟位
  //     var min = Math.floor((second - day * 3600 * 24 - hr * 3600) / 60);
  //     var minStr = min.toString();
  //     if (minStr.length == 1) minStr = '0' + minStr;

  //     // 秒位
  //     var sec = parseInt(second - day * 3600 * 24 - hr * 3600 - min * 60);
  //     var secStr = sec.toString();
  //     if (secStr.length == 1) secStr = '0' + secStr;

  //     this.setData({
  //       countDownDay: dayStr,
  //       countDownHour: hrStr,
  //       countDownMinute: minStr,
  //       countDownSecond: secStr,
  //     });
  //     totalSecond--;
  //     if (totalSecond < 0) {
  //       clearInterval(interval);
  //       wx.showToast({
  //         title: '活动已开始',
  //       });
  //       this.setData({
  //         disabled: false,
  //         listActive: "true",
  //         event_text: "距离活动结束还有",
  //         event_text2: "活动已开始",
  //         countDownDay: '00',
  //         countDownHour: '00',
  //         countDownMinute: '00',
  //         countDownSecond: '00',
  //       });
  //       this.getCurrentPromotion(this.data.listActive,this.data.listActive1)
  //     }
  //   }.bind(this), 1000);
  // },

  selectAddress: function(e) {
    wx.navigateTo({
      url: '/pages/address/select/select',
    })
  },


  closeErrors: function() {
    // 点击其他区域隐藏
    this.setData({
      showErrors: true,
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    this.setData({
      tanchu_box: {},
      showDialog: false,
      showErrors: false,
      menuBox: {
        active: false,
      },
      shareActive: false,
    })
    app.globalData.updataEvent = null
    console.log("页面隐藏了")
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    app.globalData.updataEvent = null
    console.log("页面卸载了")
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
  openMenu: function() {
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

  colseMenu: function() {
    if (this.data.menuBox.active == false) {
      return
    }
    this.setData({
      menuBox: {
        active: false,
      }
    })
  },

  goUrls: function(e) {
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
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    let that = this;
    that.setData({
      shareActive: true,
    })
    that.lookedShare()
    var listActive = that.data.listActive1 == 1 ? true : false
    // console.log(that.data.id)
    let title = that.data.promotionProduct.product.name + that.data.promotionProduct.kindDesc;
    title = title.replace(/\s+/, '')
    var supplierId = that.data.promotionProduct.supplier.id
    var fromPage = that.route + "?supplierId=" + supplierId
    var toPage = that.route + "?supplierId=" + supplierId
    var token = app.globalData.UserId + new Date().getTime()
    let url = '/pages/eachEventDetail/eachEventDetail?token=' + app.globalData.token + '&areaId=' + app.globalData.areaId + "&id=" + encodeURIComponent(that.data.id) + "&listActive=" + listActive + "&listActive1=" + that.data.listActive1 + '&t=' + encodeURIComponent(token)
    GetShareToken(supplierId, fromPage, toPage, token).then((t) => {
      console.log(t)
    })
    
    if (res.from === 'button') {
      return {
        title: title,
        path: url
      }
      return
    }

    return {
      title,
      path: url
      // app.globalData.areaId
    }
  }
})