<template>
  <!-- The current Entity's website (Entity.site): shown only when it has one.
       One click opens it in this tab, a double click in a new tab - same rule
       as the header brand (composables/useEntitySite.js). -->
  <s-btn
    v-if="site"
    dense flat round
    icon="public"
    data-test="header-site"
    :aria-label="tdc('Website')"
    @click="onClick"
    @dblclick="onDoubleClick"
  >
    <s-tooltip>{{ tdc('Open the website (double-click: new tab)') }}</s-tooltip>
  </s-btn>
</template>

<script setup>
import { tdc } from '../../services/translation'
import { useEntitySite } from '../../composables/useEntitySite'

const { site, onClick, onDoubleClick } = useEntitySite()
</script>
