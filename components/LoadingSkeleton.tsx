import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface JobCardSkeletonProps {
  style?: any;
}

export const JobCardSkeleton: React.FC<JobCardSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={80} height={24} style={styles.matchIndicator} />
      </View>

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Skeleton width={100} height={18} />
          <Skeleton width={80} height={16} />
        </View>

        <Skeleton width="90%" height={24} style={styles.title} />
        <Skeleton width="100%" height={16} style={styles.description} />
        <Skeleton width="60%" height={16} style={styles.description} />
        <Skeleton width={120} height={16} style={styles.salary} />

        <View style={styles.reasons}>
          <Skeleton width={140} height={14} />
          <Skeleton width="80%" height={12} style={styles.reasonText} />
          <Skeleton width="60%" height={12} style={styles.reasonText} />
        </View>

        <View style={styles.footer}>
          <View style={styles.skillsContainer}>
            <Skeleton width={60} height={24} borderRadius={12} />
            <Skeleton width={70} height={24} borderRadius={12} />
            <Skeleton width={50} height={24} borderRadius={12} />
          </View>
          <Skeleton width={80} height={32} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E5E5',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  matchIndicator: {
    alignSelf: 'flex-end',
  },
  content: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    marginBottom: 8,
  },
  salary: {
    marginBottom: 16,
  },
  reasons: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  reasonText: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  skillsContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
});