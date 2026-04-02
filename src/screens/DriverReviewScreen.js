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
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import apiClient from '../api/apiClient';

const DriverReviewScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchPendingDrivers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/pending-drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch pending applications.');
    } finally {
      setLoading(false);
    }
  };

  const renderDocThumbnail = (label, url) => {
    if (!url) return null;
    return (
      <TouchableOpacity 
        style={styles.docThumbnailContainer} 
        onPress={() => setSelectedImage({ label, url })}
      >
        <Image source={{ uri: url }} style={styles.docThumbnail} />
        <Text style={styles.docLabel}>{label}</Text>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const handleStatusUpdate = async (driverId, newStatus) => {
    try {
      const response = await apiClient.post('/admin/update-status', { driverId, status: newStatus });
      if (response.data.success) {
        Alert.alert('Success', `Driver application ${newStatus.toLowerCase()} successfully.`);
        setDrivers(prev => prev.filter(d => d.driverId !== driverId));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Update failed.');
    }
  };

  const renderDriverCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.profilePhoto || 'https://via.placeholder.com/150' }} 
          style={styles.profilePhoto} 
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>+91 {item.phone}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Icon name="credit-card" size={16} color="#666" />
          <Text style={styles.detailText}>Aadhaar: {item.aadhar}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="truck" size={16} color="#666" />
          <Text style={styles.detailText}>Vehicle: {item.vehicleNumber} ({item.vehicleType})</Text>
        </View>
        <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color="#666" />
            <Text style={styles.detailText}>Applied: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.docsSection}>
        <Text style={styles.sectionTitle}>Verification Documents</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docsList}>
          {renderDocThumbnail('Aadhaar Front', item.aadhaarFront)}
          {renderDocThumbnail('DL Front', item.dlFront)}
          {renderDocThumbnail('DL Back', item.dlBack)}
          {renderDocThumbnail('RC', item.rcFront)}
          {renderDocThumbnail('Insurance', item.insuranceFront)}
          {renderDocThumbnail('FC', item.fcFront)}
          {renderDocThumbnail('Permit', item.permitFront)}
        </ScrollView>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.btn, styles.rejectBtn]} 
          onPress={() => handleStatusUpdate(item.driverId, 'REJECTED')}
        >
          <Icon name="x-circle" size={18} color="#FFF" />
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btn, styles.approveBtn]} 
          onPress={() => handleStatusUpdate(item.driverId, 'APPROVED')}
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
        <Text style={styles.headerTitle}>Driver Review Portal</Text>
        <TouchableOpacity onPress={fetchPendingDrivers} style={styles.refreshBtn}>
          <Icon name="refresh-cw" size={20} color="#1A237E" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A237E" />
        </View>
      ) : drivers.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="check-circle" size={50} color="#E0E0E0" />
          <Text style={styles.emptyText}>No pending applications</Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          renderItem={renderDriverCard}
          keyExtractor={item => item.driverId}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A237E',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F2FF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  headerInfo: {
    marginLeft: 20,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F9A825',
    textTransform: 'uppercase',
  },
  detailsBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#444',
    marginLeft: 10,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  btn: {
    flex: 0.48,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#43A047',
  },
  rejectBtn: {
    backgroundColor: '#E53935',
  },
  btnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  docsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 12,
  },
  docsList: {
    flexDirection: 'row',
  },
  docThumbnailContainer: {
    marginRight: 15,
    alignItems: 'center',
  },
  docThumbnail: {
    width: 100,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  docLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A237E',
  },
  fullscreenImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
});

export default DriverReviewScreen;
