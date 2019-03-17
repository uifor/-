// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 根据文章Id集合批量查询统计数据
exports.main = async (event, context) => {
  try {
    var result = await db.collection('posts_statistics').where({
      post_id: _.in(event.post_ids)
    }).get({
      success: function (res) {
        // res.data 是一个包含集合中有权限访问的所有记录的数据，不超过 20 条
        console.log(res.data)
      }
    })
    return result.data
  }
  catch (e) {
    console.error(e)
    return []
  }
}