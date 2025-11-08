import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
  searchQuery: string;
  onTextChange: (text: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onTextChange,
  placeholder = "Search posts...",
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={onTextChange}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});

export default SearchBar;