import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import Placeholder from './src/screens/Placeholder';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();
const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.color.bg, primary: theme.color.yolk } };
const icon = (e: string) => () => <Text style={{ fontSize: 22 }}>{e}</Text>;

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.color.yellow },
            headerTitleStyle: { color: theme.color.text, fontWeight: '800' },
            tabBarStyle: { backgroundColor: theme.color.paper, height: 64, paddingTop: 6 },
            tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
            tabBarActiveTintColor: theme.color.text,
            tabBarInactiveTintColor: theme.color.textSoft,
          }}
        >
          <Tab.Screen name="홈" component={HomeScreen} options={{ title: '🐥 삐약일기', tabBarLabel: '홈', tabBarIcon: icon('🏠') }} />
          <Tab.Screen name="달력" options={{ tabBarIcon: icon('📅') }}>{() => <Placeholder title="달력" />}</Tab.Screen>
          <Tab.Screen name="꾸미기" options={{ tabBarIcon: icon('🎨') }}>{() => <Placeholder title="꾸미기" />}</Tab.Screen>
          <Tab.Screen name="설정" options={{ tabBarIcon: icon('⚙️') }}>{() => <Placeholder title="설정" />}</Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
