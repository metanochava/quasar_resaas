export const ds = function (dataString = '') {
  try {
    dataString = dataString.replace('T', ' ')
  } catch (error) {
  }
  let h = ''
  let d = ''
  const dataArray = dataString.split(' ')

  function data (d) {
    return d.split('-')[2] + '-' + d.split('-')[1] + '-' + d.split('-')[0]
  }
  function hora (h) {
    return h.split(':')[0] + ':' + h.split(':')[1]
  }
  if (Array.isArray(dataArray) && dataArray.length > 1) {
    d = data(dataArray[0])
    h = hora(dataArray[1])
  } else {
    d = data(dataArray[0])
  }

  const l = (h !== '') ? (d + ' às ' + h) : d
  if (l.includes('undefined')) {
    return ''
  }
  return l
}