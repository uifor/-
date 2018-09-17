//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    
  },
  onLoad: function (options) {
    this.getamoke();
  },

  onShow: function () {
    
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
  getamoke: function () {
    wx.request({
      url: 'https://amoke.top/wp-json/wp/v2/users', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        console.log(res.data)
      }
    })

  },
})