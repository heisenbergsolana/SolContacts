import { Tabs } from 'expo-router'
import { ContactsIcon } from '@/components/ui/icons/contacts-icon'
import { GroupsIcon } from '@/components/ui/icons/groups-icon'
import { AppTabBar, TabBarItem } from '@/components/ui/tab-bar'

/**
 * Keyed by route name rather than by position, so adding a screen to this folder cannot silently
 * shift every label one tab to the left.
 */
const TABS = {
  index: { label: 'Contacts', icon: ContactsIcon },
  groups: { label: 'Groups', icon: GroupsIcon },
} as const

function isTabRoute(name: string): name is keyof typeof TABS {
  return name in TABS
}

/**
 * **The tab animation stays `none`. Do not set `shift` or `fade` here.**
 *
 * Both of those interpolate the scene's `opacity` from an `Animated.Value` that
 * `useAnimatedHashMap` initialises to 1 for every tab that is not the focused one — and 1 maps to
 * `opacity: 0`. Tabs are lazy, so the Groups screen first mounts on the same commit that starts the
 * animation which is supposed to bring it back to 1. That animation runs on the native driver, and
 * when it starts before the freshly mounted scene is attached natively, the value never reaches the
 * view: the tab renders, lays out, and sits there fully transparent. Switching away and back finds
 * it already mounted and it appears — which is exactly what the bug looked like from the outside.
 *
 * `none` is the only preset with no scene style interpolator at all, so there is no opacity for a
 * missed animation to strand. Nothing is lost: the tab bar's own pill already answers "which tab am
 * I on", which is the only question a tab transition could have answered.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'none',
        headerShown: false,
        // The wash lives in `Screen`, so the navigator must not paint its own colour over it.
        sceneStyle: { backgroundColor: 'transparent' },
      }}
      tabBar={({ state, navigation, insets }) => {
        const routes = state.routes.filter((route) => isTabRoute(route.name))
        const items: TabBarItem[] = routes.map((route) => ({
          key: route.key,
          ...TABS[route.name as keyof typeof TABS],
        }))

        return (
          <AppTabBar
            activeIndex={routes.findIndex((route) => route.key === state.routes[state.index].key)}
            bottomInset={insets.bottom}
            items={items}
            onSelect={(index) => {
              const route = routes[index]
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
              // The navigator's own listeners get first refusal — that is what scrolls a list back
              // to the top when its tab is tapped a second time.
              if (!event.defaultPrevented) navigation.navigate(route.name)
            }}
          />
        )
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="groups" />
    </Tabs>
  )
}
