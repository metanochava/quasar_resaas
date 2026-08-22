


function base64url (source) {
  const CryptoJS = require('crypto-js')
  // Encode in classical base64
  let encodedSource = CryptoJS.enc.Base64.stringify(source)

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '')

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-')
  encodedSource = encodedSource.replace(/\//g, '_')

  return encodedSource
}



export const createToken = (data, secret = 'se') => {
  // const base64url = require('base64url');
  const CryptoJS = require('crypto-js')
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header))
  const encodedHeader = base64url(stringifiedHeader)

  const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data))
  const encodedData = base64url(stringifiedData)

  const token = encodedHeader + '.' + encodedData

  let signature = CryptoJS.HmacSHA256(token, secret)
  signature = base64url(signature)

  const signedToken = token + '.' + signature

  return signedToken
}

