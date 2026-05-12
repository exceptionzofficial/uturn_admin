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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import adminApi from '../api/adminApi';
import apiClient from '../api/apiClient';

const ManageVendorsScreen = ({ navigation }) => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getVendors();
      const managed = data.filter(v => {
        const s = v.status?.toUpperCase();
        return s === 'APPROVED' || s === 'REJECTED' || s === 'VERIFIED';
      });
      setVendors(managed);
      setFilteredVendors(managed);
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 401) {
        Alert.alert('Error', 'Failed to fetch vendors.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const filtered = vendors.filter(v => 
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vendorId?.includes(searchQuery)
    );
    setFilteredVendors(filtered);
  }, [searchQuery, vendors]);

  const handleEditPress = (vendor) => {
    setEditingVendor({ ...vendor });
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editingVendor.name || !editingVendor.vendorId) {
      Alert.alert('Validation', 'Name and Phone Number are required.');
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await apiClient.post('/admin/update-vendor', editingVendor);
      if (response.data.success) {
        Alert.alert('Success', 'Vendor details updated successfully.');
        setEditModalVisible(false);
        fetchVendors();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update vendor.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const renderVendorCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.profilePicture || 'https://via.placeholder.com/150' }} 
          style={styles.profilePhoto} 
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.businessName}>{item.businessName || 'No Business Name'}</Text>
          <View style={[styles.statusBadge, item.status === 'APPROVED' ? styles.statusApproved : item.status === 'REJECTED' ? styles.statusRejected : styles.statusPending]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editIconBtn} onPress={() => handleEditPress(item)}>
          <Icon name="edit-3" size={20} color="#1A237E" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Icon name="phone" size={14} color="#666" />
          <Text style={styles.detailText}>ID / Phone: {item.vendorId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="briefcase" size={14} color="#666" />
          <Text style={styles.detailText}>GST: {item.gstNumber || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="map-pin" size={14} color="#666" />
          <Text style={styles.detailText}>{item.address || 'No Address'}</Text>
        </View>
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
          <Text style={styles.headerTitle}>Manage Vendors</Text>
        </View>
        <TouchableOpacity onPress={fetchVendors} style={styles.refreshBtn}>
          <Icon name="refresh-cw" size={20} color="#1A237E" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, business or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A237E" />
        </View>
      ) : filteredVendors.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="shopping-bag" size={50} color="#E0E0E0" />
          <Text style={styles.emptyText}>No vendors found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVendors}
          renderItem={renderVendorCard}
          keyExtractor={item => item.vendorId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Vendor Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Vendor Name</Text>
              <TextInput
                style={styles.input}
                value={editingVendor?.name}
                onChangeText={(text) => setEditingVendor({ ...editingVendor, name: text })}
              />

              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.input}
                value={editingVendor?.businessName}
                onChangeText={(text) => setEditingVendor({ ...editingVendor, businessName: text })}
              />

              <Text style={styles.inputLabel}>GST Number</Text>
              <TextInput
                style={styles.input}
                value={editingVendor?.gstNumber}
                onChangeText={(text) => setEditingVendor({ ...editingVendor, gstNumber: text })}
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={editingVendor?.address}
                multiline={true}
                numberOfLines={3}
                onChangeText={(text) => setEditingVendor({ ...editingVendor, address: text })}
              />

              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={editingVendor?.state}
                onChangeText={(text) => setEditingVendor({ ...editingVendor, state: text })}
              />

              <Text style={styles.inputLabel}>Account Status</Text>
              <View style={styles.statusSelectors}>
                {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusSelectBtn,
                      editingVendor?.status === s && styles.statusSelectBtnActive,
                      editingVendor?.status === s && s === 'APPROVED' && { backgroundColor: '#4CAF50' },
                      editingVendor?.status === s && s === 'REJECTED' && { backgroundColor: '#F44336' },
                    ]}
                    onPress={() => setEditingVendor({ ...editingVendor, status: s })}
                  >
                    <Text style={[styles.statusSelectText, editingVendor?.status === s && { color: '#FFF' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={{ height: 20 }} />
            </ScrollView>

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleUpdate}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    margin: 15, paddingHorizontal: 15, borderRadius: 12, elevation: 2, height: 50,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#333' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 15, paddingBottom: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  profilePhoto: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0F0F0' },
  headerInfo: { marginLeft: 15, flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: '#333' },
  businessName: { fontSize: 13, color: '#1A237E', marginTop: 2, fontWeight: '700', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
  statusApproved: { backgroundColor: '#E8F5E9' },
  statusRejected: { backgroundColor: '#FFEBEE' },
  statusPending: { backgroundColor: '#FFF9C4' },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  editIconBtn: { padding: 8, backgroundColor: '#F0F2FF', borderRadius: 10 },
  detailsBox: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, marginTop: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailText: { fontSize: 12, color: '#555', marginLeft: 10, fontWeight: '600' },
  emptyText: { marginTop: 15, fontSize: 16, color: '#999', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '85%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1A237E' },
  modalForm: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#666', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F5F6F8', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#EEE' },
  saveBtn: { backgroundColor: '#1A237E', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  statusSelectors: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  statusSelectBtn: { flex: 1, height: 45, backgroundColor: '#F0F2FF', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#DDD' },
  statusSelectBtnActive: { backgroundColor: '#1A237E', borderColor: 'transparent' },
  statusSelectText: { fontSize: 10, fontWeight: '900', color: '#666' },
});

export default ManageVendorsScreen;
