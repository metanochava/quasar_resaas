// Thin loader for the Google Maps JavaScript API (Maps + Places) -
// loaded on demand, once, only when GOOGLE_MAPS_API_KEY is configured
// on the host app (quasar.config.js's `env` block). Nothing in this
// project depends on an npm Maps SDK; this mirrors how Google itself
// recommends loading the JS API (a single <script> tag), just wrapped
// in a promise so multiple components can safely await it in
// parallel without racing to inject the script twice.

let loaderPromise = null

export function hasGoogleMapsKey() {
  return !!process.env.GOOGLE_MAPS_API_KEY
}

export function loadGoogleMaps() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return Promise.reject(new Error('GOOGLE_MAPS_API_KEY is not configured.'))
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google)
  }

  if (loaderPromise) {
    return loaderPromise
  }

  loaderPromise = new Promise((resolve, reject) => {
    const callbackName = '__resaasGoogleMapsReady'

    window[callbackName] = () => {
      delete window[callbackName]
      resolve(window.google)
    }

    const script = document.createElement('script')
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      loaderPromise = null
      reject(new Error('Failed to load the Google Maps script.'))
    }

    document.head.appendChild(script)
  })

  return loaderPromise
}
