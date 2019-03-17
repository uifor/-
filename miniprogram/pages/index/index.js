const app = getApp();
const high = wx.createInnerAudioContext();
const wxApi = require('../../utils/wxApi.js');
high.src = 'cloud://uifor-aad5cd.7569-uifor-aad5cd/music/bgm_2.mp3'
Page({
  data: {
    mokedata:[],
    post_ids:[],
    post_data:[],
    pagenum:6,
    page:1,
    defaultimg:'../../images/default.jpg',
    errorswitch:'closeload',
    listmove:'list',
    closeload:'closeload',
    footer:"openfoot",
    highplay:true,
    toastdata:true,
  },
  onLoad: function (options) {
    this.getamoke();
  },
  //分享首页
  onShareAppMessage: function () {
    return {
      title: '墨客栈',
      path: 'pages/index/index',
      success(e) {
        wx.showShareMenu({
          withShareTicket: true
        });
      },
      fail(e) {
        console.log('转发失败')
      }
    }
  },
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //在标题栏中显示加载
    this.setData({
      mokedata:[],
      page:1,
      errorswitch: 'closeload',
      footer: 'openfoot',
      toastdata: true
    })
    app.globalData.amokedata = []
    this.onLoad()
    setTimeout(function () {
      // complete
      wx.hideNavigationBarLoading() //完成停止加载
      wx.stopPullDownRefresh() //停止下拉刷新
    }, 1500);
  },
  //上拉刷新
  onReachBottom: function (event) {
    var self = this;
    console.log(self.data.mokedata.length);
    var sumpage = self.data.pagenum*self.data.page;
    if (self.data.mokedata.length >= sumpage){
      wx.showNavigationBarLoading();
      self.setData({
        closeload: '',
        page: self.data.page+1
      })
      self.getamoke()
      setTimeout(function () {
        // complete
        self.setData({
          closeload: 'closeload'
        }) //停止上拉加载
        wx.hideNavigationBarLoading()
      }, 1000);
    }else{
      if (self.data.toastdata) {
        wx.showToast({
          title: "加载完毕",
          icon: "none"
        })
        self.setData({
          footer: '',
          toastdata: false
        });
      }
    }
  },
  //路由导航到文章内页
  redictSingle: function (event){
    var id = event.currentTarget.id; // 这里的id 其实是WordPress 中的文章id，需要传递到single 页面
    var url = '../single/single?id='+id;
    wx.navigateTo({
      url: url
    })
  },
  getamoke: function () {
    var that=this;
    wx.showNavigationBarLoading();
    that.setData({
      closeload:''
    })
    wx.request({
      url: 'https://amoke.top/wp-json/wp/v2/posts?per_page=' + that.data.pagenum+'&page='+that.data.page, 
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        if(res.data){
        var contentdata = res.data;
        for (var post of contentdata) {
          that.data.post_ids = that.data.post_ids.concat(post.id)
        }
        //将云开发的数据同博客的数据合并起来(添加访问数、点评数、点赞数)
        wxApi.getPostStatistics(that.data.post_ids).then(res => {
          for (var post of contentdata) {
            for (var item of res.result) {
              if (item.post_id === post.id) {
                post['view_count'] = item.view_count;//访问数
                post['comment_count'] = item.comment_count;//点评数
                post['like_count'] = item.like_count;//点赞数
              }
            }
          }
          that.setData({
            post_data: that.data.post_data.concat(res.result),
            mokedata: that.data.mokedata.concat(contentdata)
          })
          app.globalData.amokedata = app.globalData.amokedata.concat(contentdata)
          })
        }else{
          that.setData({
            errorswitch:'',
          })
        }
      },
      fail:function(){
        that.setData({
          errorswitch: '',
        })
      },
      complete:function(){
        that.setData({
          closeload: 'closeload'
        })
        wx.hideNavigationBarLoading()
      }
    })
  },
  collect: function () {
    var that = this
    if (that.data.highplay) {
      high.play()
      that.setData({
        highplay: false,
      })
    } else {
      high.stop()
      that.setData({
        highplay: true,
      })
    }
  }
})
