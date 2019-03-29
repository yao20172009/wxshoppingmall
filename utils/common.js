
const formatTime = date => {
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const hour = date.getHours()
	const minute = date.getMinutes()
	const second = date.getSeconds()

	return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
	n = n.toString()
	return n[1] ? n : '0' + n
}

function obj2uri(obj) {
	return Object.keys(obj).map(function (k) {
		return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
	}).join('&');
}


//字符串转换为时间戳
function getDateTimeStamp(dateStr) {
	return Date.parse(dateStr.replace(/-/gi, "/"));
}
//格式化时间
function getDateDiff(dateStr) {
	var publishTime = getDateTimeStamp(dateStr) / 1000,
		d_seconds,
		d_minutes,
		d_hours,
		d_days,
		timeNow = parseInt(new Date().getTime() / 1000),
		d,

		date = new Date(publishTime * 1000),
		Y = date.getFullYear(),
		M = date.getMonth() + 1,
		D = date.getDate(),
		H = date.getHours(),
		m = date.getMinutes(),
		s = date.getSeconds();
	//小于10的在前面补0
	if (M < 10) {
		M = '0' + M;
	}
	if (D < 10) {
		D = '0' + D;
	}
	if (H < 10) {
		H = '0' + H;
	}
	if (m < 10) {
		m = '0' + m;
	}
	if (s < 10) {
		s = '0' + s;
	}

	d = timeNow - publishTime;
	d_days = parseInt(d / 86400);
	d_hours = parseInt(d / 3600);
	d_minutes = parseInt(d / 60);
	d_seconds = parseInt(d);

	if (d_days > 0 && d_days < 3) {
		return d_days + '天前';
	} else if (d_days <= 0 && d_hours > 0) {
		return d_hours + '小时前';
	} else if (d_hours <= 0 && d_minutes > 0) {
		return d_minutes + '分钟前';
	} else if (d_seconds < 60) {
		if (d_seconds <= 0) {
			return '刚刚';
		} else {
			return d_seconds + '秒前';
		}
	} else if (d_days >= 3 && d_days < 30) {
		return M + '-' + D + ' ' + H + ':' + m;
	} else if (d_days >= 30) {
		return Y + '-' + M + '-' + D + ' ' + H + ':' + m;
	}
}

function buttonClicked(self) {
	self.setData({
		buttonClicked: true
	})
	setTimeout(function () {
		self.setData({
			buttonClicked: false
		})
	}, 500)
}

function showToast(msg){
	wx.showToast({
		title: msg
	});
}

// 时间格式化输出，如03:25:19 86。每10ms都会调用一次
function dateFormatToCountDown(micro_second) {
	// 秒数
	var second = Math.floor(micro_second / 1000);

	var day = Math.floor(second / 3600 / 24);

	// 小时位
	var hr = fill_zero_prefix(Math.floor((second - day * 3600 * 24) / 3600));
	// 分钟位
	var min = fill_zero_prefix( Math.floor((second - day * 3600 * 24 - hr * 3600) / 60));
	// 秒位
	var sec = fill_zero_prefix(second - day * 3600 * 24 - hr * 3600 - min * 60); // equal to => var sec = second % 60;
	// 毫秒位，保留2位
	var micro_sec = fill_zero_prefix(Math.floor((micro_second % 1000) / 10));
	return day + '天' + hr + "时" + min + "分" + sec + "秒";
}

// 位数不足补零
function fill_zero_prefix(num) {
	return num < 10 ? "0" + num : num
}

module.exports = {
	formatTime,
	getDateDiff,
	buttonClicked,
	showToast,
	dateFormatToCountDown,
}