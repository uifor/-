const formatTime = time => {
  var date = new Date(time);
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  return [year, month, day].map(formatNumber).join('-')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
const getStorage = (key) => {
  try {
    var v = wx.getStorageSync(key);
    return v;
  } catch (e) {
    return [];
  }
}
const setStorage = (key, cont) => {
  wx.setStorage({
    key: key,
    data: cont
  })
}
module.exports = {
  formatTime: formatTime,
  getStorage: getStorage,
  setStorage: setStorage
}
