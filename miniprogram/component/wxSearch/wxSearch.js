import { getStorage, setStorage,setData } from '../../utils/util';
const app = getApp()
// component/wxSearch.js
module.exports={
  init(that) {
    this._setData(that,{
      'searchList':getStorage('searchList') || []
    })
  },
  bindShowLog(e,that) {
    this.showlog(that)
  },
  bindHideLog(e, that) {
    this._setData(that, {
      'searchIsHidden': true
    })
  },
  bindInputSchool(e, that) {
    var val = e.detail.value;
    this.matchStroage(that,val)
  },
  bindSearchAllShow(e,that){
    this._setData(that,{
      searchAllShow: true
    })
  },
  bindGoSearch(e,that){
    let searchList_stroage = getStorage('searchList') || [];
    const inputVal = that.data.tabData.inputVal;
    searchList_stroage.push(inputVal)

    setStorage('searchList', searchList_stroage)
    this._setData(that, {
      inputVal: ''
    })
    this.goSchool(inputVal)
  },
  bindDelLog(e, that) {
    let val = e.currentTarget.dataset.item;
    let searchList_stroage = getStorage('searchList') || [];
    let index = searchList_stroage.indexOf(val);
    searchList_stroage.splice(index, 1)
    this.updataLog(that,searchList_stroage)
  },
  bindSearchHidden(that) {
    this._setData(that,{
      searchIsHidden: true
    })
  },
  showlog(that){
    let searchList_stroage = getStorage('searchList') || [];
    let searchList = []
    if (typeof (searchList_stroage) != undefined && searchList_stroage.length > 0) {
      for (var i = 0, len = searchList_stroage.length; i < len; i++) {
          searchList.push(searchList_stroage[i])
      }
    }else {
      searchList = searchList_stroage
    }
    this._setData(that, {
      searchIsHidden: false,
      searchAllShow:false,
      searchList
    })
  },
  matchStroage(that,val) {
    let searchList_stroage = getStorage('searchList') || [];
    let searchList = []
    if (typeof (val) != undefined && val.length > 0 && typeof (searchList_stroage) != undefined && searchList_stroage.length > 0) {
      for (var i = 0, len = searchList_stroage.length; i < len; i++) {
        if (searchList_stroage[i].indexOf(val) != -1) {
          searchList.push(searchList_stroage[i])
        }
      }
    } else {
      searchList = searchList_stroage
    }
    this._setData(that, {
      inputVal: val,
      searchList
    })
  },
  _setData(that, param){
    let tabData = that.data.tabData;
    for (var key in param){
      tabData[key] = param[key];
    }
    that.setData({
      tabData
    })
  },
  updataLog(that, list){
    setStorage('searchList', list)
    this._setData(that,{
      searchList: list
    })
  },
  goSchool(val) {
    var list = app.globalData.amokedata;
    var len = list.length;
    var arr = [];
    for (var i = 0; i < len; i++) {
      //如果字符串中不包含目标字符会返回-1
      if (list[i].title.rendered.indexOf(val) >= 0) {
        arr.push(list[i]);
      }
    }
    if (arr==false){
      wx.showToast({
        title: '未找到相关文章',
        icon: 'none',
        duration: 2000
      })
    }else{
      var url = '../../pages/single/single?id=' + arr[0].id;
      wx.navigateTo({
        url: url
      })
    }
    
  }
}