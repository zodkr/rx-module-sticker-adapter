export default class StickerAdapter {
  constructor () {
    this.defaultURL = new URL(window.location.href).origin
  }

  _getCSRFToken () {
    return document.head.querySelector('meta[name="csrf-token"]').content
  }

  _makeRequest (data) {
    return fetch(this.defaultURL, {
      method: "POST",
      body: new URLSearchParams(data),
      credentials: "include",
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-AJAX-Compat': 'JSON',
        'X-CSRF-Token': this._getCSRFToken(),
        'X-Requested-With': 'XMLHttpRequest'
      })
    }).then(response => response.json())
    .then(response => {
      if (response.error === 0 && (response.message === 'success' || response.message === '등록했습니다.')) {
        return response
      } else {
        throw Error('알수없는 오류 발생')
      }
    })
  }

  getUserStickerSetList () {
    return this._makeRequest({
      module: 'sticker',
      act: 'getCommentStickerList',
      page: 1
    }).then(response => {
      return response.sticker.filter(item => item.sticker_srl !== null).map(item => {
        item.main_image = new URL(item.main_image, this.CDN).href
        return item
      })
    })
  }

  getStickerList (stickerSetSrl) {
    return this._makeRequest({
      module: 'sticker',
      act: 'getStickerElemList',
      sticker_srl: stickerSetSrl,
    }).then(response => {
      return response.stickerImage.map(item => {
        item.url = new URL(item.url, this.CDN).href
        return item
      })
    })
  }

  getHistory () {
    const storage = JSON.parse(window.localStorage.getItem('zod-sticker-history'))
    const history = (storage !== null) ? storage : []

    return history
  }

  // {
  //   sticker_srl: 0,
  //   sticker_file_srl: 0,
  //   name: '',
  //   url: ''
  // }
  _makeStickerInsertString (data) {
    return '{@sticker:'
      + data.sticker_srl
      + '|'
      + data.sticker_file_srl
      + '}'
  }

  makeFormData (targetForm) {
    const form = targetForm
    const data = {
      act: form.act.value,
      mid: form.mid.value,
      document_srl: form.document_srl.value
    }

    if (form.parent_srl !== undefined) {
      data.parent_srl = form.parent_srl.value
    }

    return data
  }

  submitSticker (args) {
    const insertData = {
      content: this._makeStickerInsertString(args),
      ...this.makeFormData(args.anchoredForm)
    }

    return this._makeRequest({
      _filter: 'insert_comment',
      module: 'board',
      act: 'procBoardInsertComment',
      error_return_url: '/' + window.current_url.replace(this.defaultURL, ''),
      content: insertData.content,
      mid: insertData.mid,
      document_srl: insertData.document_srl,
      parent_srl: insertData.parent_srl,
      use_html: 'N'
    }).then(response => {
      return response
    })
  }
}
