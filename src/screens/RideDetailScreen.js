import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = 'https://uturn-nl7u.onrender.com/api';

const RideDetailScreen = ({ navigation, route }) => {
  const { rideId, ride: initialRide } = route.params || {};
  const [ride,    setRide]    = useState(initialRide || null);
  const [loading, setLoading] = useState(!initialRide);
  const appState = useRef(AppState.currentState);

  const fetchDetail = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const res = await axios.get(`${API_BASE}/admin/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRide(res.data?.data || res.data);
    } catch (err) {
      console.error('[RideDetail] fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rideId) {
      fetchDetail();
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[RideDetail] Refreshing details on foreground...');
        fetchDetail(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [rideId]);

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const Row = ({ icon, label, value, valueColor }) => (
    <View style={styles.row}>
      {icon && <Icon name={icon} size={16} color="#90A4AE" style={{ width: 24 }} />}
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value ?? '—'}</Text>
    </View>
  );

  const FareRow = ({ label, value, bold }) => (
    <View style={styles.fareRow}>
      <Text style={[styles.fareLabel, bold && styles.fareBold]}>{label}</Text>
      <Text style={[styles.fareValue, bold && styles.fareBold]}>₹{value ?? 0}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color="#1A237E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Detail</Text>
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1A237E" />
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color="#1A237E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Detail</Text>
        </View>
        <View style={styles.loadingBox}>
          <Icon name="alert-circle-outline" size={48} color="#CFD8DC" />
          <Text style={{ color: '#90A4AE', marginTop: 12 }}>Ride not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = {
    pending: '#FF9800', driverAccepted: '#9C27B0', vendorApproved: '#4CAF50',
    inProgress: '#2196F3', dropped: '#E91E63', completed: '#4CAF50',
    commissionPending: '#FF5722', cancelled: '#9E9E9E',
  }[ride.status] || '#607D8B';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#1A237E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>#{(rideId || '').slice(-12)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{ride.status?.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Route */}
        <Section title="Route">
          <Row icon="map-marker"       label="Pickup"     value={ride.pickupAddress || ride.pickup} />
          <Row icon="map-marker-check" label="Drop"       value={ride.dropAddress   || ride.drop} />
          <Row icon="car-side"         label="Vehicle"    value={ride.vehicleType   || ride.vehicle} />
          <Row icon="swap-horizontal"  label="Trip Type"  value={ride.tripType} />
        </Section>

        {/* Customer */}
        <Section title="Customer">
          <Row icon="account"    label="Name"   value={ride.customerName} />
          <Row icon="phone"      label="Phone"  value={ride.customerPhone} />
          <Row icon="translate"  label="Language" value={ride.customerLanguage} />
        </Section>

        {/* Driver */}
        <Section title="Driver">
          <Row icon="account-tie"  label="Driver ID"  value={ride.driverId} />
          {ride.driverInfo && <>
            <Row icon="account"      label="Name"      value={ride.driverInfo.name} />
            <Row icon="phone"        label="Phone"     value={ride.driverInfo.phone} />
            <Row icon="car"          label="Vehicle"   value={`${ride.driverInfo.vehicleType || ''} ${ride.driverInfo.vehicleNumber || ''}`} />
          </>}
          <Row icon="video"        label="Video URL"  value={ride.videoUrl ? 'Available' : 'None'} valueColor={ride.videoUrl ? '#4CAF50' : '#9E9E9E'} />
        </Section>

        {/* Vendor */}
        <Section title="Vendor">
          <Row icon="store" label="Vendor ID" value={ride.vendorId} />
          {ride.vendorInfo && <>
            <Row icon="account" label="Name"     value={ride.vendorInfo.name} />
            <Row icon="briefcase" label="Business" value={ride.vendorInfo.businessName} />
          </>}
        </Section>

        {/* Timeline */}
        <Section title="Timeline">
          <Row icon="clock-outline"    label="Created"   value={ride.createdAt   ? new Date(ride.createdAt).toLocaleString('en-IN')   : null} />
          <Row icon="check-circle"     label="Accepted"  value={ride.acceptedAt  ? new Date(ride.acceptedAt).toLocaleString('en-IN')  : null} />
          <Row icon="shield-check"     label="Approved"  value={ride.vendorApprovedAt ? new Date(ride.vendorApprovedAt).toLocaleString('en-IN') : null} />
          <Row icon="play-circle"      label="Started"   value={ride.tripStartedAt ? new Date(ride.tripStartedAt).toLocaleString('en-IN') : null} />
          <Row icon="flag-checkered"   label="Dropped"   value={ride.droppedAt   ? new Date(ride.droppedAt).toLocaleString('en-IN')   : null} />
          <Row icon="check-all"        label="Completed" value={ride.completedAt  ? new Date(ride.completedAt).toLocaleString('en-IN')  : null} />
          <Row icon="key"              label="OTP Used"  value={ride.otpUsed} />
          <Row icon="timer"            label="Wait"      value={ride.waitMinutes ? `${ride.waitMinutes} min` : null} />
        </Section>

        {/* Fare Breakdown */}
        <Section title="Fare Breakdown">
          <View style={styles.fareCard}>
            <FareRow label="Base Fare"        value={ride.baseFare} />
            <FareRow label="Distance Charge"  value={ride.distanceCharge} />
            <FareRow label="Driver Bata"      value={ride.driverBata} />
            <FareRow label="Wait Charges"     value={ride.waitFare} />
            <FareRow label="Toll"             value={ride.tollCharges} />
            <FareRow label="Parking"          value={ride.parkingCharges} />
            <FareRow label="Permit"           value={ride.permitCharges} />
            <FareRow label="Other"            value={ride.otherCharges} />
            <View style={styles.fareDivider} />
            <FareRow label="Total / Final Fare" value={ride.finalFare || ride.totalFare} bold />
            <FareRow label="Commission"       value={ride.vendorCommission} />
            <FareRow label="Driver Payout"    value={ride.driverPayout} bold />
          </View>
          <Row icon="credit-card" label="Payment Mode" value={ride.paymentMode?.replace(/_/g, ' ').toUpperCase()} />
        </Section>
      </ScrollView>
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
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1A237E' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  scroll: { padding: 16, paddingBottom: 48 },
  section: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 14,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '900', color: '#90A4AE', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowLabel: { fontSize: 13, fontWeight: '700', color: '#78909C', flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#37474F', flex: 2, textAlign: 'right' },
  fareCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 12 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  fareLabel: { fontSize: 13, color: '#78909C', fontWeight: '600' },
  fareValue: { fontSize: 13, color: '#37474F', fontWeight: '600' },
  fareBold: { fontSize: 15, fontWeight: '900', color: '#1A237E' },
  fareDivider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default RideDetailScreen;
