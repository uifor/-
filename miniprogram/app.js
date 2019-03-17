//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
      wx.cloud.callFunction({
        name: 'get_userinfo',
        data: {},
        success: res => {
          this.globalData.openid = res.result.userInfo.openId
        },
        fail: err => {
          console.error('[云函数] [login] 调用失败', err)
        }
      })
    }
  },
  checkUserInfo: function (cb) {
    let that = this
    if (that.globalData.userInfo) {
      typeof cb == "function" && cb(that.globalData.userInfo, true);
    }
    wx.getSetting({
      success: function (res) {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = JSON.parse(res.rawData);
              typeof cb == "function" && cb(that.globalData.userInfo, true);
            }
          })
        }
        else {
          typeof cb == "function" && cb(that.globalData.userInfo, false);
        }
      }
    })
  },
  globalData: {
    amokedata:[],
    openid:"",
    userInfo:null,
    oneopen:1
  }
})