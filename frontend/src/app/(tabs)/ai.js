
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { aiApi } from '../../services/api';
import { colors, radius, spacing } from '../../constants/theme';

const suggestions = [
  'Summarize my recent notes',
  'What should I focus on today?',
  'Find an idea I saved',
];

export default function AIScreen() {
  const { token } = useAuth();

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const sendQuestion = async (text = question) => {
    const cleanQuestion = text.trim();

    if (!cleanQuestion || loading) return;

    if (!token) {
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now().toString(),
          role: 'assistant',
          text: 'Please log in again to use Ask BrainCache.',
          sources: [],
        },
      ]);
      return;
    }

    setQuestion('');

    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        text: cleanQuestion,
        sources: [],
      },
    ]);

    setLoading(true);

    try {
      const response = await aiApi.ask(token, cleanQuestion);

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: response.answer,
          sources: response.sources || [],
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: error.message || 'Something went wrong. Please try again.',
          sources: [],
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.sparkle}>✧</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>YOUR PERSONAL KNOWLEDGE COMPANION</Text>
            <Text style={styles.title}>Ask BrainCache</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>
                A little more clarity, one question at a time.
              </Text>

              <Text style={styles.welcomeDescription}>
                Ask questions about your saved knowledge. BrainCache AI will
                search your relevant notes and use them to prepare an answer.
              </Text>

              <Text style={styles.suggestionHeading}>TRY ASKING</Text>

              {suggestions.map((item) => (
                <Pressable
                  key={item}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => sendQuestion(item)}
                  disabled={loading}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                  <Text style={styles.arrow}>↗</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.role === 'user'
                    ? styles.userRow
                    : styles.assistantRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user'
                      ? styles.userBubble
                      : styles.assistantBubble,
                    message.isError && styles.errorBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user' && styles.userMessageText,
                      message.isError && styles.errorText,
                    ]}
                  >
                    {message.text}
                  </Text>

                  {message.sources?.length > 0 && (
                    <View style={styles.sources}>
                      <Text style={styles.sourceHeading}>
                        SOURCES FROM YOUR NOTES
                      </Text>

                      {message.sources.map((source, index) => (
                        <Text
                          key={`${source.note_id}-${index}`}
                          style={styles.sourceText}
                        >
                          • {source.title}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>
                BrainCache is thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask a question about your notes..."
            placeholderTextColor={colors.muted}
            value={question}
            onChangeText={setQuestion}
            multiline
            maxLength={1000}
            editable={!loading}
            textAlignVertical="center"
            returnKeyType="send"
          />

          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!question.trim() || loading) && styles.sendDisabled,
              pressed && styles.pressed,
            ]}
            onPress={() => sendQuestion()}
            disabled={!question.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Send question"
          >
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          AI responses can make mistakes. Check important details against your
          sources.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sparkle: {
    fontSize: 28,
    color: colors.primary,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.muted,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 3,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  welcome: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  welcomeTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 29,
    marginBottom: spacing.sm,
  },
  welcomeDescription: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  suggestionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  suggestion: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  messageRow: {
    width: '100%',
    marginBottom: spacing.md,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  errorBubble: {
    backgroundColor: colors.danger,
  },
  messageText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FFFFFF',
  },
  sources: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  sourceHeading: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: spacing.xs,
  },
  sourceText: {
    color: colors.secondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.muted,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 100,
    color: colors.ink,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '600',
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
});
