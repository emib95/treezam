import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import api, { getImageUrl } from '../services/api';

export default function TreeDetailScreen({ route }) {
  const { treeId } = route.params;
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    try {
      const response = await api.get(`/trees/${treeId}`);
      setTree(response.data.tree);
    } catch (error) {
      console.error('Error loading tree:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!tree) {
    return (
      <View style={styles.centerContainer}>
        <Text>Tree not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Bug 3 Fix: Use dynamic image URL instead of hardcoded localhost */}
      <Image
        source={{ uri: getImageUrl(tree.imageUrl) }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.species}>{tree.species}</Text>
        <Text style={styles.scientificName}>{tree.scientificName}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identification Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confidence:</Text>
            <Text style={styles.detailValue}>
              {(tree.confidence * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Identified:</Text>
            <Text style={styles.detailValue}>
              {new Date(tree.identifiedAt).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {tree.address && (
            <Text style={styles.locationText}>📍 {tree.address}</Text>
          )}
          {tree.city && (
            <Text style={styles.locationText}>🏙️ {tree.city}</Text>
          )}
          {tree.country && (
            <Text style={styles.locationText}>🌍 {tree.country}</Text>
          )}
        </View>
      </View>
    </ScrollView>
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
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  species: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  scientificName: {
    fontSize: 20,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
});
