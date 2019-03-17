const app = getApp()
const wxApi = require('../../utils/wxApi.js');
const util = require('../../utils/util.js');
let isFocusing = false;
const ios = wx.createInnerAudioContext()
ios.src = 'cloud://uifor-aad5cd.7569-uifor-aad5cd/music/ios.mp3'
Page({
  data: {
    messagebtn:'messagebtn',
    closeload: 'closeload',
    post_ids: [],
    articleid:"",//文章ID
    articledata:[],
    userInfo: {},
    showdata:false,
    isShow: false,//控制menubox是否显示
    isLoad: true,//解决menubox执行一次  
    //评论列表
    comments: [],
    commentsPage: 1,
    commentContent: "",
    isLastCommentPage: false,
    placeholder: "吐个槽呗",
    focus: false,
    toName: "",
    toOpenId: "",
    commentId: "",
    menuBackgroup: false,
    loading: false,
    nodata: false,
    nomore: false,
    nodata_str: "暂无评论，赶紧抢沙发吧",
    showPopup: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    //喜欢和收藏
    collected: false,
    liked: false,
    showPosterPopup: false,
    showPosterImage: ""
  },
  onLoad: function (options) {
    this.setData({
      articleid: options.id,
    })
    let that = this;
    // 1.授权验证
    app.checkUserInfo(function (userInfo, isLogin) {
      if (!isLogin) {
        that.setData({
          showPopup: true
        })
        return;
      }
    })
    //检查数据是否存在
    that.checkdata();
    // 2.更新浏览量+1
    wxApi.upsertPostsStatistics([Number(that.data.articleid), 1, 0, 0]).then(res => { })
    //3.初始化喜欢状态
    that.getPostsLiked(options.id);
    //4.收藏状态初始化
    that.getPostsCollected(options.id);
  },
  onShow: function (){
  
  },
  /* 底部触发加载评论
   */
  onReachBottom: function () {
    var that = this;
    if (that.data.isLastCommentPage) {
      return;
    }
    that.setData({
      loading: true
    })
    wxApi.getPostsCommonts(that.data.articleid, that.data.commentsPage).then(res => {
      if (res.data.length > 0) {
        that.setData({
          comments: that.data.comments.concat(res.data),
          commentsPage: that.data.commentsPage + 1,
          loading: false
        })
      } else {
        if (that.data.commentsPage === 1) {
          that.setData({
            isLastCommentPage: true,
            nodata: true,
            loading: false
          })
        } else {
          that.setData({
            isLastCommentPage: true,
            nomore: true,
            loading: false
          })
        }
      }
    })
  },
  //分享文章页面
  onShareAppMessage: function () {
    return {
      title: this.data.articledata[0].title.rendered,
      path: 'pages/single/single?id='+ this.data.articleid,
      imageUrl: this.data.articledata[0].image,
      success(e){
        wx.showShareMenu({
          withShareTicket:true
        });
      },
      fail(e){
        console.log('转发失败')
      }
    }
  },
  //设置文章内页标题
  // settitle: function () {
  //   wx.setNavigationBarTitle({
  //     title: this.data.articledata[0].title.rendered
  //   })
  // }
  // ,
  //判断数据是否存在
  checkdata:function(){
    var that=this;
    if(!app.globalData.amokedata.length){
      wx.showNavigationBarLoading();
      that.setData({
        closeload: ''
      })
      wx.request({
        url: 'https://amoke.top/wp-json/wp/v2/posts/'+that.data.articleid,
        header: {
          'content-type': 'application/json' // 默认值
        },
        success: function (res) {
          var post = res.data;
          that.data.post_ids = that.data.post_ids.concat(post.id);
          //js部分-展示统计数据时
          wxApi.getPostStatistics(that.data.post_ids).then(res => {
          var item = res.result[0];
          var data = that.data.articledata;
          post['view_count'] = item.view_count;//访问数
          post['comment_count'] = item.comment_count;//点评数
          post['like_count'] = item.like_count;//点赞数
          data.push(post);
          that.setData({
            articledata: data,
            showdata:true
          })
          //最近浏览
          that.operatePostsRecent(that.data.articledata[0]);
          })
        },
        complete: function () {
          that.setData({
            closeload: 'closeload'
          })
          wx.hideNavigationBarLoading()
        }
      })
    }else{
      var contentdata = app.globalData.amokedata;
      for (var post of contentdata) {
        //循环查找文章id的数据
        if (post.id == that.data.articleid) {
          that.setData({
            articledata: that.data.articledata.concat(post),//将数据单独保存出来
            showdata: true
          })
          break;
        }
      }
      //最近浏览
      that.operatePostsRecent(that.data.articledata[0])
    } 
  },
  //海报
  posters:function(){
    var that = this
    that.openmenu()
    var defaultImageUrl = ""
    var qrcodeUrl = ""
    if (that.data.showPosterImage === "") {
      wx.showLoading({
        title: "正在生成海报",
        mask: true,
      });
      //获取文章banner图片
      wxApi.getImageInfo(that.data.articledata[0].image)
        .then(res => {
          defaultImageUrl = res.path
          var imgurl = 'cloud://uifor-aad5cd.7569-uifor-aad5cd/qrcode/' + 'qrcode-' + that.data.articledata[0].id + '.png'
          return wxApi.getCloudFile(imgurl)//获取云存储的小程序码
        }).then(res => {
          qrcodeUrl = res.tempFilePath
          that.createPosterWithCanvas(defaultImageUrl, qrcodeUrl, that.data.articledata[0].title.rendered)
        }).catch(res=>{
          //云存储不存在小程序码，下面向服务器请求对应文章的小程序码
          wx.request({
            url: 'https://amoke.top/api/qrcode?id=' + that.data.articledata[0].id,
            header: {
              'content-type': 'application/json' // 默认值
            },
            success(res) {
              //下载服务器上的小程序码
              wxApi.getImageInfo(res.data.imgurl).then(res => {
                var qrcodeimgUrl = res.path
                that.createPosterWithCanvas(defaultImageUrl, qrcodeimgUrl, that.data.articledata[0].title.rendered)
                var imgname = 'qrcode-' + that.data.articledata[0].id + '.png'
                //将小程序码上传到云存储中
                wx.cloud.uploadFile({
                  cloudPath: 'qrcode/' + imgname,
                  filePath: qrcodeimgUrl, // 小程序临时文件路径
                  success: res => {
                    // get resource ID
                    console.log(res.fileID)
                  },
                  fail: err => {
                    // handle error
                    console.log(err)
                  }
                })
              })
            }
          })
        })
    } else {
      that.setData({
        showPosterPopup: true
      })
    }
  },
  //赞赏
  appreciates: function () {
    wx.showModal({
      content: '程序员有点懒，该功能还未开发',
      showCancel: false
    })
  },
  /**
  *  喜欢按钮操作
  */
  clickLike: function (e) {
    let that = this
    var postsLiked = wx.getStorageSync('posts_Liked');
    var postLiked = postsLiked[that.data.articleid];
    postLiked = !postLiked;
    postsLiked[that.data.articleid] = postLiked;
    wx.setStorageSync('posts_Liked', postsLiked);
    wx.showToast({
      title: postLiked ? '已喜欢' : '已取消喜欢',
      icon: "none"
    })
    that.setData({
      liked: postLiked
    })
    if (postLiked) {
      wxApi.upsertPostsStatistics([Number(that.data.articleid), 0, 0, 1]).then(res => { })
    }
  },
  /**
 * 获取文章喜欢状态
 */
  getPostsLiked: function (blogId) {
    let that = this;
    var postsLiked = wx.getStorageSync('posts_Liked');
    if (postsLiked) {
      var isLiked = postsLiked[blogId] == undefined ? false : postsLiked[blogId];
      that.setData({
        liked: isLiked
      })
    } else {
      var postsLiked = {}
      postsLiked[blogId] = false;
      wx.setStorageSync('posts_Liked', postsLiked);
    }
  },
  /**
 * 获取文章收藏状态
 */
  getPostsCollected: function (blogId) {
    let that = this;
    var postsCollected = wx.getStorageSync('posts_Collected');
    if (postsCollected) {
      var isCollected = postsCollected[blogId] == undefined ? false : postsCollected[blogId];
      that.setData({
        collected: isCollected
      })
    } else {
      var postsCollected = {}
      postsCollected[blogId] = false;
      wx.setStorageSync('posts_Collected', postsCollected);
    }
  },
  /**
   * 收藏
   */
  collection: function (e) {
    let that = this;
    var postsCollected = wx.getStorageSync('posts_Collected');
    var postCollected = postsCollected[that.data.articleid];
    postCollected = !postCollected;
    postsCollected[that.data.articleid] = postCollected;
    wx.setStorageSync('posts_Collected', postsCollected);
    wx.showToast({
      title: postCollected ? '已收藏' : '已取消收藏',
      icon: "none"
    })
    that.setData({
      collected: postCollected
    })
    //收藏明细
    var postsRecent = wx.getStorageSync('posts_CollectedDetail');
    var content = {};
    content['title'] = that.data.articledata[0].title.rendered;
    content['time'] = util.formatTime(new Date());
    if (postsRecent) {
      if (postCollected) {
        postsRecent[that.data.articleid] = content;
        if (Object.getOwnPropertyNames(postsRecent).length > 30) {
          for (var item in postsRecent) {
            delete postsRecent[item];
            break
          }
        }
      } else {
        delete postsRecent[that.data.articleid];
      }
      wx.setStorageSync('posts_CollectedDetail', postsRecent);
    } else {
      postsRecent = {};
      postsRecent[that.data.articleid] = content;
      wx.setStorageSync('posts_CollectedDetail', postsRecent);
    }
  },
  navigateBack: function (e) {
    wx.switchTab({
      url: '../index/index'
    })
  },
  /**
  * 处理最近浏览
  */
  operatePostsRecent: function (post) {
    var postsRecent = wx.getStorageSync('posts_Recent');
    var content = {};
    content['title'] = this.data.articledata[0].title.rendered;
    content['time'] = util.formatTime(new Date());
    if (postsRecent) {
      postsRecent[post.id] = content;
      if (Object.getOwnPropertyNames(postsRecent).length > 30) {
        for (var item in postsRecent) {
          delete postsRecent[item];
          break
        }
      }
      wx.setStorageSync('posts_Recent', postsRecent);
    } else {
      postsRecent = {};
      postsRecent[post.id] = content;
      wx.setStorageSync('posts_Recent', postsRecent);
    }
  },
  //文章评论的加号菜单开关
  openmenu:function(){
    this.setData({
      isShow: !this.data.isShow,
      isLoad: false
    })
  },
  openmenu_1:function() {
    this.setData({
      isShow: false
    })
  },
  bindGetUserInfo: function (e) {
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
  /**
   * 发送按钮提交
   */
  formSubmit: function (e) {
    var that = this
    var comment = e.detail.value.inputComment;
    if (comment.length === 0) {
      //提示
      return
    }
    var commentId = that.data.commentId
    var toName = that.data.toName
    var toOpenId = that.data.toOpenId
    if (commentId === "") {
      var data = {
        postId: that.data.articleid,
        cNickName: app.globalData.userInfo.nickName,
        cAvatarUrl: app.globalData.userInfo.avatarUrl,
        timestamp: new Date().getTime(),
        createDate: util.formatTime(new Date()),
        comment: comment,
        childComment: [],
        flag: 0
      }
      wxApi.insertPostsCommonts(data).then(res => {
        ios.play()
        wx.showToast({
          title: "评论已提交",
          icon: "none"
        })
        return wxApi.upsertPostsStatistics([Number(that.data.articleid), 0, 1, 0])
      }).then(res => {
        var post = that.data.articledata
        post[0].comment_count = post[0].comment_count + 1;
        that.setData({
          comments: [],
          commentsPage: 1,
          isLastCommentPage: false,
          toName: "",
          commentId: "",
          placeholder: "吐个槽呗",
          commentContent: "",
          articledata: post,
          loading: true,
          nodata: false,
          nomore: false
        })
        return wxApi.getPostsCommonts(that.data.articleid, that.data.commentsPage)
      }).then(res => {
        if (res.data.length > 0) {
          that.setData({
            comments: that.data.comments.concat(res.data),
            commentsPage: that.data.commentsPage + 1,
            loading: false
          })
        } else {
          that.setData({
            isLastCommentPage: true,
            nomore: true,
            loading: false
          })
        }
      })
    } else {
      var childData = [{
        cOpenId: app.globalData.openid,
        cNickName: app.globalData.userInfo.nickName,
        cAvatarUrl: app.globalData.userInfo.avatarUrl,
        timestamp: new Date().getTime(),//new Date(),
        createDate: util.formatTime(new Date()),
        comment: comment,
        tNickName: toName,
        tOpenId: toOpenId,
        flag: 0
      }]
      wxApi.pushChildrenCommonts(commentId, childData).then(res => {
        ios.play()
        wx.showToast({
          title: "评论已提交",
          icon: "none"
        })
        return wxApi.upsertPostsStatistics([Number(that.data.articleid), 0, 1, 0])
      }).then(res => {
        var post = that.data.articledata
        post[0].comment_count = post[0].comment_count + 1;
        that.setData({
          comments: [],
          commentsPage: 1,
          isLastCommentPage: false,
          toName: "",
          commentId: "",
          placeholder: "吐个槽呗",
          commentContent: "",
          articledata: post,
          loading: true,
          nodata: false,
          nomore: false
        })
        return wxApi.getPostsCommonts(that.data.articleid, that.data.commentsPage)
      }).then(res => {
        if (res.data.length > 0) {
          that.setData({
            comments: that.data.comments.concat(res.data),
            commentsPage: that.data.commentsPage + 1,
            loading: false
          })
        } else {
          that.setData({
            isLastCommentPage: true,
            nomore: true,
            loading: false
          })
        }
      })
    }
  },
  /**
  * 点击评论内容回复
  */
  focusComment: function (e) {
    wx.showToast({
      title: '就等你回复呢',
      icon: 'none'
    })
    var that = this;
    var name = e.currentTarget.dataset.name;
    var commentId = e.currentTarget.dataset.id;
    var openId = e.currentTarget.dataset.openid;
    isFocusing = true;
    that.setData({
      commentId: commentId,
      placeholder: "回复" + name + ":",
      focus: true,
      toName: name,
      toOpenId: openId
    });
  },
  /**
* 点击评论内容删除
*/
  delComment: function (e) {
    var that = this;
    var name = e.currentTarget.dataset.name;
    var commentId = e.currentTarget.dataset.id;
    var openid=app.globalData.openid;
    if (openid =='oaa-l5K5djxSoCe3ART50Ap9o6R8'){
      wx.showModal({
        title:'评论管理',
        content:'删除'+name+'的评论？',
        success:function(res){
          if (res.confirm){
            wxApi.delPostsCommonts(commentId).then(res => {
              return wxApi.upsertPostsStatistics([Number(that.data.articleid), 0, -1, 0])
            }).then(res => {
              var post = that.data.articledata
              post[0].comment_count = post[0].comment_count - 1;
              that.setData({
                comments: [],
                commentsPage: 1,
                isLastCommentPage: false,
                toName: "",
                commentId: "",
                placeholder: "吐个槽呗",
                commentContent: "",
                articledata: post,
                loading: true,
                nodata: false,
                nomore: false
              })
              return wxApi.getPostsCommonts(that.data.articleid, that.data.commentsPage)
              }).then(res => {
                if (res.data.length > 0) {
                  that.setData({
                    comments: that.data.comments.concat(res.data),
                    commentsPage: that.data.commentsPage + 1,
                    loading: false
                  })
                } else {
                  that.setData({
                    isLastCommentPage: true,
                    nodata: true,
                    loading: false
                  })
                }
              })
          }else if(res.cancel){
          }
        }
      })
    }else{
      wx.showToast({
        title:'哎呦嘿，权限不足',
        icon:'none'
      })
    }
  },
  /**
   * 聚焦时触发
   */
  onRepleyFocus: function (e) {
    var self = this;
    isFocusing = false;
    self.setData({
      messagebtn:'messagebtnout'
    })
    if (!self.data.focus) {
      self.setData({
        focus: true
      })
    }
  },
  /**
   * 失去焦点时默认给文章评论
   */
  onReplyBlur: function (e) {
    var self = this;
    self.setData({
      messagebtn: 'messagebtn'
    })
    if (!isFocusing) {
      {
        const text = e.detail.value.trim();
        if (text === '') {
          self.setData({
            commentId: "",
            placeholder: "吐个槽呗",
            toName: "",
          });
        }

      }
    }
  },
  /**
 * 利用画布生成海报
 */
  createPosterWithCanvas: function (postImageLocal, qrcodeLoal, title) {
    var that = this;
    var context = wx.createCanvasContext('mycanvas');
    context.setFillStyle('#ffffff');
    context.fillRect(0, 0, 600, 800);
    context.drawImage(postImageLocal, 0, 0, 600, 300); //绘制首图
    context.drawImage(qrcodeLoal, 210, 480, 180, 180); //绘制二维码
    context.setFillStyle("#000000");
    context.setFontSize(20);
    context.setTextAlign('center');
    context.fillText("阅读文章,请长按识别二维码", 300, 725);
    context.setFillStyle("#000000");
    context.beginPath() //分割线
    context.moveTo(30, 450)
    context.lineTo(570, 450)
    context.stroke();
    context.setTextAlign('left');
    context.setFontSize(28);
    context.fillText(title, 40, 360);
    context.draw();

    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'mycanvas',
        success: function (res) {
          var tempFilePath = res.tempFilePath;
          wx.hideLoading();
          console.log("海报图片路径：" + res.tempFilePath);
          that.setData({
            showPosterPopup: true,
            showPosterImage: res.tempFilePath
          })
        },
        fail: function (res) {
          console.log(res);
        }
      });
    }, 900);
  },

  /**
   * 取消保存海报图片
   */
  cacenlPosterImage: function () {
    this.setData({
      showPosterPopup: false
    })
  },
  /**
   * 保存海报图片
   */
  savePosterImage: function () {
    let that = this
    wx.saveImageToPhotosAlbum({
      filePath: that.data.showPosterImage,
      success(result) {
        console.log(result)
        wx.showModal({
          title: '提示',
          content: '二维码海报已存入手机相册，赶快分享到朋友圈吧',
          showCancel: false,
          success: function (res) {
            that.setData({
              showPosterPopup: false
            })
          }
        })
      },
      fail: function (err) {
        console.log(err);
        if (err.errMsg === "saveImageToPhotosAlbum:fail auth deny") {
          console.log("再次发起授权");
          wx.showModal({
            title: '用户未授权',
            content: '如需保存海报图片到相册，需获取授权.是否在授权管理中选中“保存到相册”?',
            showCancel: true,
            success: function (res) {
              if (res.confirm) {
                console.log('用户点击确定')
                wx.openSetting({
                  success: function success(res) {
                    console.log('打开设置', res.authSetting);
                    wx.openSetting({
                      success(settingdata) {
                        console.log(settingdata)
                        if (settingdata.authSetting['scope.writePhotosAlbum']) {
                          console.log('获取保存到相册权限成功');
                        } else {
                          console.log('获取保存到相册权限失败');
                        }
                      }
                    })

                  }
                });
              }
            }
          })
        }
      }
    });
  },
  posterImageClick: function (e) {
    wx.previewImage({
      urls: [this.data.showPosterImage],
    });
  }
})