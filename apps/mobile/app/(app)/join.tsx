import { useAuth } from '@clerk/expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { apiFetch } from '../../lib/api';

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ listId: string }>('/api/shopping-lists/join', getToken, {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(({ listId }) => router.replace(`/(app)/shopping-list?list=${listId}`))
      .catch(() => setError(true));
  }, [token]);

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-muted-foreground text-center">
        {error ? t('sharedLists.invalidToken') ?? 'Virheellinen kutsulink' : t('sharedLists.joining')}
      </Text>
    </View>
  );
}
