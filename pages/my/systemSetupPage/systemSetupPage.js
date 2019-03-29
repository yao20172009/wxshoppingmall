const app = getApp()
const api = require('../../../config/api.js')
const client = require('../../../utils/graphql.js')
const { GetAreaId } = require('../../../models/location/getAreaId.js')
const { GetAreas } = require('../../../models/location/getAreas.js')
const { UpdateArea } = require('../../../models/location/updateArea.js')
const { CanUpdateArea } = require('../../../models/can/canUpdateArea.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    version: app.globalData.version,
    countryList: [],
    countryIndex: 0,
    areas: [],
    area:null,//用户所在区域
    can: false, //是否有修改权限,这里做成是否看得见
  },
  // 选择国家函数
  changeCountry(e) {
    console.log(this.data.area)
    var area = this.data.area
    var areas = this.data.areas
    console.log(this.data.areas)
    var checkCity = this.data.countryList[e.detail.value]
    console.log("选择了", checkCity )
    var checkCityId = ""
    areas.forEach((item)=>{
      if (checkCity === item.node.name) {
        checkCityId = item.node.id
      }
    })
    console.log("选择id，", checkCityId)
    var input = {
      clientMutationId: 0,
      areaId: checkCityId
    }
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: UpdateArea(input),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        if(res.data.data.updateArea.status == "ok") {
          wx.showToast({
            title: '修改成功',
          })
          area.name = checkCity
          app.globalData.areaId = checkCityId
          wx.setStorageSync('areaId', checkCityId)
          this.setData({ countryIndex: e.detail.value, area: area });
          app.globalData.updataEvent = true
        }
      },
      fail: (res) => {
        // console.log("index 错误" + res)
      }
    })

  },

  bindTabSuggestion: function () {
    wx.navigateTo({
      url: 'SuggestionsPage/SuggestionsPage'
    });
  },
  bindTabVersion: function () {
    wx.showModal({
      title: '版本信息',
      content: '版本号：' + this.data.version,
      showCancel: false
    })
  },

  openSetting() { wx.openSetting() },

  //清除缓存
  bindClearStorage: function () {
    try {
      wx.clearStorageSync()
      wx.showToast({
        title: '清除成功',
      })
    } catch (e) {
      // Do something when catch error
      console.log(e)
    }
  },
  bindTababoutus: function () {

    wx.navigateTo({
      url: 'aboutUsPage/aboutUsPage'
    });
  },

  bindSetting: function () {
    wx.navigateTo({
      url: 'settings/setting'
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.getAreas() //获取区域列表
    // this.getAreaId() //获取当前所在区域
    // this.canUpdateArea() //获取修改区域权限
  },
  getAreaId: function () {
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: GetAreaId,
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        console.log('用户所在区域，', res.data.data.viewer.area.name)
        this.setData({
          area: res.data.data.viewer.area
        })
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
    })
  },

  getAreas: function () {
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: GetAreas,
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        var areas = res.data.data.areas.edges
        var countryList = []
        areas.forEach((item)=>{
          countryList.push(item.node.name)
        })
        console.log(countryList)
        this.setData({
          areas: areas,
          countryList: countryList,
        })
      },
      fail: (res) => {
        // console.log("index 错误" + res)
      }
    })
  },

  canUpdateArea:function() {
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    var actions =[{action: "updateArea", model: "user" }]
    gql({
      body: CanUpdateArea(actions),
      success: (res) => {
        var statusCode = res.statusCode
        if (statusCode == "401") {
          client.ErrMsg(res)
          return
        }
        console.log("修改权限", res.data.data.can.actions[0].can)
        var can = res.data.data.can.actions[0].can
        this.setData({
          can: can
        })
      },
      fail: (res) => {
        console.log("index 错误" + res)
      }
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
    this.getAreas() //获取区域列表
    this.getAreaId() //获取当前所在区域
    this.canUpdateArea() //获取修改区域权限
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

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
  // onShareAppMessage: function () {

  // }
})