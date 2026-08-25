let pinia = null

export function setPinia(piniaInstance) {
  pinia = piniaInstance
}

export function getPinia() {
  if (!pinia) {
    throw new Error(
      '[quasar_saas] Pinia not initialized. Call setPinia(pinia) in boot.'
    )
  }
  return pinia
}
