import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, StatusBar,
  AppState, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = 'https://uturn-nl7u.onrender.com/api';

const STATUS_TABS = [
  { key: 'all',              label: 'All',        color: '#1A237E' },
  { key: 'sos',              label: '🚨 SOS',     color: '#D32F2F' },
  { key: 'active_all',       label: 'Active',     color: '#2196F3' },
  { key: 'finished_all',     label: 'Finished',   color: '#2E7D32' },
  { key: 'pending',          label: 'Waiting',    color: '#FF9800' },
  { key: 'driverAccepted',   label: 'Verify',     color: '#9C27B0' },
  { key: 'vendorApproved',   label: 'Approved',   color: '#4CAF50' },
  { key: 'driverArrived',    label: 'Arrived',    color: '#009688' },
  { key: 'inProgress',       label: 'Live',       color: '#2196F3' },
  { key: 'dropped',          label: 'Dropped',    color: '#E91E63' },
  { key: 'completed',        label: 'Done',       color: '#4CAF50' },
  { key: 'commissionPending',label: 'Commission', color: '#FF5722' },
  { key: 'cancelled',        label: 'Cancelled',  color: '#9E9E9E' },
];

const STATUS_COLOR = {
    ...STATUS_TABS.reduce((acc, t) => { acc[t.key] = t.color; return acc; }, {}),
    arrived: '#009688',
    started: '#2196F3',
};

const RideMonitorScreen = ({ navigation }) => {
  const [rides,       setRides]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [activeFilter,setActiveFilter]= useState('all');
  const [search,      setSearch]      = useState('');
  const appState = useRef(AppState.currentState);

  const fetchRides = useCallback(async (status = activeFilter) => {
    // Only show loading indicator if not background refreshing
    if (!refreshing) setLoading(true); 
    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      // If filtering for SOS, we might need a special fetch or filter
      let url = `${API_BASE}/admin/rides`;
      if (status !== 'all' && status !== 'active_all' && status !== 'finished_all' && status !== 'sos') {
          url += `?status=${status}`;
      }

      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      let data = res.data?.data || res.data || [];
      
      if (status === 'active_all') {
          data = data.filter(r => ['pending', 'driverAccepted', 'vendorApproved', 'inProgress', 'arrived', 'driverArrived', 'started'].includes(r.status));
      } else if (status === 'finished_all') {
          data = data.filter(r => ['dropped', 'completed', 'commissionPending', 'cancelled'].includes(r.status));
      } else if (status === 'sos') {
          data = data.filter(r => r.sosTriggered === true || r.status === 'sos');
      }

      setRides(data);
    } catch (err) {
      console.error('[RideMonitor] fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, refreshing]);

  useEffect(() => {
    fetchRides(activeFilter);
    
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[RideMonitor] App has come to the foreground, refreshing...');
        fetchRides(activeFilter);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [activeFilter, fetchRides]);

  const onRefresh = () => { setRefreshing(true); fetchRides(activeFilter); };

  const filtered = rides.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.tripId || r.id || '').toLowerCase().includes(q) ||
      (r.customerName  || '').toLowerCase().includes(q) ||
      (r.pickupAddress || r.pickup || '').toLowerCase().includes(q) ||
      (r.driverInfo?.name || '').toLowerCase().includes(q) ||
      (r.vendorInfo?.name || '').toLowerCase().includes(q)
    );
  });

  const renderStatusTabs = () => (
    <View style={{ height: 60, marginBottom: 10 }}>
        <FlatList
          horizontal
          data={STATUS_TABS}
          keyExtractor={t => t.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          renderItem={({ item }) => {
            const active = activeFilter === item.key;
            return (
              <TouchableOpacity
                style={[
                    styles.filterTab, 
                    active ? { backgroundColor: item.color, borderColor: item.color } : { backgroundColor: '#FFF' }
                ]}
                onPress={() => setActiveFilter(item.key)}
              >
                <Text 
                  style={[
                      styles.filterTabText, 
                      { color: active ? '#FFF' : '#607D8B' }
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
    </View>
  );

  const renderRideCard = ({ item }) => {
    const statusColor = STATUS_COLOR[item.status] || '#607D8B';
    const id = item.tripId || item.id || '—';
    return (
      <TouchableOpacity
        style={styles.rideCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RideDetail', { rideId: id, ride: item })}
      >
        <View style={styles.rideCardHeader}>
          <Text style={styles.rideId} numberOfLines={1}>#{id.slice(-12)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>

        <View style={styles.participantsRow}>
          <View style={styles.participant}>
            <Icon name="account-tie" size={14} color="#1A237E" />
            <Text style={styles.participantName} numberOfLines={1}>
              D: {item.driverInfo?.name || 'Searching...'}
            </Text>
          </View>
          <View style={styles.participant}>
            <Icon name="store" size={14} color="#43A047" />
            <Text style={styles.participantName} numberOfLines={1}>
              V: {item.vendorInfo?.name || 'Direct'}
            </Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
                <Icon name="record-circle-outline" size={14} color="#4CAF50" />
                <Text style={styles.routeText} numberOfLines={1}>{item.pickupAddress || item.pickup || '—'}</Text>
            </View>
            <View style={styles.routeRow}>
                <Icon name="map-marker" size={14} color="#F44336" />
                <Text style={styles.routeText} numberOfLines={1}>{item.dropAddress || item.drop || '—'}</Text>
            </View>
        </View>

        <View style={styles.rideCardFooter}>
          <Text style={styles.rideAmount}>₹{item.finalFare || item.totalFare || item.totalTripAmount || 0}</Text>
          <Text style={styles.rideDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—'}
          </Text>
          <View style={styles.arrowBtn}>
            <Icon name="chevron-right" size={18} color="#607D8B" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color="#1A237E" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Live Ride Monitor</Text>
            <Text style={styles.headerSubtitle}>Active & Completed Journeys</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Icon name="magnify" size={20} color="#90A4AE" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search trip, driver, vendor..."
          placeholderTextColor="#90A4AE"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color="#90A4AE" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Filters */}
      {renderStatusTabs()}

      {/* Results */}
      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1A237E" />
          <Text style={styles.loadingText}>Loading rides...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.tripId || item.id || Math.random().toString()}
          renderItem={renderRideCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A237E']} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="car-off" size={48} color="#CFD8DC" />
              <Text style={styles.emptyText}>No rides found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerSubtitle: { fontSize: 11, color: '#90A4AE', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 19, fontWeight: '900', color: '#1A237E' },
  countBadge: { backgroundColor: '#1A237E', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, backgroundColor: '#FFF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333', fontWeight: '700' },
  tabsRow: { paddingHorizontal: 16, paddingBottom: 15, gap: 10 },
  filterTab: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFF',
    minWidth: 100, alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6,
    marginRight: 4,
  },
  filterTabText: { fontSize: 13, fontWeight: 'bold', color: '#607D8B' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  rideCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  rideCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  rideId: { fontSize: 14, fontWeight: '900', color: '#1A237E', flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  participantsRow: { flexDirection: 'row', gap: 12, marginBottom: 14, backgroundColor: '#F0F4FF', padding: 12, borderRadius: 14 },
  participant: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  participantName: { fontSize: 12, fontWeight: '900', color: '#1A237E' },
  routeContainer: { marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  routeText: { flex: 1, fontSize: 14, color: '#455A64', fontWeight: '700' },
  rideCardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, borderTopWidth: 1.5, borderTopColor: '#F8F9FB', paddingTop: 12 },
  rideAmount: { flex: 1, fontSize: 20, fontWeight: '900', color: '#1A237E' },
  rideDate: { fontSize: 13, color: '#90A4AE', fontWeight: '800', marginRight: 10 },
  arrowBtn: { padding: 4 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#90A4AE', fontWeight: '800' },
  emptyBox: { paddingTop: 80, alignItems: 'center' },
  emptyText: { marginTop: 12, fontSize: 16, color: '#90A4AE', fontWeight: '800' },
});

export default RideMonitorScreen;
