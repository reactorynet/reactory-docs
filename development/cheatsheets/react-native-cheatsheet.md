# React Native Cheat Sheet

## What is React Native?

React Native is a framework for building native mobile apps (iOS and Android) using React and JavaScript/TypeScript. Components map to native UI elements — not web DOM elements. Styling uses a JavaScript-based StyleSheet API that resembles CSS but with some key differences (no inheritance, no `%` units by default, Flexbox is the layout system).

---

## Quick Reference

```bash
npx react-native init MyApp --template react-native-template-typescript
npm start                   # Start Metro bundler
npm run android             # Build and run on Android emulator/device
npm run ios                 # Build and run on iOS simulator/device
npm test                    # Run Jest tests
npm run lint                # Run ESLint
npx react-native doctor     # Diagnose environment setup
```

---

## CLI and Setup

### Create a New Project
```bash
# Bare React Native (TypeScript)
npx react-native@latest init MyApp --template react-native-template-typescript

# Expo (managed workflow — easier setup)
npx create-expo-app MyApp --template
npx create-expo-app MyApp -t expo-template-blank-typescript
```

### Start Dev Server
```bash
npm start                    # Metro bundler
npm start --reset-cache      # Clear Metro cache
npx react-native start --reset-cache
```

### Run on Device / Emulator
```bash
npm run android              # Android
npm run ios                  # iOS (macOS only)
npx react-native run-android --deviceId <id>
npx react-native run-ios --simulator "iPhone 15 Pro"
npx react-native run-ios --device "My iPhone"
```

### Diagnose Environment
```bash
npx react-native doctor
npx react-native info        # Show environment info
```

### Clean Builds
```bash
cd android && ./gradlew clean    # Clean Android
cd ios && xcodebuild clean       # Clean iOS
watchman watch-del-all           # Clear Watchman cache
npm start --reset-cache          # Clear Metro cache
```

---

## Core Components

### View, Text, Image, ScrollView
```tsx
import {
  View, Text, Image, ScrollView, TextInput,
  TouchableOpacity, Pressable, FlatList, StyleSheet
} from 'react-native';

const App = () => (
  <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.box}>
      <Text style={styles.title}>Hello React Native</Text>
      <Image
        source={{ uri: 'https://example.com/photo.png' }}
        style={{ width: 100, height: 100 }}
        resizeMode="cover"
      />
    </View>
  </ScrollView>
);
```

### Text Input
```tsx
<TextInput
  style={styles.input}
  value={text}
  onChangeText={setText}
  placeholder="Enter text..."
  placeholderTextColor="#aaa"
  autoCapitalize="none"
  autoCorrect={false}
  keyboardType="email-address"   // 'default' | 'email-address' | 'numeric' | 'phone-pad'
  returnKeyType="done"           // 'done' | 'next' | 'search' | 'go'
  onSubmitEditing={handleSubmit}
  secureTextEntry={false}
  multiline={false}
  maxLength={100}
  editable={true}
/>
```

### Button and Touchables
```tsx
import { Button, TouchableOpacity, Pressable } from 'react-native';

// Simple button (limited styling)
<Button title="Press me" onPress={handlePress} color="#007AFF" />

// TouchableOpacity — fades opacity on press
<TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
  <Text>Press me</Text>
</TouchableOpacity>

// Pressable — most flexible (React Native 0.64+)
<Pressable
  onPress={handlePress}
  onLongPress={handleLongPress}
  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
>
  {({ pressed }) => <Text>{pressed ? 'Pressing...' : 'Press me'}</Text>}
</Pressable>
```

---

## Styling

### StyleSheet API
```tsx
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
```

### Flexbox Layout
```tsx
// React Native uses Flexbox by default
// Default flexDirection is 'column' (unlike web where it's 'row')
<View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

// flexDirection: 'row' | 'column' | 'row-reverse' | 'column-reverse'
// justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
// alignItems: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
// alignSelf: same values as alignItems (overrides for a single child)
// flex: number  — how much space to take relative to siblings
// flexWrap: 'wrap' | 'nowrap'
```

### Dimensions and Units
```tsx
import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

// Static dimensions
const { width, height } = Dimensions.get('window');
const { width, height } = Dimensions.get('screen');

// Dynamic dimensions (updates on rotation)
const { width, height } = useWindowDimensions();

// Pixel density
const pixelRatio = PixelRatio.get();          // e.g. 2, 3, 3.5
PixelRatio.getPixelSizeForLayoutSize(100);    // Physical pixels for 100dp
```

### Platform-Specific Styles
```tsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

// Inline
<View style={Platform.OS === 'ios' ? styles.iosStyle : styles.androidStyle} />
```

---

## Navigation (React Navigation)

```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

### Stack Navigator
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

// Navigate
navigation.navigate('Profile', { userId: '123' });
navigation.goBack();
navigation.replace('Home');
navigation.push('Profile', { userId: '456' });
navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

// Get params
const { userId } = route.params;

// useNavigation hook (inside any child component)
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
```

### Bottom Tab Navigator
```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Feed"
      component={FeedScreen}
      options={{ tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} /> }}
    />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);
```

---

## Lists

### FlatList
```tsx
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item, index }) => <ItemRow item={item} />}
  ItemSeparatorComponent={() => <View style={styles.separator} />}
  ListEmptyComponent={<Text>No items</Text>}
  ListHeaderComponent={<Text style={styles.header}>My List</Text>}
  ListFooterComponent={isLoading && <ActivityIndicator />}
  onEndReached={loadMore}
  onEndReachedThreshold={0.2}
  onRefresh={handleRefresh}
  refreshing={isRefreshing}
  numColumns={2}             // Grid layout
  horizontal={false}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### SectionList
```tsx
<SectionList
  sections={[
    { title: 'A', data: ['Alice', 'Anna'] },
    { title: 'B', data: ['Bob', 'Beth'] },
  ]}
  keyExtractor={(item, index) => item + index}
  renderItem={({ item }) => <Text>{item}</Text>}
  renderSectionHeader={({ section }) => <Text style={styles.header}>{section.title}</Text>}
/>
```

---

## Platform APIs

### Alert
```tsx
import { Alert } from 'react-native';

Alert.alert('Title', 'Message', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'OK', onPress: () => console.log('OK pressed') },
  { text: 'Destructive', style: 'destructive', onPress: handleDelete },
]);

Alert.prompt('Enter value', 'Enter a number:', value => console.log(value)); // iOS only
```

### StatusBar
```tsx
import { StatusBar } from 'react-native';

<StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
// barStyle: 'default' | 'light-content' | 'dark-content'
```

### Keyboard
```tsx
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';

Keyboard.dismiss();   // Hide keyboard programmatically

// Adjust layout when keyboard appears
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <TextInput />
</KeyboardAvoidingView>
```

### Animated API
```tsx
import { Animated } from 'react-native';

const fadeAnim = useRef(new Animated.Value(0)).current;

const fadeIn = () => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,   // Always use native driver for opacity/transform
  }).start();
};

<Animated.View style={{ opacity: fadeAnim }}>
  <Text>Fading in</Text>
</Animated.View>

// Spring animation
Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true }).start();

// Sequence
Animated.sequence([
  Animated.timing(value, { toValue: 1, duration: 200, useNativeDriver: true }),
  Animated.timing(value, { toValue: 0, duration: 200, useNativeDriver: true }),
]).start();

// Parallel
Animated.parallel([
  Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
  Animated.timing(scale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
]).start();

// Interpolate
const rotation = fadeAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],
});
<Animated.View style={{ transform: [{ rotate: rotation }] }} />
```

### AsyncStorage
```bash
npm install @react-native-async-storage/async-storage
```
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('user', JSON.stringify(user));
const raw = await AsyncStorage.getItem('user');
const user = raw ? JSON.parse(raw) : null;
await AsyncStorage.removeItem('user');
await AsyncStorage.clear();

const keys = await AsyncStorage.getAllKeys();
const pairs = await AsyncStorage.multiGet(['key1', 'key2']);
```

### Permissions
```bash
npm install react-native-permissions
```
```tsx
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const status = await check(PERMISSIONS.IOS.CAMERA);
// status: 'unavailable' | 'denied' | 'limited' | 'granted' | 'blocked'

if (status === RESULTS.DENIED) {
  const result = await request(PERMISSIONS.IOS.CAMERA);
}
```

---

## Networking

```tsx
// fetch API
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ name: 'Alice' }),
});
const data = await response.json();

// Axios
import axios from 'axios';
const { data } = await axios.get('/users', { params: { page: 1 } });
await axios.post('/users', { name: 'Alice' });
```

---

## Debugging

```bash
# Open React Native Debugger / Metro logs
npx react-native log-android      # View Android logcat
npx react-native log-ios          # View iOS logs

# Flipper (Facebook's debugger)
# Install from https://fbflipper.com/
```

```tsx
// In-app debugging
console.log('value:', value);
console.warn('Warning!');
console.error('Error!');

// React DevTools
// Shake device → "Open Debugger" or "Open React DevTools"

// Performance Monitor
import { PerformanceObserver } from 'react-native';
// Or: Shake device → Performance Monitor

// Inspect element overlay
// Shake device → Inspector
```

---

## Common Patterns

### Safe Area Insets
```bash
npm install react-native-safe-area-context
```
```tsx
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Wrap the app
<SafeAreaProvider>
  <App />
</SafeAreaProvider>

// Use in screens
<SafeAreaView style={{ flex: 1 }}>
  <Content />
</SafeAreaView>

// Or use the hook for custom layouts
const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }} />
```

### Loading and Error States
```tsx
const DataScreen = () => {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <ActivityIndicator size="large" color="#007AFF" />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  return <FlatList data={data} renderItem={renderItem} keyExtractor={k => k.id} />;
};
```

### Platform-Specific Files
```
MyComponent.ios.tsx      # iOS only
MyComponent.android.tsx  # Android only
MyComponent.tsx          # Fallback
```
React Native's bundler automatically picks the right file at build time.

---

## Testing

```bash
npm test                                # All tests
npm test -- --testPathPattern="Screen"  # Filter by filename
npm test -- --watch                     # Watch mode
npm test -- --coverage                  # Coverage report
```

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyButton from '../MyButton';

describe('MyButton', () => {
  it('renders the label', () => {
    const { getByText } = render(<MyButton label="Press me" onPress={() => {}} />);
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyButton label="Press me" onPress={onPress} />);
    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

---

## Tips and Best Practices

### Always Use `useNativeDriver: true`
For `transform` and `opacity` animations, always set `useNativeDriver: true` to keep animations off the JS thread and on the native thread:
```tsx
Animated.timing(value, { toValue: 1, duration: 300, useNativeDriver: true }).start();
```

### Use `StyleSheet.create` Over Inline Objects
Inline style objects are created fresh on every render. `StyleSheet.create` registers styles natively and performs ID-based lookups:
```tsx
// Prefer
style={styles.container}
// Over
style={{ flex: 1, backgroundColor: '#fff' }}
```

### Avoid Anonymous Functions in Render
```tsx
// Bad — new function created on every render
<FlatList renderItem={({ item }) => <Item item={item} />} />

// Good — stable reference
const renderItem = useCallback(({ item }: { item: Item }) => (
  <ItemRow item={item} />
), []);
<FlatList renderItem={renderItem} />
```

### Limit Bridge Crossing
The JavaScript and Native threads communicate over a bridge (or JSI in new architecture). Minimize synchronous back-and-forth. Prefer batch updates and `useNativeDriver` animations.

### Enable New Architecture (React Native 0.71+)
```bash
# Android: android/gradle.properties
newArchEnabled=true

# iOS: ios/Podfile
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```
The New Architecture (Fabric + TurboModules + JSI) improves performance and eliminates many bridge bottlenecks.
