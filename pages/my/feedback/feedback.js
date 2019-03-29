const api = require('../../../config/api.js')
const client = require('../../../utils/graphql.js')
var app = getApp()
const { createFeedback } = require('../../../models/createFeedback.js')

Page({
  data: {
    loading: false,
    contact: '',
    contant: ''
  },

  formSubmit: function (e) {
    let _that = this;
    let content = e.detail.value.opinion;
    let contact = e.detail.value.contant;
    let regPhone = /^1[3578]\d{9}$$/;
    let regEmail = /^[a-z\d_\-\.]+@[a-z\d_\-]+\.[a-z\d_\-]+$$/i;
    console.log(contact, content)
    if (content == "") {
      wx.showModal({
        title: '提示',
        content: '反馈内容不能为空!',
      })
      return false
    }
    if (contact == "") {
      wx.showModal({
        title: '提示',
        content: '手机号或者邮箱不能为空!',
      })
      return false
    }
    if (contact == "" && content == "") {
      wx.showModal({
        title: '提示',
        content: '反馈内容,手机号或者邮箱不能为空!',
      })
      return false
    }
    if ((!regPhone.test(contact) && !regEmail.test(contact)) || (regPhone.test(contact) && regEmail.test(contact))) {
      wx.showModal({
        title: '提示',
        content: '您输入的手机号或者邮箱有误!',
      })
      return false
    } else {
      this.setData({
        loading: true
      })

      let that = this;
      let gql = client.GraphQL({
        url: api.WxGqlApiUrl + app.globalData.token
      });

      var input = {
        clientMutationId: 0,
        contact: contact,
        content: content
      }

      gql({
        body: createFeedback(input),
        success: res => {
          console.log(res)
          wx.showModal({
            title: '提交成功',
            content: '感谢您对我们工作的大力支持！',
          })
          this.setData({
            loading: false,
            contact: ""
          })
        },
        fail: res => {
        }
      });
    }
  }
})