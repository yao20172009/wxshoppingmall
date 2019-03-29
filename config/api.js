// 业务服务器API地址
var WxApiRoot = 'https://api.jiejie.io/wxserver/';
var WxUpImages = 'https://api.jiejie.io/wxserver/upload_images';
var WxGqlApiUrl = 'https://api.jiejie.io/wx_graphql?token='
var WxUnauth = 'https://api.jiejie.io/wx_unauth?token='

module.exports = {
	EventList: WxApiRoot + 'promotions',
	EventDetail: WxApiRoot + 'promotions/',
	JoinActive: WxApiRoot + 'flow',
	WxGqlApiUrl,
  WxUnauth,
  WxUpImages,
}