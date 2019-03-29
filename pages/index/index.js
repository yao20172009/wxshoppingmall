const app = getApp()
const util = require('../../utils/util.js')
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const {
  Supplier
} = require('../../models/supplier.js')
const {
  GetLocation
} = require('../../models/location/getLocation.js')
const {
  GetAreaId
} = require('../../models/location/getAreaId.js')
const {
  GetShareInfo,
  GetShareToken
} = require('../../utils/share.js')
const {
  UnawarePointChanges,
  AwareAllPointChanges
} = require('../../models/unawarePointChanges.js')
var socketMsgQueue = []

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    hasUserInfo: true,
    openid: "",
    token: "",
    filterId: 1,
    address: '长沙汇芙蓉区',
    suppliers: [],
    isOneTime: false,
    scrollTop: 0,
    theEnd: false, //用于判断加载更多数据是 没有了
    first: 20,
    after: "",
    menuBox: {
      active: false,
    },
    a: [],
    getPoints: {
      addtellHidden: true, //弹出框显示/隐藏
    },
  },

  // handleContact(e) {
  //   console.log(e.path)
  //   console.log(e.query)
  // },

  getPoints: function (token) {
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: UnawarePointChanges,
      success: (res) => {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == "401") {
          // client.ErrMsg(res)
          console.log("用户在其他地方登录，获取得到积分失败")
          return
        }
        // return
        let titles = []
        if (res.data.data.unawarePointChanges !== null) {
          let id = res.data.data.unawarePointChanges.id
          let items = res.data.data.unawarePointChanges.items
          items.forEach((item) => {
            titles.push(item.supplier.name + ":" + "\t" + item.points + "\t积分" + '\r\n')
            item.title = item.supplier.name + ":" + "\t" + item.points + "\t积分"
          })
          console.log(titles)
          let title = (titles.join(""))
          this.setData({
            getPoints: {
              id: id,
              items: items,
              addtellHidden: false
            }
          })
        } else {
          console.log("没有获得积分")
        }
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },

  modalConfirm: function (e) {
    //弹出框确认操作
    let id = e.currentTarget.dataset.id
    this.setData({
      getPoints: {
        id: this.data.getPoints.id,
        addtellHidden: true,
        items: this.data.getPoints.items,
      }
    })
    console.log(this.data.getPoints)
    this.lookedPoints(id)
  },
  modalCancel: function (e) {
    //弹出框取消操作
    let id = e.currentTarget.dataset.id
    this.setData({
      getPoints: {
        id: this.data.getPoints.id,
        addtellHidden: true,
        items: this.data.getPoints.items,
      }
    })
    console.log(this.data.getPoints)
    this.lookedPoints(id)
  },

  // 已查看获得积分弹窗
  lookedPoints: function (id) {
    let that = this
    let input = {
      lastId: id,
      clientMutationId: 0
    }
    console.log(input)
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    console.log(app.globalData.token)
    gql({
      body: AwareAllPointChanges(input),
      success: (res) => {
        console.log(res)
        if (res.data.data.awareAllPointChanges !== null && res.data.data.awareAllPointChanges.status == "ok") {
          console.log("已读 success")
        }
      },
      fail: (res) => {
        console.log("已读 fail")
      }
    })
  },

  onScroll: function (e) {
    if (e.detail.scrollTop > 100 && !this.data.scrollDown) {
      this.setData({
        scrollDown: true
      });
    } else if (e.detail.scrollTop < 100 && this.data.scrollDown) {
      this.setData({
        scrollDown: false
      });
    }
  },
  tapSearch: function () {
    wx.navigateTo({
      url: 'search'
    });
  },
  toNearby: function () {
    var self = this;
    self.setData({
      scrollIntoView: 'nearby'
    });
    self.setData({
      scrollIntoView: null
    });
  },
  tapFilter: function (e) {
    switch (e.target.dataset.id) {
      case '1':
        this.data.shops.sort(function (a, b) {
          return a.id > b.id;
        });
        break;
      case '2':
        this.data.shops.sort(function (a, b) {
          return a.sales < b.sales;
        });
        break;
      case '3':
        this.data.shops.sort(function (a, b) {
          return a.distance > b.distance;
        });
        break;
    }
    this.setData({
      filterId: e.target.dataset.id,
      shops: this.data.shops
    });
  },
  tapBanner: function (e) {
    var name = this.data.banners[e.target.dataset.id].name;
    wx.showModal({
      title: '提示',
      content: '您点击了“' + name + '”活动链接，活动页面暂未完成！',
      showCancel: false
    });
  },

  // sendUserOpenidName: function (openid) {
  //   // setTimeout(() => {
  //   wx.request({
  //     url: 'https://jiejie.io/wxserver/bind_user',
  //     data: { openid: openid, name: this.data.userInfo.nickName },
  //     success: res => {
  //       console.log("发送 bind_user")
  //     }
  //   })
  //   // }, 1000)
  // },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    that.openShare()
    console.log("onLoad")
    // that.area(areaId)
    if (options.t) {
      let t = decodeURIComponent(options.t)
      if (app.globalData.scene == 1044) {
        if (app.globalData.shareTicket) {
          GetShareInfo(t)
        }
      }
    }
    if (options.scene) { //有参数
      let scene = decodeURIComponent(options.scene);
      // console.log("判断：入口有参数", options)
      that.area(scene)
    } else { //没有参数
      // console.log("入口没有参数", options)
      if (app.globalData.areaId == null) {
        that.getAreaId()
      } else {
        that.area(app.globalData.areaId)
      }
    }
  },

  // 开启分享
  openShare: function () {
    wx.showShareMenu({
      withShareTicket: true,
    })
  },

  area: function (value) {
    // wx.setStorageSync('areaId', value)
    // console.log("入口参数id或用户所在区域id: " + value)
    var areaId = wx.getStorageSync('areaId') || ''
    // console.log("获取缓存中的areaId：" + areaId)
    if (!areaId) {
      // console.log("没有区域ID，缓存ID：" + value)
      wx.setStorage({
        key: "areaId",
        data: value,
      })
      app.globalData.areaId = value
      this.getSuppliersPromise()
    } else {
      // 对比入口参数
      if (value == areaId) {
        // console.log("区域id相同,直接请求")
        // console.log("输出当前app.globalData.areaId：" + app.globalData.areaId)
        app.globalData.areaId = areaId
        // console.log("保存当前app.globalData.areaId", app.globalData.areaId)
        this.getSuppliersPromise()
      } else {
        // console.log("输出当前app.globalData.areaId：" + app.globalData.areaId)
        app.globalData.areaId = value
        // console.log("区域id不同，替换 app.globalData.areaId ," + app.globalData.areaId)
        wx.setStorageSync('areaId', value)
        // console.log("替换缓存areaId：" + value + " 并发起请求")
        this.getSuppliersPromise()
      }
    }
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

  //获取缓存方法
  getStorageOpenidAndToken: function () {
    wx.getStorage({
      key: 'openid',
      success: (res) => {
        this.setData({
          openid: res.data,
        })
      }
    })
    wx.getStorage({
      key: 'token',
      success: (res) => {
        this.setData({
          token: res.data,
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function (e) {
    let that = this
    // 每次进入页面更新
    if (that.data.isOneTime == true) {
      this.getSuppliersPromise()
    }
  },

  getSuppliersPromise: function () {
    return new Promise((resolve, reject) => {
      app.getOpenId().then((token) => {
        // console.log(token)
        this.setData({
          token: token
        })
        resolve(
          this.getSuppliers(token),
          this.getPoints(token)
        )
      }).catch(err => {
        reject(err)
      })
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
        // console.log("请求GPS定位保存当前定位信息", res.data.data.areaHit)
        that.getSuppliersPromise()
      },
      fail: function (res) {
        // console.log("index 错误" + res)
      }
    });
  },

  getSuppliers: function (token) {
    var that = this;
    let gql = client.GraphQL({
      url: api.WxUnauth + token
    });
    // console.log("222请求之前app.globalData.areaId", app.globalData.areaId)
    if (app.globalData.areaId == undefined || app.globalData.areaId == null) {
      // console.log("没有本地缓存")
      if (app.globalData.areaHit) {
        // console.log("使用定位信息", app.globalData.areaHit)
        app.globalData.areaId = app.globalData.areaHit.id
        wx.setStorageSync('areaId', app.globalData.areaHit.id)
        // console.log("缓存定位areaId,", app.globalData.areaHit.id)
      } else {
        console.log("没有使用定位信息")
      }
    } else {
      wx.setStorageSync('areaId', app.globalData.areaId)
      // console.log("有app.globalData.areaId,更新缓存", app.globalData.areaId)
    }
    let first = that.data.first
    let after = ""
    gql({
      body: Supplier(app.globalData.areaId, first, after),
      success: function (res) {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          // client.ErrMsg(res.data.error)
          console.log("区域获取供应商失败")
          return
        }
        // console.log(res)
        // return
        let suppliers = res.data.data.suppliers.edges
        that.setData({
          suppliers: suppliers,
          isOneTime: true,
          after: res.data.data.suppliers.pageInfo.endCursor
        })
        if (suppliers.length !== 0) {
          if (suppliers[0].node.area) {
            wx.setNavigationBarTitle({
              title: '商家－' + suppliers[0].node.area.name,
            })
          }
          console.log("欢迎来到" + suppliers[0].node.area.name)
        }
      },
      fail: function (res) {
        // console.log("index 错误" + res)
      }
    });
    // console.log(openid)
  },

  getMoreSuppliers: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });

    if (that.data.after == "") {
      that.setData({
        theEnd: true,
      })
      return
    }
    let first = that.data.first
    let after = that.data.after
    gql({
      body: Supplier(app.globalData.areaId, first, after),
      //Bｏｄｙ == 数据结构　　
      success: function (res) {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        // return
        var after = res.data.data.suppliers.pageInfo.endCursor
        that.setData({
          after: after
        })
        if (after !== "") {
          var moreOrders = res.data.data.suppliers.edges //数据结构
          var suppliers = that.data.suppliers
          var itemNum = 0
          var giftNum = 0

          moreOrders.forEach((item) => {
            suppliers.push(item)
          })
          that.setData({
            suppliers: suppliers
          })
        }
        //total服务端的返回的总共页数
      },
      fail: function (res) { }
    });
  },

  onReachBottom: function () {
    console.log(1)
    this.getMoreSuppliers()
  },

  onHide: function () {
    this.setData({
      theEnd: false
    })
  },

  goToShop: function (e) {
    var index = e.currentTarget.dataset.index
    var id = this.data.suppliers[index].node.id
    var name = this.data.suppliers[index].node.name
    var openid = this.data.openid
    var token = this.data.token
    var address = this.data.suppliers[index].node.address
    var businesses = this.data.suppliers[index].node.businesses
    var industryName = this.data.suppliers[index].node.industryName
    var monthSales = this.data.suppliers[index].node.monthSales
    var followed = this.data.suppliers[index].node.followed
    // var url = "/pages/shop/shop?id=" + encodeURIComponent(id) + "&name=" + name + "&openid=" + openid
    var url = "/pages/category/category?id=" + encodeURIComponent(id) + "&name=" + name + "&token=" + token + "&address=" + address + "&businesses=" + businesses + "&industryName=" + industryName + "&monthSales=" + monthSales + "&followed=" + followed
    wx.navigateTo({
      url: url,
    })
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
    GetShareToken(supplierId, fromPage, toPage, token).then((t) => {
      // console.log("得到token")
      // console.log(t)
    })
    return {
      title: '进货管家',
      path: '/pages/index/index?scene=' + app.globalData.areaId + '&t=' + encodeURIComponent(token)
    }

  },
  launchAppError: function (e) {
    console.log(e)
  }
})