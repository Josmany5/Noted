import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { BubbleType } from '../types/bubble';
import { BUBBLE_TYPE_INFO } from '../data/sampleBubbles';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';

interface CreateBubbleModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateBubble: (bubble: {
    type: BubbleType;
    title: string;
    emoji: string;
    content: string;
    color: string;
    urgency?: 'none' | 'low' | 'medium' | 'high';
    importance?: 1 | 2 | 3 | 4 | 5;
  }) => void;
  existingBubble?: any; // For edit mode
}

export const CreateBubbleModal: React.FC<CreateBubbleModalProps> = ({
  visible,
  onClose,
  onCreateBubble,
  existingBubble,
}) => {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<BubbleType>('note');
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [content, setContent] = useState('');
  const [urgency, setUrgency] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined);

  const bubbleTypes: BubbleType[] = [
    'note',
    'task',
    'project',
    'goal',
    'journal',
    'library',
    'ideas',
    'document',
    'workout',
    'budget',
  ];

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your bubble');
      return;
    }

    const typeInfo = BUBBLE_TYPE_INFO[selectedType];
    onCreateBubble({
      type: selectedType,
      title: title.trim(),
      emoji: emoji || typeInfo.emoji,
      content: content.trim(),
      color: typeInfo.color,
      urgency: urgency,
      importance: importance,
    });

    // Reset form
    setTitle('');
    setEmoji('📝');
    setContent('');
    setSelectedType('note');
    setUrgency('none');
    setImportance(undefined);
  };

  const handleTypeSelect = (type: BubbleType) => {
    setSelectedType(type);
    const typeInfo = BUBBLE_TYPE_INFO[type];
    setEmoji(typeInfo.emoji);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              ➕ Create New Bubble
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Bubble Type Selection */}
            <Text style={[styles.label, { color: colors.text }]}>Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeScroll}
              contentContainerStyle={styles.typeScrollContent}
            >
              {bubbleTypes.map((type) => {
                const typeInfo = BUBBLE_TYPE_INFO[type];
                const isSelected = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: isSelected ? typeInfo.color : colors.surfaceVariant,
                        borderColor: typeInfo.color,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleTypeSelect(type)}
                  >
                    <Text style={styles.typeEmoji}>{typeInfo.emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {typeInfo.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Emoji Input */}
            <Text style={[styles.label, { color: colors.text }]}>Emoji</Text>
            <TextInput
              style={[
                styles.emojiInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={emoji}
              onChangeText={setEmoji}
              placeholder="📝"
              placeholderTextColor={colors.textSecondary}
              maxLength={2}
            />

            {/* Title Input */}
            <Text style={[styles.label, { color: colors.text }]}>
              Title <Text style={{ color: '#FF3B30' }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter bubble title..."
              placeholderTextColor={colors.textSecondary}
            />

            {/* Content Input */}
            <Text style={[styles.label, { color: colors.text }]}>Content</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={content}
              onChangeText={setContent}
              placeholder="Enter content or description..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Urgency Selector */}
            <Text style={[styles.label, { color: colors.text }]}>Urgency</Text>
            <View style={styles.pillGroup}>
              {(['none', 'low', 'medium', 'high'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: urgency === level ? '#007AFF' : colors.surfaceVariant,
                      borderColor: urgency === level ? '#007AFF' : colors.border,
                    },
                  ]}
                  onPress={() => setUrgency(level)}
                >
                  <Text style={[styles.pillText, { color: urgency === level ? '#FFF' : colors.text }]}>
                    {level === 'none' && 'None'}
                    {level === 'low' && '🟢 Low'}
                    {level === 'medium' && '🟡 Medium'}
                    {level === 'high' && '🔴 High'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Importance Selector */}
            <Text style={[styles.label, { color: colors.text }]}>Importance</Text>
            <View style={styles.pillGroup}>
              <TouchableOpacity
                style={[
                  styles.pill,
                  {
                    backgroundColor: importance === undefined ? '#007AFF' : colors.surfaceVariant,
                    borderColor: importance === undefined ? '#007AFF' : colors.border,
                  },
                ]}
                onPress={() => setImportance(undefined)}
              >
                <Text style={[styles.pillText, { color: importance === undefined ? '#FFF' : colors.text }]}>
                  None
                </Text>
              </TouchableOpacity>
              {([1, 2, 3, 4, 5] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: importance === level ? '#007AFF' : colors.surfaceVariant,
                      borderColor: importance === level ? '#007AFF' : colors.border,
                    },
                  ]}
                  onPress={() => setImportance(level)}
                >
                  <Text style={[styles.pillText, { color: importance === level ? '#FFF' : colors.text }]}>
                    {'⭐'.repeat(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.createButton,
                { backgroundColor: BUBBLE_TYPE_INFO[selectedType].color },
              ]}
              onPress={handleCreate}
            >
              <Text style={styles.createButtonText}>Create Bubble</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.title,
  },
  closeButton: {
    ...FONTS.bold,
    fontSize: 24,
    paddingHorizontal: SPACING.sm,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  label: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  typeScroll: {
    marginBottom: SPACING.sm,
  },
  typeScrollContent: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  typeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.tiny,
  },
  emojiInput: {
    ...FONTS.regular,
    fontSize: 32,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  input: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  textArea: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    minHeight: 100,
    marginBottom: SPACING.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  createButton: {},
  createButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
});
