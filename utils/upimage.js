// 上传文件
function upload_file_server(url, that, upload_picture_list, j) {
  // console.log(url, that, upload_picture_list, j)
  const upload_task = wx.uploadFile({
    url,
    filePath: upload_picture_list[j]['path'],
    name: 'files',
    formData: {
      'num': j
    },
    success(res) {
      // console.log(res)
      let data = JSON.parse(res.data);
      // console.log(data)
      let filename = data[0].imageUrl
      let filekey = data[0].key
      upload_picture_list[j]['path_server'] = filename
      upload_picture_list[j]['path_key'] = filekey
      // console.log(upload_picture_list)
      that.setData({
        upload_picture_list: upload_picture_list
      });
    }
  })

  upload_task.onProgressUpdate((res) => {
    upload_picture_list[j]['upload_percent'] = res.progress
    that.setData({
      upload_picture_list: upload_picture_list
    });
  });
}


// 上传图片(this,api.imageup)
function uImage(_that, url) {
  for (let j in _that.data.upload_picture_list) {
    if (_that.data.upload_picture_list[j]['upload_percent'] == 0) {
      upload_file_server(url, _that, _that.data.upload_picture_list, j)
    }
  }
}


// 删除图片
function dImage(e, _that) {
  _that.data.upload_picture_list.splice(e.currentTarget.dataset.index, 1);
  _that.setData({
    upload_picture_list: _that.data.upload_picture_list
  });
}


// 选择图片
function cImage(_that, count,url) {
  wx.chooseImage({
    count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: function (res) {
      _that.data.imgs = res.tempFilePaths;
      for (let i in res.tempFiles) {
        res.tempFiles[i]['upload_percent'] = 0
        res.tempFiles[i]['path_server'] = ''
        _that.data.upload_picture_list.push(res.tempFiles[i])
      }
      _that.setData({
        upload_picture_list: _that.data.upload_picture_list,
      });
      uImage(_that, url)
    }
  })
}

// 预览图片
function pImage(e, _that) {
  wx.previewImage({
    current: _that.data.imgs[e.currentTarget.dataset.index],
    urls: _that.data.imgs
  })
}

// 修改预览前图片
function lookImage(_that,imgs) {
  _that.data.imgs = imgs
}


module.exports = {
  upload_file_server,
  uImage,
  dImage,
  cImage,
  pImage,
  lookImage
}