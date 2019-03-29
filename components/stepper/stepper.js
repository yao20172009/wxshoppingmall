// components/stepper/stepper.js
Component({
  properties: {
    num :{
      type : Number
    },
  },

  data: {
    num: 1,
    minusStatus: 'disabled'
  },

  methods: {
    /*点击减号*/
    bindMinus: function () {
      let num = this.data.num;
      if (num > 1) {
        num--;
      }
      let minusStatus = num <= 1 ? 'disable' : 'normal';
      this.setData({
        num: num,
        minusStatus: minusStatus
      });
    },
     /* 点击加号 */
    bindPlus: function (e) {
      // body...
      let num = e.detail.value;
      num++;
      let minusStatus = num < 1 ? 'disable' : 'normal';

      this.setData({
        num: num,
        minusStatus: minusStatus
      });
    },
    /* 输入框事件 */
    bindManual: function (e) {
      // body...
      let num = e.detail.value;
      this.setData({
        num: num
      })
    }
  }
})