



// a top-level menu entry that is a direct link (sidebar "ROUTE" + "ROLE",
// see django_resaas UserAPIView.menus): it opens its route, no submenu
export function isMenuLink(item) {
  return !!item?.route && !(item.submenu?.length)
}

export function resolveRoute(item, add) {
  if (!item) return null

  if (item.crud) {
    return {
      name: 'crud_route',
      params: item.crud || {},
    }
  }
  if(add==0){
    if (item.route) {
      return {
        name: item.route,
      }
    }
  }
  if(add==1){

    if (item.add_route) {
      return {
        name: item.add_route,
      }
    }
  }

  return null
}

