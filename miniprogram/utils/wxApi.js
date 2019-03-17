const db = wx.cloud.database()
const _ = db.command

function wxPromisify(fn) {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.success = function (res) {
        //成功
        resolve(res)
      }
      obj.fail = function (res) {
        //失败
        reject(res)
      }
      fn(obj)
    })
  }
}

//无论promise对象最后状态如何都会执行
Promise.prototype.finally = function (callback) {
  let P = this.constructor;
  return this.then(
    value => P.resolve(callback()).then(() => value),
    reason => P.resolve(callback()).then(() => { throw reason })
  );
};

/**
 * 获取文章统计数据
 */
function getPostStatistics(post_ids) {
  var callcloudFunction = wxPromisify(wx.cloud.callFunction)
  return callcloudFunction({
    name: 'get_posts_statistics',
    data: {
      post_ids: post_ids
    }
  })
}

/**
 * 修改统计数量
 */
function upsertPostsStatistics(data) {
  var callcloudFunction = wxPromisify(wx.cloud.callFunction)
  return callcloudFunction({
    name: 'upsert_posts_statistics',
    data: {
      post_id: data[0],
      view_count: data[1],
      comment_count: data[2],
      like_count: data[3]
    }
  })
}

/**
 * 新增评论
 */
function insertPostsCommonts(data){
  return db.collection('posts_comments').add({
    data: data
  })
}

/**
 * 新增子评论
 */
function pushChildrenCommonts(id,data){
  var callcloudFunction = wxPromisify(wx.cloud.callFunction)
  return callcloudFunction({
    name: 'push_child_comments',
    data: {
      id: id,
      comments: data
    }
  })
}

/**
 * 获取评论
 */
function getPostsCommonts(postId,page){
  console.log(postId)
  console.log(page)
  return db.collection('posts_comments')
    .where({postId: postId})
    .orderBy('timestamp', 'desc')
    .skip((page - 1) * 10)
    .limit(10)
    .get()
}
/**
 * 删除评论（管理权限）
 */
function delPostsCommonts(Id) {
  var callcloudFunction = wxPromisify(wx.cloud.callFunction)
  return callcloudFunction({
    name: 'del_posts_comment',
    data: {
      Id: Id
    }
  })
}
/**
 * 获取onedata
 */
function getonedata(title) {
  var callcloudFunction = wxPromisify(wx.cloud.callFunction)
  return callcloudFunction({
    name: 'get_onedata',
    data: {
      title: title
    }
  })
}
/**
 * 新增评论
 */
function insertonedata(data) {
  return db.collection('onedata').add({
    data: data
  })
}
/**
 * 获取图片文件
 */
function getImageInfo(data) {
  var getImageInfoFunction = wxPromisify(wx.getImageInfo)
  return getImageInfoFunction({
    src: data
  })
}

/**
 * 获取云存储文件
 */
function getCloudFile(data) {
  return wx.cloud.downloadFile({
    fileID: data
  })
}
module.exports = {
  getPostStatistics: getPostStatistics,
  upsertPostsStatistics: upsertPostsStatistics,
  insertPostsCommonts: insertPostsCommonts,
  getPostsCommonts: getPostsCommonts,
  delPostsCommonts: delPostsCommonts,
  pushChildrenCommonts: pushChildrenCommonts,
  getonedata: getonedata,
  insertonedata: insertonedata,
  getImageInfo: getImageInfo,
  getCloudFile: getCloudFile
}