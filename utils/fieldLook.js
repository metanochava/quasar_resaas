// How every form field looks (s-input, s-select, s-date, s-time,
// s-date-time; s-checkbox / s-toggle take the same row height): the
// component's own attribute first, else the backend's LayoutSetting
// (User.ps.layout: field_style, dense) - so all fields of the app follow one
// setting. The hint / error line below a field is always reserved, so fields
// side by side on a row line up and nothing jumps when an error shows.
export const FIELD_STYLES = ['outlined', 'filled', 'standout', 'borderless']

const given = (attrs, name) => attrs[name] !== undefined && attrs[name] !== false

export function fieldLook (attrs = {}, layout = {}) {
  const own = FIELD_STYLES.find(style => given(attrs, style))
  const style = own || (FIELD_STYLES.includes(layout?.field_style) ? layout.field_style : 'outlined')
  const look = { dense: attrs.dense ?? Boolean(layout?.dense) }
  for (const name of FIELD_STYLES) look[name] = name === style
  // standout may carry its classes ("bg-primary text-white")
  if (own && attrs[own] !== '' && attrs[own] !== true) look[own] = attrs[own]
  const hideBottom = given(attrs, 'hide-bottom-space') || given(attrs, 'hideBottomSpace')
  look.bottomSlots = !hideBottom
  return look
}
