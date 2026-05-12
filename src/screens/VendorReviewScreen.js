import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import adminApi from '../api/adminApi';
import apiClient from '../api/apiClient';

const BASE_URL = 'https://uturn-nl7u.onrender.com';

const VendorReviewScreen = ({ navigation }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const fetchPendingVendors = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getVendors();
      setVendors(data.filter(v => {
        const s = v.status?.toUpperCase();
        return s === 'PENDING_REVIEW' || s === 'PENDING' || !v.status;
      }));
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 401) {
        Alert.alert('Error', 'Failed to fetch pending applications.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderDocThumbnail = (label, url) => {
    if (!url) return null;
    const fullUrl = getFullUrl(url);
    return (
      <TouchableOpacity 
        style={styles.docThumbnailContainer} 
        onPress={() => setSelectedImage({ label, url: fullUrl })}
      >
        <Image source={{ uri: fullUrl }} style={styles.docThumbnail} />
        <Text style={styles.docLabel}>{label}</Text>
        <Text style={{ fontSize: 6, color: '#999' }} numberOfLines={1}>{fullUrl}</Text>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const handleStatusUpdate = async (vendorId, newStatus) => {
    try {
      const response = await adminApi.verifyVendor(vendorId, newStatus === 'APPROVED', '');
      if (response.success) {
        Alert.alert('Success', `Vendor application ${newStatus.toLowerCase()} successfully.`);
        setVendors(prev => prev.filter(v => v.vendorId !== vendorId && v.id !== vendorId));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Update failed.');
    }
  };

  const handleEditPress = (vendor) => {
    setEditingVendor({ ...vendor });
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editingVendor.name || !editingVendor.vendorId) {
      Alert.alert('Validation', 'Name and Phone are required.');
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await apiClient.post('/admin/update-vendor', editingVendor);
      if (response.data.success) {
        Alert.alert('Success', 'Vendor details updated.');
        setEditModalVisible(false);
        fetchPendingVendors();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Update failed.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const [verifiedFields, setVerifiedFields] = useState({});

  const toggleVerified = (vendorId, field) => {
    setVerifiedFields(prev => {
      const vendorFields = prev[vendorId] || { aadhaar: false, business: false };
      return {
        ...prev,
        [vendorId]: { ...vendorFields, [field]: !vendorFields[field] }
      };
    });
  };

  const isFullyVerified = (vendorId) => {
    const fields = verifiedFields[vendorId];
    return fields && fields.aadhaar && fields.business;
  };

  const renderVendorCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.profilePicture || 'https://via.placeholder.com/150' }} 
          style={styles.profilePhoto} 
        />
        <View style={styles.headerInfo}>
          <View style={styles.headerTop}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.phone}>+91 {item.vendorId}</Text>
          <Text style={styles.businessName}>{item.businessName || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEditPress(item)}>
          <Icon name="edit-2" size={20} color="#1A237E" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Icon name="briefcase" size={16} color="#666" />
          <Text style={styles.detailText}>GST: {item.gstNumber || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="map-pin" size={16} color="#666" />
          <Text style={styles.detailText}>{item.address}, {item.state}</Text>
        </View>
        <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color="#666" />
            <Text style={styles.detailText}>Applied: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.docsSection}>
        <Text style={styles.sectionTitle}>Business Documents</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docsList}>
          {renderDocThumbnail('Aadhaar Copy', item.aadharImage)}
          {renderDocThumbnail('Profile/Store Photo', item.profilePicture)}
        </ScrollView>
      </View>

      <View style={styles.verificationChecklist}>
        <Text style={styles.checklistTitle}>Mandatory Verification</Text>
        <View style={styles.checklistRow}>
          <TouchableOpacity 
            style={[styles.checkItem, verifiedFields[item.vendorId]?.aadhaar && styles.checkItemActive]} 
            onPress={() => toggleVerified(item.vendorId, 'aadhaar')}
          >
            <Icon name={verifiedFields[item.vendorId]?.aadhaar ? "check-square" : "square"} size={16} color={verifiedFields[item.vendorId]?.aadhaar ? "#43A047" : "#666"} />
            <Text style={styles.checkText}>Aadhaar Verified</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.checkItem, verifiedFields[item.vendorId]?.business && styles.checkItemActive]} 
            onPress={() => toggleVerified(item.vendorId, 'business')}
          >
            <Icon name={verifiedFields[item.vendorId]?.business ? "check-square" : "square"} size={16} color={verifiedFields[item.vendorId]?.business ? "#43A047" : "#666"} />
            <Text style={styles.checkText}>Business Docs Verified</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.btn, styles.rejectBtn]} 
          onPress={() => handleStatusUpdate(item.vendorId, 'REJECTED')}
        >
          <Icon name="trash-2" size={18} color="#FFF" />
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btn, styles.approveBtn, !isFullyVerified(item.vendorId) && styles.btnDisabled]} 
          onPress={() => handleStatusUpdate(item.vendorId, 'APPROVED')}
          disabled={!isFullyVerified(item.vendorId)}
        >
          <Icon name="check-circle" size={18} color="#FFF" />
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#1A237E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendor Review</Text>
        </View>
        <TouchableOpacity onPress={fetchPendingVendors} style={styles.refreshBtn}>
          <Icon name="refresh-cw" size={20} color="#1A237E" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A237E" />
        </View>
      ) : vendors.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="shopping-bag" size={50} color="#E0E0E0" />
          <Text style={styles.emptyText}>No pending vendors</Text>
        </View>
      ) : (
        <FlatList
          data={vendors}
          renderItem={renderVendorCard}
          keyExtractor={item => item.vendorId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Image Viewer Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            activeOpacity={1} 
            onPress={() => setSelectedImage(null)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>{selectedImage?.label}</Text>
              <TouchableOpacity onPress={() => setSelectedImage(null)}>
                <Icon name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Image 
              source={{ uri: selectedImage?.url }} 
              style={styles.fullscreenImage} 
              resizeMode="contain" 
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  header: {
    padding: 15, backgroundColor: '#FFF', flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', elevation: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A237E' },
  refreshBtn: { padding: 8, borderRadius: 8, backgroundColor: '#F0F2FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 15 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 20, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  profilePhoto: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0F0F0' },
  headerInfo: { marginLeft: 15, flex: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: '#333' },
  phone: { fontSize: 13, color: '#666', fontWeight: '600' },
  businessName: { fontSize: 12, color: '#1A237E', fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
  statusBadge: { backgroundColor: '#FFF9C4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 9, fontWeight: '900', color: '#F9A825', textTransform: 'uppercase' },
  detailsBox: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, marginTop: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailText: { fontSize: 12, color: '#444', marginLeft: 10, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  btn: { flex: 0.48, height: 44, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  approveBtn: { backgroundColor: '#43A047' },
  rejectBtn: { backgroundColor: '#E53935' },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: '800', marginLeft: 8 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#999', fontWeight: '600' },
  docsSection: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#1A237E', marginBottom: 10 },
  docsList: { flexDirection: 'row' },
  docThumbnailContainer: { marginRight: 12, alignItems: 'center' },
  docThumbnail: { width: 90, height: 65, borderRadius: 6, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  docLabel: { fontSize: 9, fontWeight: '700', color: '#666', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalCloseArea: { ...StyleSheet.absoluteFillObject },
  modalContent: { width: '90%', height: '80%', backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalHeaderText: { fontSize: 16, fontWeight: '800', color: '#1A237E' },
  fullscreenImage: { flex: 1, width: '100%', backgroundColor: '#000' },
  btnDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  verificationChecklist: {
    marginTop: 15,
    backgroundColor: '#F0F7F0',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0EBE0',
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2E7D32',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checklistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  checkItemActive: {
    borderColor: '#43A047',
    backgroundColor: '#F1F8F1',
  },
  checkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#444',
    marginLeft: 5,
  },
});

export default VendorReviewScreen;
