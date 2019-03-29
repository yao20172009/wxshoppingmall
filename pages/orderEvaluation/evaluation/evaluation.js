var app = getApp()
const api = require('../../../config/api.js')
const client = require('../../../utils/graphql.js')
const { CreateOrderRate } = require('../../../models/order/createOrderRate.js')
const { UpdateOrderRate } = require('../../../models/order/updateOrder.js')
let $ = require('../../../utils/upimage.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    evaluate_contant: ['服务评分', '物流评分', '商品评分'],
    stars: [0, 1, 2, 3, 4],
    normalSrc: '../../../images/order-details/start_no.png',
    selectedSrc: '../../../images/order-details/start_yes.png',
    score: 0,
    scores: [0, 0, 0],
    contact: "",
    id: "",
    active: "",
    formdata: '',
    // 预览图片
    imgs: [],
    // 上传图片(上传成功)->展示页面
    upload_picture_list: []
  },

  //选择图片方法
  chooseImage() {
    $.cImage(this, 8, api.WxUpImages);
  },
  //点击上传图片
  uploadimage() {
    $.uImage(this, api.WxUpImages);
  },
  // 点击删除图片
  deleteImg(e) {
    $.dImage(e, this);
  },
  // 预览图片
  previewImg(e) {
    $.pImage(e, this);
  },

  upload: function () {
    var that = this
    console.log(that.data.upload_picture_list)
  },
  upimg: function () {
    var that = this;
    if (this.data.img_arr.length < 3) {
      wx.chooseImage({
        sizeType: ['original', 'compressed'],
        success: function (res) {
          that.setData({
            img_arr: that.data.img_arr.concat(res.tempFilePaths)
          })
        }
      })
    } else {
      wx.showToast({
        title: '最多上传三张图片',
        icon: 'loading',
        duration: 3000
      });
    }
  },

  // 提交事件
  submit_evaluate: function (e) {
    let contact = e.detail.value.opinion;
    console.log('评价得分，' + this.data.scores)
    console.log("评论，" + contact)
    let that = this;
    let scores = that.data.scores
    let active = that.data.active
    let imageUrls = that.data.upload_picture_list
    let updataImageKeys = []
    imageUrls.forEach((item)=>{
      updataImageKeys.push(item.path_key)
    })
    let input = {
      rateOnService: scores[0],
      rateOnDelivery: scores[1],
      rateOnOrder: {
        value: scores[2],
        comment: contact,
        imageUrls: updataImageKeys,
      },
      clientMutationId: 0,
      orderId: that.data.id,
      formId: e.detail.formId,
    }
    console.log(input)
    // return
    if (active !== "update") {
      that.upload()
      that.addPingjia(input)
    } else {
      that.updatePingjia(input)
    }
  },

  addPingjia: function (input) {
    let that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: CreateOrderRate(input),
      success: res => {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        if (res.data.errors) {
          wx.showModal({
            title: '操作失败',
            content: res.data.errors[0].message,
          })
          return
        }
        app.globalData.updataEvent = true
        if (res.data.data.createOrderRate !== null) {
          wx.showToast({
            title: '评论成功',
          })
          setTimeout(() => {
            wx.navigateBack({})
          }, 1000)
        }
      },
      fail: res => {
      }
    });
  },

  updatePingjia: function (input) {
    let that = this
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: UpdateOrderRate(input),
      success: res => {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        if (res.data.errors) {
          wx.showModal({
            title: '操作失败',
            content: res.data.errors[0].message,
          })
          return
        }
        app.globalData.updataEvent = true
        if (res.data.data.createOrderRate !== null) {
          wx.showToast({
            title: '修改成功',
          })
          setTimeout(() => {
            wx.navigateBack({})
          }, 1000)
        }
      },
      fail: res => {
      }
    });
  },

  //点击左边,半颗星
  selectLeft: function (e) {
    var score = e.currentTarget.dataset.score
    this.data.scores[e.currentTarget.dataset.idx] = score,
      this.setData({
        scores: this.data.scores,
        score: score
      })

  },

  //点击右边,整颗星
  selectRight: function (e) {
    var score = e.currentTarget.dataset.score
    this.data.scores[e.currentTarget.dataset.idx] = score,
      this.setData({
        scores: this.data.scores,
        score: score
      })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    this.setData({
      id: decodeURIComponent(id)
    })
    if (options.active) {
      this.setData({
        active: options.active
      })
      if (options.active == "update") {
        this.update()
      }
    }
    // new ImageUploader(this, 'img1');
    // new ImageUploader(this, 'img2');
  },

  update: function () {
    let rateSet = app.globalData.rateSet
    console.log(rateSet)
    let scores = this.data.scores
    let contact = this.data.contact
    let upload_picture_list = this.data.upload_picture_list
    scores[0] = rateSet.service
    scores[1] = rateSet.delivery
    scores[2] = rateSet.order.value
    contact = rateSet.order.comment.content
    let imgs = []
    // images = rateSet.order.comment.images
    if (rateSet.order.comment.images == null) {
      upload_picture_list = []
    }else {
      rateSet.order.comment.images.forEach((item) => {
        upload_picture_list.push({
          path: "",
          path_key: item.key,
          path_server: item.url,
          upload_percent: 100,
        })
        imgs.push(item.url)
      })
    }
    this.lookImages(imgs)
    // console.log(imgs)
    this.setData({
      scores: scores,
      contact: contact,
      upload_picture_list: upload_picture_list,
    })
  },

  lookImages: function (imgs){
    $.lookImage(this, imgs)
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

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    app.globalData.rateSet = null
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