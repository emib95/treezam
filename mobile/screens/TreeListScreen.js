import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import api, { getImageUrl } from '../services/api';
import { useNavigation } from '@react-navigation/native';

export default function TreeListScreen() {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadTrees();
  }, []);

  const loadTrees = async () => {
    try {
      const response = await api.get('/trees/my-trees');
      setTrees(response.data.trees);
    } catch (error) {
      console.error('Error loading trees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrees();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTree = ({ item }) => (
    <TouchableOpacity
      style={styles.treeCard}
      onPress={() => navigation.navigate('TreeDetail', { treeId: item._id })}
    >
      {/* Bug 3 Fix: Use dynamic image URL instead of hardcoded localhost */}
      <Image
        source={{ uri: getImageUrl(item.imageUrl) }}
        style={styles.treeImage}
      />
      <View style={styles.treeInfo}>
        <Text style={styles.species}>{item.species}</Text>
        <Text style={styles.scientificName}>{item.scientificName}</Text>
        <Text style={styles.location}>
          📍 {item.city || item.address || 'Unknown location'}
        </Text>
        <Text style={styles.date}>{formatDate(item.identifiedAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Trees ({trees.length})</Text>
      <FlatList
        data={trees}
        renderItem={renderTree}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No trees identified yet</Text>
            <Text style={styles.emptySubtext}>
              Start identifying trees using the camera!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    padding: 20,
    paddingBottom: 10,
  },
  treeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  treeImage: {
    width: 100,
    height: 100,
  },
  treeInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  species: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  scientificName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  location: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
  },
});
