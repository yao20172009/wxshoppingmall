Page({

  /**
   * 页面的初始数据
   */
  data: {
    menuBox: {
      active: false,
    },
  },

  // openMenu: function () {
  //   var menuBox = this.data.menuBox
  //   if (menuBox.active == false) {
  //     this.setData({
  //       menuBox: {
  //         active: true
  //       }
  //     })
  //   } else {
  //     this.setData({
  //       menuBox: {
  //         active: false
  //       }
  //     })
  //   }
  //   console.log(this.data.menuBox)
  // },

  // colseMenu: function () {
  //   if (this.data.menuBox.active == false) {
  //     return
  //   }
  //   this.setData({
  //     menuBox: {
  //       active: false,
  //     }
  //   })
  // },

  // goUrls: function (e) {
  //   console.log(e.currentTarget.dataset.index)
  //   var index = e.currentTarget.dataset.index
  //   if (index == "1") {
  //     wx.navigateTo({
  //       url: '/pages/cart/index',
  //     })
  //   } else if (index == "2") {
  //     wx.navigateTo({
  //       url: '/pages/order/order',
  //     })
  //   } else if (index == "3") {

  //   } else if (index == "4") {
  //     wx.switchTab({
  //       url: '/pages/my/index',
  //     })
  //   } else if (index == "5") {
  //     wx.switchTab({
  //       url: '/pages/index/index',
  //     })
  //   } else if (index == "6") {
  //     wx.switchTab({
  //       url: '/pages/eachEvent/eachEvent',
  //     })
  //   }
  //   this.setData({
  //     menuBox: {
  //       active: false,
  //     }
  //   })
  // },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
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