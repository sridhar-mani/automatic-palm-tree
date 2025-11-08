import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

interface InfiniteScrollListProps {
  config: {
    serviceCall: (params: { page: number; itemsPerPage: number; refresh: boolean; searchQuery?: string }) => Promise<any[]>;
    itemsPerPage: number;
    searchQuery?: string;
    searchFields?: string[];
    transform?: (data: any) => any[];
  };
  renderItem: (item: any, index: number) => React.ReactElement;
  keyExtractor: (item: any, index: number) => string;
  ItemSeparatorComponent?: () => React.ReactElement;
  ListEmptyComponent?: React.ComponentType<any>;
  ListFooterComponent?: React.ComponentType<any>;
  onEndReachedThreshold?: number;
}

export const InfiniteScrollList: React.FC<InfiniteScrollListProps> = ({
  config,
  renderItem,
  keyExtractor,
  ItemSeparatorComponent,
  ListEmptyComponent,
  ListFooterComponent,
  onEndReachedThreshold = 0.5,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (pageNum: number, refresh: boolean = false) => {
    if (loading || (!hasMore && !refresh)) return;

    setLoading(true);
    try {
      const result = await config.serviceCall({
        page: pageNum,
        itemsPerPage: config.itemsPerPage,
        refresh,
        searchQuery: config.searchQuery,
      });

      const transformedData = config.transform ? config.transform(result) : result;

      if (refresh) {
        setData(transformedData);
        setPage(1);
      } else {
        setData(prev => [...prev, ...transformedData]);
      }

      setHasMore(transformedData.length === config.itemsPerPage);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [config, loading, hasMore]);

  useEffect(() => {
    // Reset and fetch when search query changes
    const timer = setTimeout(() => {
      setData([]);
      setPage(1);
      setHasMore(true);
      fetchData(1, true);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [config.searchQuery, fetchData]);

  useEffect(() => {
    // Initial load
    fetchData(1, true);
  }, [fetchData]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  }, [hasMore, loading, page, fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setData([]);
    setPage(1);
    setHasMore(true);
    fetchData(1, true);
  }, [fetchData]);

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent || renderFooter}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      windowSize={10}
      maxToRenderPerBatch={5}
      removeClippedSubviews={true}
    />
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});