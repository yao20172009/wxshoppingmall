// 邀请分享卡片用户进入后调用方法封装
const {
  CreateMiniProgramShare
} = require('../models/share/createMiniProgramShare.js')
const {
  CreateShareToken
} = require('../models/share/createShareToken.js')

var app = getApp()
const api = require('../config/api.js')
const client = require('./graphql.js')
// 获取转发详细信息
function getShareInfo(t) {
  let that = this
  console.log("获取转发信息")
  wx.getShareInfo({
    shareTicket: app.globalData.shareTicket,
    success: res => {
      console.log("success:", res)
      let encryptedData = res.encryptedData
      let iv = res.iv
      console.log(t)
      app.getOpenId().then((token) => {
        console.log("登入拿到token",token)
        app.globalData.token = token
        let gql = client.GraphQL({
          url: api.WxUnauth + app.globalData.token
        });
        let input = {
          encryptedData: encryptedData,
          iv: iv,
          clientMutationId: 0,
          t: t
        }
        gql({
          body: CreateMiniProgramShare(input),
          success: function(res) {
            console.log("分享进入")
            console.log(res)
            if (res.data.errors) {
              console.log(res.data.errors[0].message)
              return
            }
            console.log("被邀请成功")
          }
        })
      })
    },
    fail: res => {
      console.log("fail", res)
    },
  })
}


function createShareToken(supplierId1, fromPage1, toPage1,token1) {
  return new Promise(function(resolve, reject) {
    let that = this
    let supplierId = supplierId1
    let fromPage = fromPage1
    let toPage = toPage1
    let token = token1
    let gql = client.GraphQL({
      url: api.WxUnauth + app.globalData.token
    });
    let input = null
    if (supplierId) {
      input = {
        supplierId: supplierId,
        fromPage: fromPage,
        toPage: toPage,
        t:token,
        clientMutationId: 0
      }
    } else {
      input = {
        fromPage: fromPage,
        toPage: toPage,
        clientMutationId: 0,
        t: token,
      }
    }
    // console.log(input)
    gql({
      body: CreateShareToken(input),
      success: function(res) {
        // console.log("转发时")
        // console.log(res)
        if (res.data.errors) {
          console.log(res.data.errors[0].message)
          wx.showModal({
            title: '邀请失败',
            content: res.data.errors[0].message,
            cancelText: "取消",
            confirmText: "去登录",
            success: res => {
              if (res.confirm) {
                wx.navigateTo({
                  url: "/pages/authorize/index"
                })
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
          reject(res);
          return
        }
        if (res.data.data.createShareToken.status == "ok") {
          console.log("token success!")
        }
        // if (res.data.data.createShareToken.t) {
        //   var t = res.data.data.createShareToken.t
        //   console.log(t)
        //   resolve(t);
        // }
      },
      fail: function(err) {
        reject(err);
      }
    })

  })
}


module.exports = {
  GetShareInfo: getShareInfo,
  GetShareToken: createShareToken,
}