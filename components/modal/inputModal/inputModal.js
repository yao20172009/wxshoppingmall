Component({
  properties: {
    product :{
      type : Object
    }
  },

  data: {
    isShowModal: false
  },

  methods: {
    hideModal: function () {
      this.setData({
        isShowModal: false
      });
    },

    showModal: function() {
      this.setData({
        isShowModal: true
      })
    },

    _preventTouchMove: function () {
      // 弹出框蒙层截断touchmove事件
    },

    _onCancel: function () {
      this.hideModal();
    },

    _inputChange: function (e) {
      let inputNum = parseInt(e.detail.value);
      if (e.detail.value == '') {
        inputNum = null;
      }
      this.triggerEvent('inputChange', {inputNum: inputNum})
    },

    _onConfirm: function (e) {
      this.triggerEvent('confirm',{})
    }
  }
})