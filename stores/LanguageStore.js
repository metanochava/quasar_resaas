import { createBaseStore } from './../base/base_store'
import { HTTPAuth, url } from './../boot/api'
import { defineStore } from 'pinia'

export const useLanguageStore = defineStore("lang", {
  state: () => ({
    current: {} ,
    list: [],
    TraducaoMap: {}
  }),

  actions: {
    change(lang) {
      this.current = lang
      const User =useUserStore()
      User.setIdioma(this.current)
      this.setTraducao(this.current)
    },
    async setTraducao(idioma) {
      try {
        // Reset map
        this.TraducaoMap = {}


        const res = await HTTPClient.get(
          url({
            type: "u",
            url: `api/django_resaas/idiomas/${idioma?.id}/traducaos`,
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
      await HTTPClient.get(url({type: "u", url: "api/django_resaas/idiomas", params: {}}) )
      .then(res => {
        this.list = res.data
        this.current = this.list[0]
        const User =useUserStore()
        User.setIdioma(this.current)
      }).catch(err => {
      })
    }
  },
})