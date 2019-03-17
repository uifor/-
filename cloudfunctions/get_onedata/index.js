
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
exports.main = async (event, context) => {
  try {
    return await db.collection('onedata').where({
      title: event.title
    }).get()
  } catch (e) {
    console.error(e)
  }
}