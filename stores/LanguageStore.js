import { createBaseStore } from './../base/base_store'
import { HTTPAuth, HTTPClient, url } from '../services/api'
import { useUserStore } from './UserStore'
import { setStorage, deleteStorage } from '../services/storage'

// the language this browser picked explicitly (see choose)
export const CHOSEN_KEY = 'userLangChosen'

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
      const User = useUserStore()
      this.current = lang
      // also the stored language that sets the L header of every request
      User.setLanguage(lang)
      this.setTraducao(this.current)
    },

    // The user picked a language (header menu, Account Center): apply it now
    // and, when signed in, save it as their own (PATCH users/{id}/ language).
    // null = no personal language: back to the Entity's, then the
    // EntityType's default - the backend resolves it and me() applies it.
    async choose(lang) {
      const User = useUserStore()
      if (lang) this.change(lang)
      // this browser's explicit pick, which wins before signing in
      // (AuthLayout.applyLanguage); userLang only mirrors the current one
      if (lang) setStorage('l', CHOSEN_KEY, JSON.stringify(lang))
      else deleteStorage('l', CHOSEN_KEY)
      if (!User.data?.id) return
      await User.updateProfile({ language: lang ? lang.id : null })
      await User.me()
    },
    async setTraducao(language) {
      if (!language?.id) return {}
      try {
        // Reset map
        this.TraducaoMap = {}

        const res = await HTTPClient.get(
          url({
            type: "u",
            url: `django_resaas/languages/${language?.id}/translations/`,
            params: {}
          })
        )

        const payload = res.data

        // Function to flatten any JSON
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
      await HTTPClient.get(url({type: "u", url: "django_resaas/languages/", params: {}}) )
      .then(res => {
        // only the list: which language is current is decided by
        // UserStore.me() (signed in), AuthLayout.applyLanguage() (before
        // signing in) or the user's pick (choose) - never "the first row",
        // which skipped loading its translations
        this.rows = res.data.results || res.data
      }).catch(err => {
      })
    }
  },
})