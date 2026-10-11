import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth, type UserRole } from '@/context/auth-context';
import { getErrorMessage } from '@/lib/axios';

type Mode = 'login' | 'register';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'CUSTOMER', label: '👤 Khách hàng' },
  { value: 'RESTAURANT_OWNER', label: '🍔 Chủ nhà hàng' },
  { value: 'DRIVER', label: '🛵 Tài xế' },
];

const inputStyle = {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  marginBottom: 12,
} as const;

export default function LoginScreen() {
  const { user, isLoading, login, register, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Đã đăng nhập (kể cả vừa đăng nhập xong) -> vào trang chính
  if (!isLoading && user) return <Redirect href="/" />;

  const isRegister = mode === 'register';

  const onSubmit = async () => {
    try {
      if (!email.trim() || !password) {
        throw new Error('Vui lòng nhập email và mật khẩu');
      }
      if (isRegister && (!firstName.trim() || !lastName.trim())) {
        throw new Error('Vui lòng nhập họ và tên');
      }

      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();

      if (isRegister) {
        await register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          password,
          role,
        });
      } else {
        await login(normalizedEmail, password);
      }
      // Thành công: user được set trong context, <Redirect> ở trên tự chuyển sang trang chính
    } catch (e) {
      Alert.alert(isRegister ? 'Đăng ký thất bại' : 'Đăng nhập thất bại', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onGooglePress = async () => {
    try {
      setLoading(true);
      await loginWithGoogle(role);
    } catch (e) {
      Alert.alert('Đăng nhập Google thất bại', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
          Food Delivery
        </Text>
        <Text style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
          {isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập để tiếp tục'}
        </Text>

        {/* Vai trò: dùng khi đăng ký và khi đăng nhập Google lần đầu */}
        <View style={{ marginBottom: 12 }}>
          {ROLES.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: role === r.value ? '#DC3535' : '#ddd',
                marginBottom: 10,
              }}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600' }}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        {isRegister && (
          <>
            <TextInput
              style={inputStyle}
              placeholder="Họ"
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={inputStyle}
              placeholder="Tên"
              value={firstName}
              onChangeText={setFirstName}
            />
          </>
        )}

        <TextInput
          style={inputStyle}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          style={inputStyle}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={{
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: '#DC3535',
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
              {isRegister ? 'Đăng ký' : 'Đăng nhập'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setMode(isRegister ? 'login' : 'register')}
          disabled={loading}
          style={{ paddingVertical: 14 }}
        >
          <Text style={{ textAlign: 'center', color: '#DC3535', fontWeight: '600' }}>
            {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
          <Text style={{ marginHorizontal: 12, color: '#999' }}>hoặc</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#eee' }} />
        </View>

        <Pressable
          onPress={onGooglePress}
          disabled={loading}
          style={{
            marginTop: 12,
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#ddd',
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Tiếp tục với Google</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}