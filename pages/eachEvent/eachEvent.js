const app = getApp()
const util = require('../../utils/util.js')
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const {
  ActiveList,
  ActiveDetaill
} = require('../../models/event/promotionProducts.js')
const {
  CreatePromotionView
} = require('../../models/can/canUpdateArea.js')
const {
  CurrentPromotion
} = require('../../models/event/currentPromotion.js')
const {
  GetShareInfo,
  GetShareToken
} = require('../../utils/share.js')
const {
  GetLocation
} = require('../../models/location/getLocation.js')
const {
  GetAreaId
} = require('../../models/location/getAreaId.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    inputShowed: true,
    first: 50,
    active: true,
    eventList: [],
    eventLoading: false, //"上拉加载"的变量，默认false，隐藏
    eventLoadingComplete: false, //“没有数据”的变量，默认false，隐藏
    theEnd: false, //用于判断加载更多数据是 没有了
    after: "",
    order: "sales",
    listActive: true, //切换期数,true为本期,false为下一期
    currentPromotion: {}, //本期数详细
    platformPromotionId: "",
    currentTime: "", //服务器 服务器时间
    isNextBut: true,
    pageStyleColor: {
      "background-color": "#ED1B38"
    },
    defaultImg: "https://assets.jiejie.io/brain/1542770274945346782_2086744600.jpg",
  },

  bind_goEachEventDetail: function (e) {
    var id = e.currentTarget.dataset.id
    // console.log(id)
    var listActive = this.data.listActive
    var listActive1 = listActive == true ? 1 : 2
    wx.navigateTo({
      url: '/pages/eachEventDetail/eachEventDetail?id=' + encodeURIComponent(id) + '&listActive=' + listActive + '&listActive1=' + listActive1,
    })
  },
 
  // 开启分享
  openShare: function () {
    wx.showShareMenu({
      withShareTicket: true,
    })
  },

  getAreaId: function () {
    return new Promise((resolve, reject) => {
      app.getOpenId().then((token) => {
        let gql = client.GraphQL({
          url: api.WxUnauth + token
        });
        gql({
          body: GetAreaId,
          success: (res) => {
            var statusCode = res.statusCode
            if (statusCode == "401") {
              client.ErrMsg(res)
              return
            }
            if (res.data.data.viewer.area !== null) {
              // console.log('查询到用户有区域', res.data.data.viewer.area)
              app.globalData.area = res.data.data.viewer.area
              // console.log("保存用户所在区域")
              this.area(res.data.data.viewer.area.id)
            } else {
              app.globalData.area = null
              // console.log("查询到用户没有区域", app.globalData.area)
              // console.log("去定位GPS")
              this.getLocation()
            }
          },
          fail: (res) => {
            console.log("index 错误" + res)
          }
        })
      })
    })
  },

  getLocation: function () {
    wx.getLocation({
      type: 'wgs84',
      altitude: true,
      success: (res) => {
        // console.log('获取经纬度成功')
        app.globalData.location = res
        this.getLocationPromise()
      }
    })
  },

  getLocationPromise: function () {
    return new Promise((resolve, reject) => {
      app.getOpenId().then((token) => {
        // console.log(token)
        this.setData({
          token: token
        })
        resolve(
          this.getLocationEare(token),
        );
      }).catch(err => {
        reject(err)
      })
    })
  },

  getLocationEare: function (token) {
    var that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + token
    });
    var latitude = app.globalData.location.latitude
    var longitude = app.globalData.location.longitude
    // console.log("用户定位时的经纬度", latitude, longitude)
    gql({
      body: GetLocation(latitude, longitude),
      success: function (res) {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          // client.ErrMsg(res)
          console.log("定位失败")
          return
        }
        app.globalData.areaHit = res.data.data.areaHit
        console.log("请求GPS定位保存当前定位信息", res.data.data.areaHit)
      },
      fail: function (res) {
        // console.log("index 错误" + res)
      }
    });
  },

  area: function (value) {
    var areaId = wx.getStorageSync('areaId') || ''
    if (!areaId) {
      wx.setStorage({
        key: "areaId",
        data: value,
      })
      app.globalData.areaId = value
      this.getCurrentPromotion(app.globalData.areaId)
    } else {
      // 对比入口参数
      if (value == areaId) {
        app.globalData.areaId = areaId
        this.getCurrentPromotion(app.globalData.areaId)
      } else {
        app.globalData.areaId = value
        wx.setStorageSync('areaId', value)
        this.getCurrentPromotion(app.globalData.areaId)
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    that.openShare()
    console.log("onLoad", options)
    if (options.t) {
      let areaId = decodeURIComponent(options.areaId)
      wx.setStorageSync('areaId', areaId)
      app.globalData.areaId = areaId
      let t = decodeURIComponent(options.t)
      let id = decodeURIComponent(options.eventId)
      if (app.globalData.scene == 1044) {
        console.log("分享入口")
        if (app.globalData.shareTicket) {
          GetShareInfo(t)
        }
        that.setData({
          listActive: options.active == "false" ? false : true
        })
        if (id !== "") {
          that.getActiveListActive(id, options.active, areaId)
        } else {
          that.getCurrentPromotion(areaId)
        }
      }
    } else {
      console.log(app.globalData.areaId)
      wx.setStorageSync('areaId', app.globalData.areaId)
      // that.getCurrentPromotion(app.globalData.areaId) //获取期数数据
      if (app.globalData.areaId == null) {
        console.log(1)
        that.getAreaId()
      } else {
        console.log(2)
        that.area(app.globalData.areaId)
      }
    }
  },
  //分享入口获取新活动商品
  getActiveListActive: function (platformPromotionId, active, areaId) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    var first = that.data.first
    var order = that.data.order
    if (order == "sales") {
      order = {
        sales: "desc",
        sort_score: "desc"
      }
    }
    var platformPromotionId = platformPromotionId
    var after = ""
    that.setData({
      platformPromotionId: platformPromotionId
    })
    that.updataAreaId(areaId)
    gql({
      body: ActiveList(areaId, first, order, after, platformPromotionId),
      //　ｂｏｄｙ == 数据结构
      success: function (res) {
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        var currentPromotion = res.data.data.currentPromotion
        that.setData({
          currentPromotion: currentPromotion,
        })
        //背景色
        that.updataPageStyleColor(active, currentPromotion)
        if (res.data.data.promotionProducts !== null) {
          var eventlist = res.data.data.promotionProducts.edges
          var after = res.data.data.promotionProducts.pageInfo.endCursor
          //修改数据结构
          that.updataEventList(eventlist, after)
        }
      },
      fail: function (res) {
        console.log("event 错误" + res)
      }
    })
  },

  updataPageStyleColor: function (active, currentPromotion) {
    let that = this;
    var pageStyleColor = that.data.pageStyleColor
    if (active == true && currentPromotion !== null) {
      if (currentPromotion.imageUrl == "") {
        currentPromotion.imageUrl = "https://assets.jiejie.io/internet/event_01.jpeg"
      }
      if (currentPromotion.styles !== null) {
        pageStyleColor = JSON.parse(currentPromotion.styles)
        var backgroundColor = pageStyleColor["background-color"]
        if (backgroundColor !== undefined) {
          // console.log(pageStyleColor)
          wx.setNavigationBarColor({
            frontColor: '#ffffff',
            backgroundColor: backgroundColor,
          })
        }
      }
      that.setData({
        currentPromotion: currentPromotion,
        pageStyleColor: pageStyleColor,
        listActive: true
      })
    }
  },

  updataEventList: function (eventlist, after) {
    let that = this;
    if (eventlist.length == 0) {
      that.setData({
        eventList: eventlist,
      })
      return
    }
    var newEventlist = []
    eventlist.forEach((items) => {
      if (items.node.supplier !== null) {
        newEventlist.push(items)
      }
    })
    newEventlist.forEach((item) => {
      if (item.node.product.imageUrls.length !== 0) {
        item.node.product.img = item.node.product.imageUrls[0]
      } else {
        item.node.product.img = null
      }
      item.node.product.name = item.node.product.name.replace(/\s+/, '')
      item.node.product.productUnits.forEach((pro) => {
        if (item.node.unit == pro.name) {
          item.node.product.price = pro.price
          item.node.product.unit = pro.name
          item.node.product.inventory = pro.inventory
        }
      })
    })
    that.setData({
      eventList: newEventlist,
      after: after,
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
    console.log(app.globalData.updataEvent)
    if (app.globalData.updataEvent == true) {
      this.getCurrentPromotion(app.globalData.areaId)
    }
    this.updateAreaName()
  },

  updateAreaName: function () {
    if (app.globalData.areaId == "QXJlYTozMjM2") {
      wx.setNavigationBarTitle({
        title: '活动团－测试区',
      })
    }
    if (app.globalData.areaId == "QXJlYToyNzc5") {
      wx.setNavigationBarTitle({
        title: '活动团－耒阳区',
      })
    }
  },

  getCurrentPromotion: function (areaId) {
    let that = this;
    that.updateAreaName()
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    gql({
      body: CurrentPromotion(areaId),
      //　ｂｏｄｙ == 数据结构
      success: function (res) {
        console.log("临时需要查看数据")
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        wx.hideLoading()
        that.setData({
          currentPromotion: res.data.data.currentPromotion //本期数详细
        })
        if (that.data.listActive == true) {
          if (res.data.data.currentPromotion == null) {
            // console.log(res)
            wx.showLoading({
              title: '暂无活动',
            })
            that.setData({
              eventList: [],
              platformPromotionId: "",
            })
            setTimeout(() => {
              wx.hideLoading()
            }, 1000)
            return
          } else {
            var platformPromotionId = res.data.data.currentPromotion.id
            that.getActiveList(platformPromotionId)
            that.getLookPeople(platformPromotionId) //计数api
          }
        }
      },
      fail: function (res) {
        console.log("event 错误" + res)
      }
    })
  },

  //获取新活动商品
  getActiveList: function (platformPromotionId) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    var first = that.data.first
    var order = that.data.order
    if (order == "sales") {
      order = {
        sales: "desc",
        sort_score: "desc"
      }
    }
    var platformPromotionId = platformPromotionId
    var after = ""
    that.setData({
      platformPromotionId: platformPromotionId
    })
    // console.log("app.globalData.areaId", app.globalData.areaId)
    gql({
      body: ActiveList(app.globalData.areaId, first, order, after, platformPromotionId),
      //　ｂｏｄｙ == 数据结构
      success: function (res) {
        console.log(res)
        that.updataAreaId(app.globalData.areaId)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        var currentPromotion = res.data.data.currentPromotion
        var pageStyleColor = that.data.pageStyleColor
        if (that.data.listActive == true && currentPromotion !== null) {
          if (currentPromotion.imageUrl == "") {
            currentPromotion.imageUrl = "https://assets.jiejie.io/internet/event_01.jpeg"
          }
          if (currentPromotion.styles !== null) {
            pageStyleColor = JSON.parse(currentPromotion.styles)
            var backgroundColor = pageStyleColor["background-color"]
            if (backgroundColor !== undefined) {
              // console.log(pageStyleColor)
              wx.setNavigationBarColor({
                frontColor: '#ffffff',
                backgroundColor: backgroundColor,
              })
            }
          }
          that.setData({
            currentPromotion: currentPromotion,
            listActive: true,
            pageStyleColor: pageStyleColor,
          })
        }
        // console.log(eventlist)
        var eventlist = res.data.data.promotionProducts.edges //数据结构
        var after = res.data.data.promotionProducts.pageInfo.endCursor
        console.log(eventlist)

        if (eventlist.length == 0) {
          // wx.showToast({
          //   title: '无任何活动',
          // })
          that.setData({
            eventList: eventlist,
          })
          return
        }

        var newEventlist = []
        eventlist.forEach((items) => {
          if (items.node.supplier !== null) {
            newEventlist.push(items)
          }
        })
        newEventlist.forEach((item) => {
          if (item.node.product.imageUrls.length !== 0) {
            item.node.product.img = item.node.product.imageUrls[0]
          } else {
            item.node.product.img = null
          }
          item.node.product.name = item.node.product.name.replace(/\s+/, '')
          item.node.product.productUnits.forEach((pro) => {
            if (item.node.unit == pro.name) {
              item.node.product.price = pro.price
              item.node.product.unit = pro.name
              item.node.product.inventory = pro.inventory
            }
          })
        })
        // console.log(newEventlist)
        that.setData({
          eventList: newEventlist,
          after: after,
          // currentPromotion: currentPromotion,
          // pageStyleColor: pageStyleColor,
        })
        // console.log(" 第一次获取after", that.data.after)
      },
      fail: function (res) {
        console.log("event 错误" + res)
      }
    })
  },

  // 上拉加载更多
  getMoreActive: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });

    if (that.data.after == "") {
      that.setData({
        theEnd: true,
      })
      return
    }
    var order = that.data.order
    if (order == "sales") {
      order = {
        sales: "desc"
      }
    }
    if (order == "createdAt") {
      order = {
        createdAt: "desc"
      }
    }
    var platformPromotionId = ""
    if (that.data.listActive == true) {
      console.log(3)
      platformPromotionId = that.data.currentPromotion == null ? "" : that.data.currentPromotion.id
      // console.log("本期加载更多", that.data.currentPromotion.id)
    }
    gql({
      body: ActiveList(app.globalData.areaId, that.data.first, order, that.data.after, platformPromotionId),
      //　ｂｏｄｙ == 数据结构　　注意传参的顺序一定要一致
      success: function (res) {
        var after = res.data.data.promotionProducts.pageInfo.endCursor
        // console.log("下拉之后得到的after", after)
        that.setData({
          after: after
        })
        if (after !== "") {
          var eventlistTem = res.data.data.promotionProducts.edges //数据结构
          var eventLists = that.data.eventList
          eventlistTem.forEach((item) => {
            if (that.data.listActive == true) {
              item.node.isCan = true
            } else {
              item.node.isCan = false
            }
            if (item.node.product.imageUrls.length !== 0) {
              item.node.product.img = item.node.product.imageUrls[0]
            } else {
              item.node.product.img = null
            }
            item.node.product.productUnits.forEach((pro) => {
              if (item.node.unit == pro.name) {
                item.node.product.price = pro.price
                item.node.product.unit = pro.name
                item.node.product.inventory = pro.inventory
              }
            })
          })
          eventlistTem.forEach((items) => {
            if (items.node.supplier !== null) {
              eventLists.push(items)
            }
          })
          // console.log(eventlistTem)
          that.setData({
            eventList: eventLists
          })
          // console.log(eventLists)
        }
      },
      fail: function (res) {
        console.log("event 错误" + res)
      }
    });
  },

  updataAreaId: function (value) {
    let areaId = value
    if (areaId) {
      app.globalData.areaId = areaId
    }
    if (app.globalData.areaId == "QXJlYTozMjM2") {
      wx.setNavigationBarTitle({
        title: '活动团－测试区',
      })
    }
    if (app.globalData.areaId == "QXJlYToyNzc5") {
      wx.setNavigationBarTitle({
        title: '活动团－耒阳区',
      })
    }
  },

  getLookPeople: function (id) {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    let input = {
      clientMutationId: 0,
      id: id
    }
    gql({
      body: CreatePromotionView(input),
      //　ｂｏｄｙ == 数据结构
      success: function (res) {
        // console.log(res)
        // console.log(1)
      },
      fail: function (res) {
        console.log("event 错误" + res)
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // app.slideupshow(this, 'slide_up1', 200, 0)
    // //延时展现容器2，做到瀑布流的效果，见上面预览图
    // setTimeout(function () {
    //   app.slideupshow(this, 'slide_up2', 200, 0)
    // }.bind(this), 200);
    this.setData({
      theEnd: false,
    })
    // console.log(1)
    app.globalData.updataEvent = null
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    app.globalData.updataEvent = null
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.getCurrentPromotion(app.globalData.areaId)
    wx.showNavigationBarLoading() //在标题栏中显示加载
    //模拟加载
    setTimeout(function () {
      // complete
      wx.hideNavigationBarLoading() //完成停止加载
      wx.stopPullDownRefresh() //停止下拉刷新
    }, 1500);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log(1)
    this.getMoreActive()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    let that = this;
    var supplierId = undefined
    var fromPage = that.route
    var toPage = that.route
    var token = app.globalData.UserId + new Date().getTime()
    var active = that.data.listActive
    var eventId = that.data.platformPromotionId
    console.log("转发时的页面active", active, app.globalData.areaId, eventId)
    GetShareToken(supplierId, fromPage, toPage, token).then((t) => { })
    let url = '/pages/eachEvent/eachEvent?areaId=' + encodeURIComponent(app.globalData.areaId) + '&t=' + encodeURIComponent(token) + '&active=' + active + "&share=" + "share" + "&eventId=" + eventId
    return {
      title: '进货管家',
      path: url
    }
  },
})
