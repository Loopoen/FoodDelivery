import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

type UserRole = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DRIVER';

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Khách hàng', value: 'CUSTOMER' },
  { label: 'Chủ nhà hàng', value: 'RESTAURANT_OWNER' },
  { label: 'Tài xế', value: 'DRIVER' },
];

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    if (!firstName || !lastName || !email || !password) {
      return Alert.alert('Vui lòng nhập đầy đủ thông tin');
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data?.message) ? data.message.join('\n') : data?.message;
        throw new Error(msg ?? 'Đăng ký thất bại');
      }
      await SecureStore.setItemAsync('token', data.token);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Đăng ký thất bại', e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Tạo tài khoản</Text>

      <TextInput style={styles.input} placeholder="Họ" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Tên" value={firstName} onChangeText={setFirstName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={styles.label}>Tôi là...</Text>
      <View style={styles.roleContainer}>
        {ROLES.map((r) => (
          <Pressable
            key={r.value}
            style={[styles.roleButton, role === r.value && styles.roleButtonActive]}
            onPress={() => setRole(r.value)}
          >
            <Text style={[styles.roleText, role === r.value && styles.roleTextActive]}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.button} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đăng ký</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 12 },
  roleContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleButtonActive: { backgroundColor: '#DC3535', borderColor: '#DC3535' },
  roleText: { fontSize: 13, color: '#666' },
  roleTextActive: { color: '#fff', fontWeight: '600' },
  button: {
    backgroundColor: '#DC3535',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#DC3535' },
});