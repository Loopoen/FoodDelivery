import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function Index() {
  const { user, isLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      // Không gọi router.replace('/login') ở đây.
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Lỗi', 'Đăng xuất thất bại. Vui lòng thử lại.');
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#DC3535" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 30 }}>
        Food Delivery
      </Text>

      <Pressable
        onPress={onLogout}
        disabled={isLoggingOut}
        style={{
          backgroundColor: '#DC3535',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 10,
        }}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            Đăng xuất
          </Text>
        )}
      </Pressable>
    </View>
  );
}