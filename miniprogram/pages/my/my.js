//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: {},
    currentSize:null,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    showPopup: false,
    checked:false
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  showRecent: function () {
    wx.navigateTo({
      url: '../collected/collected?gotoType=recent'
    })
  },
  showCollected: function () {
    wx.navigateTo({
      url: '../collected/collected?gotoType=collected'
    })
  },
  showAboutWechat: function () {
    wx.navigateTo({
      url: '../about/about_wechat'
    })
  },
  showDiary: function () {
    wx.navigateTo({
      url: '../diary/diary'
    })
  },
  onLoad: function () {
    let that = this;
    app.checkUserInfo(function (userInfo, isLogin) {
      if (!isLogin) {
        that.setData({
          showPopup: true
        })
      }
      else {
        that.setData({
          userInfo: userInfo
        });
      }
    });
  },
  onShow:function(){
    var that=this;
    wx.getStorageInfo({
      success: function (res) {
        that.setData({
          currentSize: res.currentSize
        })
      }
    })
  },
  bindGetUserInfo: function (e) {
    console.log(e.detail.userInfo)
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo
      this.setData({
        showPopup: !this.data.showPopup,
        userInfo: e.detail.userInfo
      });
    } else {
      wx.switchTab({
        url: '../index/index'
      })
    }
  },
  cleardata:function(){
    var that=this;
    wx.showModal({
      title:'确认清除数据？',
      content:'清除数据将清除最近浏览、我的收藏、我的喜欢记录',
      confirmColor:'#e64340',
      success:function(res){
        if(res.confirm){
          wx.clearStorage({
            success:function(){
              wx.showToast({
                title:'清除完毕',
                icon:'none'
              })
              wx.getStorageInfo({
                success: function (res) {
                  that.setData({
                    currentSize: res.currentSize
                  })
                }
              })
            }
          })
        }
      }
    })
  }
})