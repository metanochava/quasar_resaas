
<template>
  <q-select
    v-bind="selectAttrs"

    v-model="localValue"

    use-input
    input-debounce="300"

    :options="optionsList"
    :loading="loading"

    :multiple="attrs.multiple"
    :use-chips="attrs.multiple"

    :label="translatedLabel"
    :placeholder="translatedPlaceholder"

    :dense="attrs.dense ?? layout.dense"

    :outlined="attrs.outlined ?? attrs.filled === undefined"
    :filled="attrs.filled"

    :class="attrs.class"

    @filter="onFilter"
    @virtual-scroll="onScroll"
  >
    <slot />
  </q-select>
</template>

<script>
import {
  defineComponent,
  computed,
  useAttrs,
  ref,
  watch,
  onMounted
} from "vue"

import { useUserStore } from "../../stores/UserStore"
import { tdc } from "../../services/translation"
import { HTTPAuth } from "../../services/api"

export default defineComponent({

  name: "s-select",

  inheritAttrs: false,

  props: {

    modelValue: [
      String,
      Number,
      Object,
      Array
    ],

    options: {
      type: Array,
      default: () => []
    },

    api: {
      type: String,
      default: null
    },

    pageSize: {
      type: Number,
      default: null
    }

  },

  emits: [
    "update:modelValue"
  ],

  setup(props, { emit }) {

    const attrs = useAttrs()

    const User = useUserStore()

    const layout = computed(() => {
      return User.ps?.layout || {}
    })

    const localValue = ref(
      props.modelValue
    )

    const optionsList = ref([])

    const loading = ref(false)

    const nextPageUrl = ref(null)

    const searchRef = ref("")

    const loadingMore = ref(false)

    // ==========================================================
    // LABEL
    // ==========================================================

    const optionLabelKey = computed(() => {
      return attrs["option-label"]
    })

    const getLabel = (option) => {

      if (!option) {
        return ""
      }

      if (
        typeof optionLabelKey.value === "function"
      ) {
        return optionLabelKey.value(option)
      }

      if (
        typeof optionLabelKey.value === "string"
      ) {
        return (
          option?.[optionLabelKey.value] ??
          ""
        )
      }

      return option?.label ?? ""
    }

    // ==========================================================
    // MODEL
    // ==========================================================

    watch(
      localValue,
      (value) => {

        emit(
          "update:modelValue",
          value
        )

      }
    )

    watch(
      () => props.modelValue,
      (value) => {

        localValue.value = value

      }
    )

    // ==========================================================
    // FETCH PAGE
    // ==========================================================

    const fetchPage = async (
      urlOverride = null,
      search = ""
    ) => {

      if (
        !props.api &&
        !urlOverride
      ) {
        return
      }

      if (
        urlOverride &&
        loadingMore.value
      ) {
        // loadingMore já foi marcado pelo virtual scroll
      }

      if (!urlOverride) {
        loading.value = true
      }

      try {

        const requestUrl =
          urlOverride ||
          props.api

        const params = {}

        /*
        |--------------------------------------------------------------------------
        | Primeira página / nova pesquisa
        |--------------------------------------------------------------------------
        */

        if (!urlOverride) {

          params.search = search

          if (
            props.pageSize !== null &&
            props.pageSize !== undefined
          ) {
            params.page_size =
              props.pageSize
          }

        }

        /*
        |--------------------------------------------------------------------------
        | Próxima página
        |--------------------------------------------------------------------------
        |
        | O campo `next` normalmente já contém page, search e page_size.
        | Por isso, quando usamos urlOverride, não precisamos reenviar params.
        |
        */

        const response =
          await HTTPAuth.get(
            requestUrl,
            {
              params
            }
          )

        const data =
          response.data

        /*
        |--------------------------------------------------------------------------
        | API paginada
        |--------------------------------------------------------------------------
        |
        | {
        |   count: 100,
        |   next: "...",
        |   previous: null,
        |   results: []
        | }
        |
        |--------------------------------------------------------------------------
        | API sem paginação
        |--------------------------------------------------------------------------
        |
        | []
        |
        */

        const results =
          data?.results ??
          data ??
          []

        if (urlOverride) {

          optionsList.value = [
            ...optionsList.value,
            ...results
          ]

        } else {

          optionsList.value =
            Array.isArray(results)
              ? results
              : []

        }

        nextPageUrl.value =
          data?.next ??
          null

      } catch (error) {

        console.error(
          "s-select pagination error:",
          error
        )

      } finally {

        loading.value = false

        loadingMore.value = false

      }

    }

    // ==========================================================
    // FILTER
    // ==========================================================

    const onFilter = (
      value,
      update
    ) => {

      update(
        async () => {

          searchRef.value =
            value || ""

          /*
          |--------------------------------------------------------------------------
          | API
          |--------------------------------------------------------------------------
          */

          if (props.api) {

            nextPageUrl.value =
              null

            await fetchPage(
              null,
              searchRef.value
            )

            return
          }

          /*
          |--------------------------------------------------------------------------
          | OPTIONS LOCAIS
          |--------------------------------------------------------------------------
          */

          const search =
            String(
              value || ""
            )
              .toLowerCase()
              .trim()

          if (!search) {

            optionsList.value = [
              ...(props.options || [])
            ]

            return
          }

          optionsList.value =
            (props.options || [])
              .filter(
                option => {

                  return String(
                    getLabel(option)
                  )
                    .toLowerCase()
                    .includes(search)

                }
              )

        }
      )

    }

    // ==========================================================
    // VIRTUAL SCROLL / INFINITE PAGINATION
    // ==========================================================

    const onScroll = async ({
      to
    }) => {

      if (!props.api) {
        return
      }

      if (!nextPageUrl.value) {
        return
      }

      if (loadingMore.value) {
        return
      }

      const lastIndex =
        optionsList.value.length - 1

      /*
      |--------------------------------------------------------------------------
      | Carrega próximo bloco quando faltarem cerca de 5 itens
      |--------------------------------------------------------------------------
      */

      if (
        to >=
        lastIndex - 5
      ) {

        loadingMore.value =
          true

        await fetchPage(
          nextPageUrl.value,
          searchRef.value
        )

      }

    }

    // ==========================================================
    // INIT
    // ==========================================================

    onMounted(
      async () => {

        if (props.api) {

          await fetchPage()

          return
        }

        optionsList.value = [
          ...(props.options || [])
        ]

      }
    )

    // ==========================================================
    // WATCH API
    // ==========================================================

    watch(
      () => props.api,
      async (
        value,
        oldValue
      ) => {

        if (
          value === oldValue
        ) {
          return
        }

        optionsList.value = []

        nextPageUrl.value = null

        searchRef.value = ""

        if (value) {

          await fetchPage()

        } else {

          optionsList.value = [
            ...(props.options || [])
          ]

        }

      }
    )

    // ==========================================================
    // WATCH PAGE SIZE
    // ==========================================================

    watch(
      () => props.pageSize,
      async (
        value,
        oldValue
      ) => {

        if (
          value === oldValue
        ) {
          return
        }

        if (!props.api) {
          return
        }

        optionsList.value = []

        nextPageUrl.value = null

        await fetchPage(
          null,
          searchRef.value
        )

      }
    )

    // ==========================================================
    // WATCH OPTIONS
    // ==========================================================

    watch(
      () => props.options,
      (value) => {

        if (props.api) {
          return
        }

        optionsList.value = [
          ...(value || [])
        ]

      },
      {
        deep: true
      }
    )

    // ==========================================================
    // UI
    // ==========================================================

    const translatedLabel =
      computed(
        () => {

          return attrs.label
            ? tdc(attrs.label)
            : undefined

        }
      )

    const translatedPlaceholder =
      computed(
        () => {

          return attrs.placeholder
            ? tdc(attrs.placeholder)
            : undefined

        }
      )

    const selectAttrs =
      computed(
        () => {

          const {
            label,
            placeholder,
            ...rest
          } = attrs

          return rest

        }
      )

    return {

      attrs,

      layout,

      localValue,

      optionsList,

      loading,

      translatedLabel,

      translatedPlaceholder,

      selectAttrs,

      onFilter,

      onScroll

    }

  }

})
</script>
