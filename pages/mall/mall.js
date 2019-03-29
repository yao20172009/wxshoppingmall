var app = getApp()
const util = require('../../utils/util.js')
const api = require('../../config/api.js')
const client = require('../../utils/graphql.js')
const {
  SystemCategories,
} = require('../../models/mallApi/systemCategories.js')
const {
  CategorypProduct,
  AllProducts
} = require('../../models/mallApi/products.js')
Page({
  data: {
    categories: [], //一级分类
    menu: [], //二级分类
    systemCategoryId: "", //当前分类id
    currentTab: 0, //一级分类当前index
    currentTab2: null, //二级分类当前index
    scrollLeftValue: 0,
    isPickerShow: false,
    isBgNeed: false,
    commodities: [],
    first: 10,
    after: "",
    categorie1: [], //分类总数据
    products: [], //产品数据
    hasNextPage: true,
    scrollTop: 0,
    floorstatus: false,
    height: 0,
    imgData: ["https://assets.jiejie.io/brain/1543566642909902613_mmexport1543483606535.jpg",
    "https://assets.jiejie.io/brain/1543566668661088162_mmexport1543484167273.jpg",
    "https://assets.jiejie.io/brain/1541830288113858666_mmexport1541830146498.jpg"]
  },

  goToSearch: function() {
    wx.navigateTo({
      url: '/pages/mallSearch/mallSearch',
    })
  },
  goTop: function(e) {
    this.setData({
      scrollTop: 0
    })
  },
  scroll: function(e) {
    if (e.detail.scrollTop > 500) {
      this.setData({
        floorstatus: true
      });
    } else {
      this.setData({
        floorstatus: false
      });
    }
  },
  navbarTap: function(e) {
    //将顶部导航栏自动移动到合适的位置
    var idx = e.currentTarget.dataset.idx;
    this.autoScrollTopNav(idx);
    //自动收回
    if (this.data.isPickerShow) {
      this.navbarBtnClick();
    }
    this.setData({
      currentTab: idx,
      currentTab2:null,
      hasNextPage:true,
    })
  },

  //  导航栏右侧箭头
  navbarBtnClick: function(e) {
    this.data.isBgNeed = !this.data.isPickerShow
    this.setData({
      isBgNeed: this.data.isBgNeed
    })

    this.data.isPickerShow = !this.data.isPickerShow
    this.setData({
      isPickerShow: this.data.isPickerShow,
    })
  },

  //  页面左右滑动事件
  swiperChange: util.throttle(function(e) {
    var idx = e.detail.current;
    this.autoScrollTopNav(idx);
    var categories = this.data.categories
    var categorie1 = this.data.categorie1
    var menu = []
    categorie1.forEach((cat) => {
      if (categories[idx] === cat.name)
        cat.children.forEach((chi) => {
          menu.push(chi.name)
        })
    })
    this.setData({
      currentTab: e.detail.current,
      menu: menu
    })
    let systemCategoryId = this.data.systemCategoryId
    let currentTab2 = this.data.currentTab2
    // console.log(idx)
    if(idx == 0) {
      this.getAllProducts()
    }else{
      this.getProducts(categorie1[idx-1].id, categorie1[idx-1].name)
    }
  },1000),

  /**
   * 上拉刷新
   */
  updateItem: function(e) {
    // var idx = this.data.currentTab;
    // this.data.commodities[idx] = [];
    // this.downloadMoreItem();
  },

  /**
   * 下载更多数据 - 涉及后台拉取数据，需完善
   */
  downloadMoreItem: function(e) {
    var idx = this.data.currentTab;
    // console.log(11)
    if(idx == 0) {
      this.getMoreAllProducts()
    }else {
      this.getMoreProducts()
    }
  },

  // 用于自动调整顶部类别滑动栏滑动距离，使滑动到用户可接受的合适位置，但自适应上还未考虑太周到
  //@param {number} idx - The index of currentTap.
  autoScrollTopNav: function(idx) {
    if (idx <= 2) {
      this.data.scrollLeftValue = 0;
    } else {
      this.data.scrollLeftValue = (idx - 2) * 60;
    }
    this.setData({
      scrollLeftValue: this.data.scrollLeftValue
    })
  },

  //  模糊背景点击事件 - 点击模糊背景取消选择
  bgTap: function(e) {
    if (this.data.isPickerShow) {
      this.navbarBtnClick();
    } else {
      return;
    }
  },


  //  商品点击事件
  itemTap: function(e) {
    let products = this.data.products
    let index = e.currentTarget.dataset.idx
    let item = products[index].node
    let id = item.id
    let product_detail = {
      cart: null,
      id: id,
      name: item.name,
      price: item.price,
      unit: item.unit,
      quantity: 1,
      inventory: item.inventory,
      imageUrls: item.imageUrls,
      supplier: item.supplier,
    }
    app.globalData.product_detail = product_detail
    wx.navigateTo({
      url: '/pages/category/product/product?id=' + encodeURIComponent(id),
    })
  },


  /**
   * 生命周期函数--监听页面加载，在加载的时候抓取数据
   */
  onLoad: function(options) {
    app.getOpenId().then((token) => {
      app.globalData.token = token
      setTimeout(() => {
        this.getSystemCategories()
      }, 200)
    })
  },

  onShow: function() {
    if (app.globalData.updataEvent == true) {
      this.getSystemCategories()
    }
  },

  onShareAppMessage: function(){

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    app.globalData.updataEvent == null
  },

  //获取分类
  getSystemCategories: function() {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    gql({
      body: SystemCategories,
      success: res => {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        // categorie1
        let systemCategories = res.data.data.systemCategories
        let categories = ["全部商品"]
        let menu0 = [] //第一个二级菜单
        systemCategories.forEach((sys) => {
          categories.push(sys.name)
        })
        systemCategories[0].children.forEach((chi) => {
          menu0.push(chi.name)
        })
        that.setData({
          categories: categories,
          categorie1: systemCategories,
          menu: menu0,
        })
        // let oneMenuId = systemCategories[0].id
        // let oneMenuName = systemCategories[0].name
        // that.getProducts(oneMenuId,) //进入第一个菜单请求
        that.getAllProducts()
      },
      fail: res => {}
    });
  },

  getAllProducts: function(){
    // AllProducts
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    gql({
      body: AllProducts(first, after, app.globalData.areaId),
      success: res => {
        // console.log(res)
        let products = res.data.data.products.edges
        let hasNextPage = res.data.data.products.pageInfo.hasNextPage
        let after = res.data.data.products.pageInfo.endCursor
        products.forEach((pro) => {
          pro.node.productUnits.forEach((unt) => {
            if (unt.isDefault == true) {
              pro.node.price = unt.price
              pro.node.unit = unt.name
              pro.node.unitId = unt.id
              pro.node.inventory = unt.inventory
            }
          })
        })
        that.setData({
          products: products,
          hasNextPage: hasNextPage,
          after: after,
          currentTab:0,
        })
        // console.log(products)
      },
      fail: res => { },
    })
  },

  getProducts: function(value,) {
    let that = this;
    let systemCategoryId = value
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let first = that.data.first
    let after = ""
    gql({
      body: CategorypProduct(first, after, systemCategoryId, app.globalData.areaId),
      success: res => {
        // console.log(res)
        let products = res.data.data.products.edges
        let hasNextPage = res.data.data.products.pageInfo.hasNextPage
        let after = res.data.data.products.pageInfo.endCursor
        products.forEach((pro) => {
          // pro.node.name = oneMenuName + " - " + pro.node.name
          pro.node.productUnits.forEach((unt) => {
            if (unt.isDefault == true) {
              pro.node.price = unt.price
              pro.node.unit = unt.name
              pro.node.unitId = unt.id
              pro.node.inventory = unt.inventory
            }
          })
        })
        that.setData({
          products: products,
          systemCategoryId: systemCategoryId,
          hasNextPage: hasNextPage,
          after: after
        })
        // console.log(products)
      },
      fail: res => {},
    })
  },
  bindmenu2: function(e) {
    // console.log(e)
    // 2级当前所在index
    var idx = e.currentTarget.dataset.idx;
    //1级菜当前index
    var currentTab = this.data.currentTab - 1
    var categorie1 = this.data.categorie1
    let id = categorie1[currentTab].children[idx].id
    let name = categorie1[currentTab].children[idx].name
    console.log(id,name)
    this.setData({
      currentTab2: idx,
      // systemCategoryId: id,
    })
    this.getProducts(id, name)
  },

  getMoreProducts: function() {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let hasNextPage = that.data.hasNextPage
    if (hasNextPage == false) return
    let first = that.data.first
    let after = that.data.after
    let systemCategoryId = that.data.systemCategoryId
    gql({
      body: CategorypProduct(first, after, systemCategoryId, app.globalData.areaId),
      　 //　ｂｏｄｙ == 数据结构　　
      success: function(res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        let products = that.data.products
        let newProducts = res.data.data.products.edges
        let hasNextPage = res.data.data.products.pageInfo.hasNextPage
        let after = res.data.data.products.pageInfo.endCursor
        newProducts.forEach((pro) => {
          // pro.node.name = oneMenuName + " - " + pro.node.name
          pro.node.productUnits.forEach((unt) => {
            if (unt.isDefault == true) {
              pro.node.price = unt.price
              pro.node.unit = unt.name
              pro.node.unitId = unt.id
              pro.node.inventory = unt.inventory
            }
          })
        })
        newProducts.forEach((item) => {
          products.push(item)
        })
        that.setData({
          products: products,
          hasNextPage: hasNextPage,
          after: after,
        })
        // console.log(products)
      },
      fail: function(res) {}
    })
  },

  getMoreAllProducts: function () {
    let that = this;
    let gql = client.GraphQL({
      url: api.WxGqlApiUrl + app.globalData.token
    });
    let hasNextPage = that.data.hasNextPage
    if (hasNextPage == false) return
    let first = that.data.first
    let after = that.data.after
    gql({
      body: AllProducts(first, after, app.globalData.areaId),
      //　ｂｏｄｙ == 数据结构　　
      success: function (res) {
        // console.log(res)
        var statusCode = res.statusCode
        if (statusCode == 401) {
          client.ErrMsg(res)
          // that.updataToken()
          return
        }
        let products = that.data.products
        let newProducts = res.data.data.products.edges
        let hasNextPage = res.data.data.products.pageInfo.hasNextPage
        let after = res.data.data.products.pageInfo.endCursor
        newProducts.forEach((pro) => {
          pro.node.productUnits.forEach((unt) => {
            if (unt.isDefault == true) {
              pro.node.price = unt.price
              pro.node.unit = unt.name
              pro.node.unitId = unt.id
              pro.node.inventory = unt.inventory
            }
          })
        })
        newProducts.forEach((item) => {
          products.push(item)
        })
        that.setData({
          products: products,
          hasNextPage: hasNextPage,
          after: after,
        })
        // console.log(products)
      },
      fail: function (res) { }
    })
  },
})