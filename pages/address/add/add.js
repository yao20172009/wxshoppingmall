var commonCityData = require('../../../utils/city.js')
const api = require('../../../config/api.js')
const client = require('../../../utils/graphql.js')
const { AddAddress } = require('../../../models/address/add.js')
const { UpdateAddress } = require('../../../models/address/update.js')
const regMobile = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;

//获取应用实例
var app = getApp()
Page({
  data: {
    provinces: [],
    citys: [],
    districts: [],
    linkMan: "",
    mobile: "",
    selProvince: '请选择',
    address: "",
    // code: "",
    selCity: '请选择',
    selDistrict: '请选择',
    selProvinceIndex: 0,
    selCityIndex: 0,
    selDistrictIndex: 0,
    active: "",
    id: "",
    openSetting: false,
  },
  bindCancel: function () {
    wx.navigateBack({})
  },

  bindSave: function (e) {
    var that = this;
    var linkMan = e.detail.value.linkMan;
    var address = e.detail.value.address;
    var mobile = e.detail.value.mobile;
    // var code = e.detail.value.code;

    this.setData({
      linkMan: linkMan,
      mobile: mobile,
      address: address,
      // code: code,
    })

    if (linkMan == "") {
      wx.showModal({
        title: '提示',
        content: '请填写联系人姓名',
        showCancel: false
      })
      return
    }
    if (!regMobile.test(mobile)) {
      wx.showModal({
        title: '提示',
        content: '手机号码有误',
        showCancel: false
      })
      return
    }
    if (this.data.selProvince == "请选择") {
      wx.showModal({
        title: '提示',
        content: '请选择地区',
        showCancel: false
      })
      return
    }
    if (this.data.selCity == "请选择") {
      wx.showModal({
        title: '提示',
        content: '请选择地区',
        showCancel: false
      })
      return
    }
    // var cityId = commonCityData.cityData[this.data.selProvinceIndex].cityList[this.data.selCityIndex].id;
    // var districtId;
    // if (this.data.selDistrict == "请选择" || !this.data.selDistrict) {
    //   districtId = '';
    // } else {
    //   districtId = commonCityData.cityData[this.data.selProvinceIndex].cityList[this.data.selCityIndex].districtList[this.data.selDistrictIndex].id;
    // }
    if (address == "") {
      wx.showModal({
        title: '提示',
        content: '请填写详细地址',
        showCancel: false
      })
      return
    }
    // if (code == "") {
    //   wx.showModal({
    //     title: '提示',
    //     content: '请填写邮编',
    //     showCancel: false
    //   })
    //   return
    // }
    this.save();
  },

  // 将地址信息保存进服务器
  save: function (e) {
    let that = this;
    let body = null;
    let { linkMan, mobile, selProvince, selCity, selDistrict, address } = that.data;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let input = {
      clientMutationId: 0,
      receiver: linkMan,
      phone: mobile,
      province: selProvince,
      city: selCity,
      county: selDistrict == "请选择" ? " " : selDistrict,
      road: address
    }
    if (that.data.active == 'edit') {
      input.id = that.data.objectId;
      body = UpdateAddress(input);

    } else {
      input.default = false;
      body = AddAddress(input);
    }

    gql({
      body: body,
      success: function (res) {
        console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          return
        }
        if (res.data.errors) {
          var errors = res.data.errors
          wx.showModal({
            title: '温馨提示',
            content: errors[0].message,
          })
          return
        }
        wx.showToast({
          title: '操作成功',
          icon: 'success',
          duration: 5000,
          success: res => {
            that.setStorage_addressList(input)
            wx.navigateBack({
              delta: 0,
            })
          }
        })
      },
      fail: function (res) {
        console.log('fail')
        wx.showToast({
          title: '操作失败',
          icon: 'none',
          duration: 5000,
        })
      },
    });
  },
  // 更新地址缓存
  setStorage_addressList: function (input) {
    var addressList = wx.getStorageSync('addressList') || [];
    addressList.push(input)
    try {
      wx.setStorageSync('addressList', addressList)
    } catch (e) {
      console.log(e)
    }
    // console.log(this.data.addressList)
  },

  initCityData: function (level, obj) {
    if (level == 1) {
      var pinkArray = [];
      for (var i = 0; i < commonCityData.cityData.length; i++) {
        pinkArray.push(commonCityData.cityData[i].name);
      }
      this.setData({
        provinces: pinkArray
      });
    } else if (level == 2) {
      var pinkArray = [];
      var dataArray = obj.cityList
      for (var i = 0; i < dataArray.length; i++) {
        pinkArray.push(dataArray[i].name);
      }
      this.setData({
        citys: pinkArray
      });
    } else if (level == 3) {
      var pinkArray = [];
      var dataArray = obj.districtList
      for (var i = 0; i < dataArray.length; i++) {
        pinkArray.push(dataArray[i].name);
      }
      this.setData({
        districts: pinkArray
      });
    }

  },
  bindPickerProvinceChange: function (event) {
    var selIterm = commonCityData.cityData[event.detail.value];
    this.setData({
      selProvince: selIterm.name,
      selProvinceIndex: event.detail.value,
      selCity: '请选择',
      selCityIndex: 0,
      selDistrict: '请选择',
      selDistrictIndex: 0
    })
    this.initCityData(2, selIterm)
  },
  bindPickerCityChange: function (event) {
    var selIterm = commonCityData.cityData[this.data.selProvinceIndex].cityList[event.detail.value];
    this.setData({
      selCity: selIterm.name,
      selCityIndex: event.detail.value,
      selDistrict: '请选择',
      selDistrictIndex: 0
    })
    this.initCityData(3, selIterm)
  },
  bindPickerChange: function (event) {
    var selIterm = commonCityData.cityData[this.data.selProvinceIndex].cityList[this.data.selCityIndex].districtList[event.detail.value];
    if (selIterm && selIterm.name && event.detail.value) {
      this.setData({
        selDistrict: selIterm.name,
        selDistrictIndex: event.detail.value
      })
    }
  },

  getStorage: function () {
    wx.getStorage({
      key: 'addressList',
      success: res => {
        var { receiver, phone, province, city, county, road } = res.data[this.data.index]
        this.setData({
          addressData: {
            linkMan: receiver,
            mobile: phone,
            address: road
          },
          selProvince: province,
          selCity: city,
          selDistrict: county
        })
      }
    })
  },

  onLoad: function (e) {
    var that = this;
    this.initCityData(1);
    var active = e.active
    if (e.active !== undefined || e.index !== undefined) {
      that.setData({
        index: e.index,
        active: e.active,
        objectId: decodeURIComponent(e.objectId)
      })
    }
    if (active == "edit") {
      that.getStorage()
    }
  },

  onShow: function (e) {
  },
  setDBSaveAddressId: function (data) {
    var retSelIdx = 0;
    for (var i = 0; i < commonCityData.cityData.length; i++) {
      if (data.provinceId == commonCityData.cityData[i].id) {
        this.data.selProvinceIndex = i;
        for (var j = 0; j < commonCityData.cityData[i].cityList.length; j++) {
          if (data.cityId == commonCityData.cityData[i].cityList[j].id) {
            this.data.selCityIndex = j;
            for (var k = 0; k < commonCityData.cityData[i].cityList[j].districtList.length; k++) {
              if (data.districtId == commonCityData.cityData[i].cityList[j].districtList[k].id) {
                this.data.selDistrictIndex = k;
              }
            }
          }
        }
      }
    }
  },
  selectCity: function () {

  },

  readFromWx: function () {
    let that = this;
    wx.chooseAddress({
      success: function (res) {
        let provinceName = res.provinceName;
        let cityName = res.cityName;
        let diatrictName = res.countyName;
        let retSelIdx = 0;

        for (var i = 0; i < commonCityData.cityData.length; i++) {
          if (provinceName == commonCityData.cityData[i].name) {
            let eventJ = { detail: { value: i } };
            that.bindPickerProvinceChange(eventJ);
            that.data.selProvinceIndex = i;
            for (var j = 0; j < commonCityData.cityData[i].cityList.length; j++) {
              if (cityName == commonCityData.cityData[i].cityList[j].name) {
                //that.data.selCityIndex = j;
                eventJ = { detail: { value: j } };
                that.bindPickerCityChange(eventJ);
                for (var k = 0; k < commonCityData.cityData[i].cityList[j].districtList.length; k++) {
                  if (diatrictName == commonCityData.cityData[i].cityList[j].districtList[k].name) {
                    //that.data.selDistrictIndex = k;
                    eventJ = { detail: { value: k } };
                    that.bindPickerChange(eventJ);
                  }
                }
              }
            }

          }
        }

        that.setData({
          wxaddress: res,
          openSetting: false,
        });
      },
      fail: res => {
        this.setData({
          openSetting: true
        })
      }
    })
  },
  onShow: function () {
    this.setData({
      openSetting: false
    })
  },
})
