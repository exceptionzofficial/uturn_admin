import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DriverReviewScreen from './src/screens/DriverReviewScreen';
import VendorReviewScreen from './src/screens/VendorReviewScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import ManageDriversScreen from './src/screens/ManageDriversScreen';
import ManageVendorsScreen from './src/screens/ManageVendorsScreen';
import RideMonitorScreen from './src/screens/RideMonitorScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Dashboard"
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
        >
          <Stack.Screen name="Login" component={AdminLoginScreen} />
          <Stack.Screen name="Dashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="DriverReview" component={DriverReviewScreen} />
          <Stack.Screen name="VendorReview" component={VendorReviewScreen} />
          <Stack.Screen name="ManageDrivers" component={ManageDriversScreen} />
          <Stack.Screen name="ManageVendors" component={ManageVendorsScreen} />
          <Stack.Screen name="RideMonitor"   component={RideMonitorScreen} />
          <Stack.Screen name="RideDetail"    component={RideDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
