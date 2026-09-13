import { router, Stack } from 'expo-router'
import { NotFoundPanel } from '@/components/not-found-panel'
import { Screen } from '@/components/ui/screen'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <NotFoundPanel onGoHome={() => router.replace('/')} />
      </Screen>
    </>
  )
}
