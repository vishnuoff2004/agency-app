import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function BookingsLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FBF5DD',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#0D530E',
        },
        headerTintColor: '#306D29',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('booking.history', 'Booking History'),
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: t('booking.detail', 'Booking Detail'),
        }}
      />
    </Stack>
  );
}
