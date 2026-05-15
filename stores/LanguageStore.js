import { createBaseStore } from './../base/base_store'
import { HTTPAuth, HTTPClient, url } from './../boot/api'

export const useLanguageStore = createBaseStore(
  "lang", 
  {
    app: 'django_resaas',
    model: 'Language'
  },
  {
  state: () => ({
    current: {} ,
    rows: [],
    TraducaoMap: {}
  }),

  actions: {
    change(lang) {
      this.current = lang
      this.setTraducao(this.current)
    },
    async setTraducao(language) {
      if (!language?.id) return {}
      try {
        // Reset map
        this.TraducaoMap = {}

        const res = await HTTPClient.get(
          url({
            type: "u",
            url: `django_resaas/languages/${language?.id}/translations`,
            params: {}
          })
        )

        const payload = res.data

        // Função para achatar qualquer JSON
        const flattenTranslations = (obj, map = {}) => {
          for (const key in obj) {
            const value = obj[key]

            if (value && typeof value === "object" && !Array.isArray(value)) {
              flattenTranslations(value, map)
            } else {
              const normalizada = String(key).toLowerCase().trim()
              map[normalizada] = value
            }
          }
          return map
        }

        this.TraducaoMap = flattenTranslations(payload)

      } catch (err) {

      }
    },

    async get() {
      await HTTPClient.get(url({type: "u", url: "django_resaas/languages", params: {}}) )
      .then(res => {
        this.rows = res.data.results || res.data
        this.current = this.rows[0]
      }).catch(err => {
      })
    }
  },
})