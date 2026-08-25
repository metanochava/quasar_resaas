
export const chavesenhacredencial = '@p0r@'

export const encrypt = (data, _secret = chavesenhacredencial) => {
  const CryptoJS = require('crypto-js')

  // Encrypt
  const ciphertext = CryptoJS.AES.encrypt(data, _secret).toString()
  return ciphertext
}

export const decrypt = (data, _secret = chavesenhacredencial) => {
  const CryptoJS = require('crypto-js')
  if (data != null && data !== 'null' && data !== '') {
    const bytes = CryptoJS.AES.decrypt(data, _secret)
    const originalText = bytes.toString(CryptoJS.enc.Utf8)
    return originalText
  }
  return null
}
export const encryptKey = (data, _secret = chavesenhacredencial) => {
  const CryptoJS = require('crypto-js')
  const ciphertext = CryptoJS.AES.encrypt(data, _secret).toString()
  return ciphertext
}

export const decryptKey = (data, _secret = chavesenhacredencial) => {
  let retorno = null
  Object.keys(localStorage).forEach(function (key) {
    if (data === decrypt(key)) {
      retorno = key
    }
  })
  return retorno
}