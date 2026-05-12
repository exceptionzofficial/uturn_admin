import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import adminApi from '../api/adminApi';

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosAlerts, setSosAlerts] = useState([]);
  const appState = useRef(AppState.currentState);

  const fetchStats = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await adminApi.getDashboard();
      setStats(data);
      
      // Fetch SOS alerts specifically
      const token = await AsyncStorage.getItem('admin_token');
      const res = await axios.get('https://uturn-nl7u.onrender.com/api/admin/rides', {
          headers: { Authorization: `Bearer ${token}` }
      });
      const allRides = res.data?.data || [];
      const activeSOS = allRides.filter(r => r.sosTriggered === true);
      setSosAlerts(activeSOS);
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto refresh every 45 seconds for active monitoring
    const interval = setInterval(() => fetchStats(true), 45000);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[Dashboard] App in foreground, refreshing stats...');
        fetchStats();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value || 0}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderNavCard = (title, subtitle, icon, screen) => (
    <TouchableOpacity 
      style={styles.navCard} 
      onPress={() => navigation.navigate(screen)}
      activeOpacity={0.7}
    >
      <View style={styles.navCardLeft}>
        <View style={styles.navIconCircle}>
            <Icon name={icon} size={24} color="#1A237E" />
        </View>
        <View>
            <Text style={styles.navTitle}>{title}</Text>
            <Text style={styles.navSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color="#BBB" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Welcome back,</Text>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchStats} colors={["#1A237E"]} />
        }
      >
        {sosAlerts.length > 0 && (
          <View style={styles.sosBanner}>
            <View style={styles.sosHeader}>
              <Icon name="alert-triangle" size={24} color="#FFF" />
              <Text style={styles.sosTitle}>EMERGENCY SOS ALERT ({sosAlerts.length})</Text>
            </View>
            {sosAlerts.map((sos, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.sosItem}
                onPress={() => navigation.navigate('RideMonitor', { status: 'sos' })}
              >
                <Text style={styles.sosText}>🚨 Trip #{sos.id?.slice(-8)}: Driver {sos.driverInfo?.name || 'Unknown'} triggered SOS!</Text>
                <Icon name="arrow-right" size={16} color="#FFF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.statsGrid}>
          {renderStatCard('Approved Drivers', stats?.totalDrivers, 'truck', '#1E88E5')}
          {renderStatCard('Waiting Approval', stats?.pendingDrivers, 'clock', '#FB8C00')}
          {renderStatCard('Approved Vendors', stats?.totalVendors, 'shopping-bag', '#43A047')}
          {renderStatCard('Waiting Approval', stats?.pendingVendors, 'alert-circle', '#E53935')}
        </View>

        <Text style={styles.sectionHeader}>Monitoring & Operations</Text>
        {renderNavCard('Live Ride Monitor', 'Track active and completed rides', 'activity', 'RideMonitor')}
        
        <Text style={styles.sectionHeader}>Verification & Onboarding</Text>
        {renderNavCard('Verify Drivers', 'Review and approve new drivers', 'user-check', 'DriverReview')}
        {renderNavCard('Verify Vendors', 'Review and approve new vendors', 'shopping-cart', 'VendorReview')}
        
        <Text style={styles.sectionHeader}>User Management</Text>
        {renderNavCard('Manage Drivers', 'View and edit all driver details', 'users', 'ManageDrivers')}
        {renderNavCard('Manage Vendors', 'View and edit all vendor details', 'briefcase', 'ManageVendors')}

        <View style={styles.summaryBox}>
            <View style={styles.summaryHeader}>
                <Icon name="zap" size={20} color="#FFF" />
                <Text style={styles.summaryTitle}>Live Operations Status</Text>
            </View>
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Active Rides</Text>
                    <Text style={styles.summaryVal}>{stats?.activeTrips || 0}</Text>
                </View>
                <View style={[styles.summaryDivider, { height: '80%' }]} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Completed</Text>
                    <Text style={styles.summaryVal}>{stats?.completedTrips || (stats?.totalTrips - (stats?.activeTrips || 0) - (stats?.pendingTrips || 0)) || 0}</Text>
                </View>
            </View>
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Pending Pickup</Text>
                    <Text style={styles.summaryVal}>{stats?.pendingTrips || 0}</Text>
                </View>
                <View style={[styles.summaryDivider, { height: '80%' }]} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Platform Load</Text>
                    <Text style={styles.summaryVal}>{stats?.totalTrips || 0} Trips</Text>
                </View>
            </View>
        </View>

        <View style={[styles.summaryBox, { backgroundColor: '#FFF', marginTop: 20, borderWidth: 1, borderColor: '#E0E0E0', elevation: 2 }]}>
            <View style={[styles.summaryHeader, { backgroundColor: '#F0F2FF' }]}>
                <Icon name="users" size={20} color="#1A237E" />
                <Text style={[styles.summaryTitle, { color: '#1A237E' }]}>Registered Entities Summary</Text>
            </View>
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: '#888' }]}>Total Drivers</Text>
                    <Text style={[styles.summaryVal, { color: '#1A237E' }]}>{stats?.totalDrivers || 0}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: '#EEE', height: '80%' }]} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: '#888' }]}>Total Vendors</Text>
                    <Text style={[styles.summaryVal, { color: '#1A237E' }]}>{stats?.totalVendors || 0}</Text>
                </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#EEE', marginVertical: 10 }} />
            <Text style={{ fontSize: 10, color: '#AAA', textAlign: 'center', fontWeight: '700' }}>Platform Registered Items Overview</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { padding: 25, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  headerSubtitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1A237E', marginTop: 4 },
  scroll: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { 
    width: '48%', backgroundColor: '#FFF', borderRadius: 15, padding: 15, 
    marginBottom: 15, borderLeftWidth: 4, elevation: 2, flexDirection: 'row', alignItems: 'center' 
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statInfo: { marginLeft: 12 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#333' },
  statTitle: { fontSize: 10, fontWeight: '700', color: '#888', marginTop: 2 },
  sectionHeader: { fontSize: 16, fontWeight: '900', color: '#1A237E', marginTop: 15, marginBottom: 15 },
  navCard: { 
    backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 15, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 
  },
  navCardLeft: { flexDirection: 'row', alignItems: 'center' },
  navIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F2FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  navTitle: { fontSize: 16, fontWeight: '800', color: '#333' },
  navSubtitle: { fontSize: 12, color: '#999', marginTop: 2, fontWeight: '600' },
  summaryBox: { backgroundColor: '#1A237E', borderRadius: 25, padding: 20, marginTop: 10, elevation: 8 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 12 },
  summaryTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', marginLeft: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 10 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  summaryVal: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  sosBanner: {
    backgroundColor: '#D32F2F', borderRadius: 20, padding: 15, marginBottom: 20,
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10,
  },
  sosHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)', paddingBottom: 10 },
  sosTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginLeft: 10, letterSpacing: 1 },
  sosItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 12, marginBottom: 8 },
  sosText: { color: '#FFF', fontSize: 13, fontWeight: '800', flex: 1 },
});

export default AdminDashboardScreen;
