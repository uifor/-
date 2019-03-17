const wxApi = require('../../utils/wxApi.js');
const app = getApp()
Page({
  data: {
    onedata:[],
    close:'headclose',
    errorswitch: 'closeload',
    closeload: 'closeload'
  },
  onLoad: function (options) {
    this.getapi()
  },
  onShow: function () {
    var open = app.globalData.oneopen;
    if(open>=2){
      this.setData({
        close: 'head-Transit'
      })
    }else{
      app.globalData.oneopen=app.globalData.oneopen+1;
    }
  },
  onHide: function () {
    this.setData({
      close: 'headclose'
    })
  },
  onShareAppMessage: function () {
    
  },
  //获得两个日期之间相差的天数
  getDays:function(date1, date2){
    var date1Str = date1.split("-");//将日期字符串分隔为数组,数组元素分别为年.月.日
    //根据年 . 月 . 日的值创建Date对象
    var date1Obj = new Date(date1Str[0], (date1Str[1] - 1), date1Str[2]);
    var date2Str = date2.split("-");
    var date2Obj = new Date(date2Str[0], (date2Str[1] - 1), date2Str[2]);
    var t1 = date1Obj.getTime();
    var t2 = date2Obj.getTime();
    var dateTime = 1000 * 60 * 60 * 24; //每一天的毫秒数
    var minusDays = Math.floor(((t2 - t1) / dateTime));//计算出两个日期的天数差
    var days = Math.abs(minusDays);//取绝对值
    return days;
  },
  getapi:function(){
    var that=this;
    var myDate  = new Date();
    var date1='2018-10-20';
    var date2 = myDate.getFullYear()+'-'+(myDate.getMonth()+1)+'-'+myDate.getDate();
    var days = that.getDays(date1,date2);
    var nper = (2205 + days).toString();
    wxApi.getonedata(nper).then(res => {
      if(res.result.data.length){
        //判断云开发是否已经有one一个今日数据
        that.setData({
          onedata: res.result.data[0],
          close:'head-Transit'
        })
      }else{
        //不存在数据就向服务器获取数据
        that.setData({
          closeload: ''
        })
        wx.request({
          url: 'https://amoke.top/api',
          header: {
            'content-type': 'application/json' // 默认值
          },
          success: function (res) {
            if (res.data.title == nper){
            that.setData({
              onedata: res.data,
              close: 'head-Transit'
            })
            var onedata={
              title: res.data.title,
              time:res.data.time,
              content:res.data.content,
              imgUrl:res.data.imgUrl
            }
            //然后再获取到数据存到云开发
            wxApi.insertonedata(onedata).then(res => {console.log(res)})
            }else{
              //获取最后一次更新数据
              wxApi.getonedata((nper-1).toString()).then(res => {
                that.setData({
                  onedata: res.result.data[0],
                  close: 'head-Transit'
                })
              })
            }
          },
          fail: function () {
            that.setData({
              errorswitch: '',
            })
          },
          complete: function () {
            that.setData({
              closeload: 'closeload'
            })
          }
        })
      }
    })
  }
})