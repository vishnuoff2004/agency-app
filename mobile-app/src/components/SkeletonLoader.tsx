import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'detail';
  count?: number;
}

export default function SkeletonLoader({ type = 'card', count = 3 }: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return (
          <Animated.View style={[styles.listContainer, { opacity }]}>
            <View style={styles.listLine} />
            <View style={[styles.listLine, { width: '80%' }]} />
            <View style={[styles.listLine, { width: '40%' }]} />
          </Animated.View>
        );
      case 'detail':
        return (
          <Animated.View style={[styles.detailContainer, { opacity }]}>
            <View style={styles.detailHeader} />
            <View style={styles.detailCard} />
            <View style={styles.detailCard} />
          </Animated.View>
        );
      case 'card':
      default:
        return (
          <Animated.View style={[styles.card, { opacity }]}>
            <View style={styles.cardHeader} />
            <View style={styles.cardLine} />
            <View style={[styles.cardLine, { width: '60%' }]} />
            <View style={[styles.cardLine, { width: '40%' }]} />
          </Animated.View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.08)',
  },
  cardHeader: {
    height: 20,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 12,
    width: '50%',
  },
  cardLine: {
    height: 14,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 8,
    width: '90%',
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 83, 14, 0.08)',
  },
  listLine: {
    height: 14,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 8,
  },
  detailContainer: {
    padding: 16,
  },
  detailHeader: {
    height: 28,
    backgroundColor: '#cbd5e1',
    borderRadius: 6,
    marginBottom: 16,
    width: '70%',
  },
  detailCard: {
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 83, 14, 0.08)',
  },
});
