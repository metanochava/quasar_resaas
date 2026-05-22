<template>
  <div
    class="bg-grey overflow-hidden"
    style="
      width: 300px;
      margin-top: 100px;
      margin-left: -2px;
      height: calc(100vh - 205px);
    "
  >

    <q-scroll-area
      class="fit"
      :thumb-style="thumbStyle"
      :bar-style="barStyle"
      style="
        height: calc(100vh - 205px);
        width: 100%;
      "
    >

      <q-list
        class="rounded-borders"
        style="
          width: 100%;
          overflow-x: hidden;
        "
      >

        <q-expansion-item
          v-for="App in User.Menus"
          :key="App"
          class="full-width"

          :class="
            $q.dark.isActive
              ? 'bg-dark-saas text-subtitle1 text-white'
              : 'text-subtitle1 text-primary'
          "

          :icon="App.icon"
          dense

          :label="tdc(App.menu)"

          :header-class="
            $q.dark.isActive
              ? 'bg-dark text-white'
              : 'bg-primary text-white'
          "

          :expand-icon-class="'text-white'"
        >

          <q-separator />

          <SubMenu :Dados="App.submenu" />

          <q-separator />

        </q-expansion-item>

      </q-list>

    </q-scroll-area>

  </div>
</template>

<style >
.q-expansion-item,
.q-item,
.q-item__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>