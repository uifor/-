const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
exports.main = async (event, context) => {
  try {
    return await db.collection('posts_comments').where({
      _id:event.Id
    }).remove()
  } catch (e) {
    console.error(e)
  }
}