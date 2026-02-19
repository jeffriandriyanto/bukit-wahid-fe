<script setup lang="ts">
import { sidebarItems } from '~/const/sidebar'
const { user, logout } = useAuth()
const open = ref(false)
const route = useRoute()
const isChangePasswordOpen = ref(false)

const displayName = computed(() => {
  if (!route.name) return ''

  const displayPath =
    sidebarItems.find((sidebar) => sidebar.to === route.path)?.label || ''
  return displayPath
})

const userActive = computed(() => user.value)

const userMenuItems = computed(() => [
  [
    {
      label: user.value?.person?.name || 'Guest',
      avatar: {
        src: user.value?.person?.avatar || ''
      },
      type: 'label'
    }
  ],
  [
    {
      label: 'Ganti Password',
      icon: 'i-heroicons-key',
      onSelect: () => {
        isChangePasswordOpen.value = true
      }
    }
  ],
  [
    {
      label: 'Logout',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      onSelect: () => {
        logout()
      }
    }
  ]
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :ui="{
        root: 'bg-neutral-900 text-white',
        content: 'bg-neutral-900 text-white'
      }"
      collapsible
      resizable
    >
      <template #header>
        <AppLogoWhite class="w-auto mx-auto h-8 shrink-0" />
      </template>

      <template #default>
        <SidebarNav :items="sidebarItems" />
      </template>

      <template #footer>
        <span>v1.1.0</span>
      </template>
    </UDashboardSidebar>

    <UMain class="bg-white w-full overflow-auto text-black">
      <UDashboardPanel
        id="home"
        :ui="{
          root: 'bg-neutral-100'
        }"
      >
        <template #header>
          <UDashboardNavbar
            title="Home"
            :ui="{ right: 'gap-3', root: 'border-b-0' }"
          >
            <template #left>
              <div class="text-xl font-semibold">
                {{ displayName }}
              </div>
            </template>
            <template #right>
              <UDropdownMenu :items="userMenuItems" :ui="{ content: 'w-56' }">
                <button
                  class="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 transition hover:bg-neutral-100"
                >
                  <div class="flex flex-col text-right leading-tight">
                    <span class="text-sm font-medium text-neutral-900">
                      {{ userActive?.person?.name || '' }}
                    </span>
                    <span class="text-xs text-neutral-500">
                      {{ userActive?.username || '' }}
                    </span>
                  </div>

                  <UAvatar
                    v-if="userActive?.person?.avatar"
                    :src="userActive?.person?.avatar"
                    size="sm"
                  />
                </button>
              </UDropdownMenu>

              <ChangePasswordModal v-model:open="isChangePasswordOpen" />
            </template>
          </UDashboardNavbar>
        </template>

        <template #body>
          <slot />
        </template>
      </UDashboardPanel>
    </UMain>
  </UDashboardGroup>
</template>
