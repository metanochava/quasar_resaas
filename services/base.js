






export const isEntityTypeMe = function (x) {
  const ite = decrypt(localStorage.getItem(('entity_type_name')) + '')
  if (x === ite) { return true } else { return false }
}
