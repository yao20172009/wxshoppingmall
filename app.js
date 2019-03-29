//app.js
// liuxin-pay
const { loadSettings } = require('./utils/util')
const api = require('./config/api.js')
const client = require('./utils/graphql.js')
const { GetAreaId } = require('./models/location/getAreaId.js')
const { UserId } = require('./models/userId.js')
const { UnawarePointChanges } = require('./models/unawarePointChanges.js')
App({

  onLaunch: function (options) {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    this.globalData.settings = loadSettings()
    this.updateManger()//获取小程序新版本
    var openVoice = wx.getStorageSync('openVoice') || []
    if (!openVoice) {
      wx.setStorage({
        key: "openVoice",
        data: false,
      })
    }
    //获取定位信息
    // this.getLocation()
    setTimeout(()=>{
      console.log(this.globalData)
    },500)
    //检查登录是否过期
    this.checkSession()
  },
  
  updateManger:function(){
    // 获取小程序更新机制兼容
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                  updateManager.applyUpdate()
                }
              }
            })
          })
          updateManager.onUpdateFailed(function () {
            // 新的版本下载失败
            wx.showModal({
              title: '已经有新版本了哟~',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
            })
          })
        }
      })
    } else {
      // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  },

  getPoints: function(token){
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + token
    });
    gql({
      body: UnawarePointChanges,
      success: (res) => {
        var statusCode = res.statusCode
        // return
        console.log(res)
        let titles = []
        let id = null
        let items = []
        if (res.data.data.unawarePointChanges && res.data.data.unawarePointChanges !== null){
          id = res.data.data.unawarePointChanges.id
          items = res.data.data.unawarePointChanges.items
        }
        items.forEach((item)=>{
          titles.push(item.supplier.name + ":" + "\t" + item.points + "\t积分" + '\r\n')
        })
        console.log(titles)
        let title = (titles.join(""))
        wx.showModal({
          title: '获得积分',
          content: title,
        })
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },

  getAreaId: function (token){
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + token
    });
    gql({
      body: GetAreaId,
      success:  (res) => {
        var statusCode = res.statusCode
        console.log("111")
        if (res.data.data.viewer.area !== null) {
          this.globalData.area = res.data.data.viewer.area
        }else {
          this.getLocation()
        }
      },
      fail:  (res) => {
        console.log("index 错误" + res)
      }
    })
  },

  getUserId: function(token){
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + token
    });
    gql({
      body: UserId,
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          // client.ErrMsg(res)
          console.log("获取用户id失败")
          return
        }
        if (res.data.data.viewer.id) {
          console.log("获取用户id成功")
          this.globalData.UserId = res.data.data.viewer.id
        }
      },
      fail: (res) => {
        console.log("app.js 错误" + res)
      }
    })
  },

  getLocation: function() {
    wx.getLocation({
      type: 'wgs84',
      altitude: true,
      success: (res) => {
        this.globalData.location = res
      },
      fail: (res)=>{
        wx.showModal({
          title: '定位失败',
          content: '请授权获取定位信息～',
          cancelText:"不需要",
          confirmText:"去授权!",
          success: res =>{
            console.log(res)
            if(res.confirm) {
              wx.openSetting({
                success:res=>{
                  console.log(1)
                }
              })
            }
          }
        })
      },
      complete: (res) =>{},
    })
  },
    //检查登录是否过期
  checkSession: function(){
    wx.checkSession({
      success: function (e) {   //登录态未过期
        console.log("没过期");
      },
      fail: function () {   //登录态过期了
        console.log("过期了");
        wx.login({
          success: function (res) {
            if (res.code) {
              wx.setStorage({
                key: "code",
                data: res.code
              });
            } else {
              console.log('获取用户登录态失败！' + res.errMsg)
            }
          }
        });
      }
    });
  },
  getOpenId: function () {
    return new Promise((resolve, reject) => {
      if (this.globalData.token) {
        return resolve(this.globalData.token);
      }
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          var code = res.code;
          if (code) {
            // console.log('获取用户登录凭证code：' + code);
            // --------- 发送凭证 ------------------
            wx.request({
              url: 'https://api.jiejie.io/wxserver/openid',
              data: { code: code },
              success: res => {
                // console.log('res success', res)
                this.globalData.openid = res.data.reply.openid
                this.globalData.token = res.data.reply.token
                // if (res.data.reply.openid) {
                //   resolve(res.data.reply.openid)
                // }
                if (res.data.reply.token) {
                  resolve(res.data.reply.token)
                  // this.getAreaId(res.data.reply.token)
                  wx.setStorageSync('token', res.data.reply.token)
                  this.getUserId(res.data.reply.token)
                  // this.getPoints(res.data.reply.token)
                }
                // 由于 openid 是网络请求，可能会在 Page.onLoad 之后才返回
                // 所以此处加入 callback 以防止这种情况
                if (this.openidReadyCallback) {
                  this.openidReadyCallback(res)
                }
              }
            })
            // ------------------------------------
          } else {
            reject('获取用户登录态失败：' + res.errMsg);
          }
        }
      })
    })
  },
  globalData: {
    userInfo: null,
    openid: null,
    token: null,
    userId: null,
    areaid: null,
    area: null,
    website: 'https://jiejie.io',
    wssite: 'wss://jiejie.io/wxserver/ws',
    resources: {
      "din-ding": "http://p3evxan3i.bkt.clouddn.com/din-ding.mp3"
    },
    version: "0.0.54",
    activeItems: null,
    activeGifts: null,
    activeOrder: null,
    location: null,
    activeOrder: null,
    updataEvent: false,
    matchItem: null,
    matchItems:null,
    rateSet:null,
    product_detail:null,//商品详情
    shopMember: null,//商店会员信息,用于兑换卡卷对比
    scene:null,
    shareTicket:null,
    shareToken:null,//转发token
    payOrders:null,//提交订单后单个支付方式使用
  },
  onShow: function (options) {
    console.log("[onLaunch] 场景值:", options.scene)
    this.globalData.scene = options.scene
    if(options.shareTicket) {
      this.globalData.shareTicket = options.shareTicket
    }
  },
  //渐入，渐出实现 
  show: function (that, param, opacity) {
    var animation = wx.createAnimation({
      //持续时间800ms
      duration: 800,
      timingFunction: 'ease',
    });
    //var animation = this.animation
    animation.opacity(opacity).step()
    //将param转换为key
    var json = '{"' + param + '":""}'
    json = JSON.parse(json);
    json[param] = animation.export()
    //设置动画
    that.setData(json)
  },

  //滑动渐入渐出
  slideupshow: function (that, param, px, opacity) {
    var animation = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease',
    });
    animation.translateY(px).opacity(opacity).step()
    //将param转换为key
    var json = '{"' + param + '":""}'
    json = JSON.parse(json);
    json[param] = animation.export()
    //设置动画
    that.setData(json)
  },

  //向右滑动渐入渐出
  sliderightshow: function (that, param, px, opacity) {
    var animation = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease',
    });
    animation.translateX(px).opacity(opacity).step()
    //将param转换为key
    var json = '{"' + param + '":""}'
    json = JSON.parse(json);
    json[param] = animation.export()
    //设置动画
    that.setData(json)
  }

})