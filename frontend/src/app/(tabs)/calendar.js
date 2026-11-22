
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Screen } from '../../components/Screen';
import { Surface } from '../../components/UI';
import { colors, radius, spacing, shadow } from '../../constants/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = (number) => String(number).padStart(2, '0');

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(value) {
  return value ? new Date(value) : new Date();
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value) {
  return parseDate(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMonth(date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function createDefaultEvent(date) {
  const start = new Date(date);
  start.setHours(9, 0, 0, 0);

  const end = new Date(date);
  end.setHours(10, 0, 0, 0);

  return {
    title: '',
    description: '',
    location: '',
    start,
    end,
  };
}

export default function CalendarScreen() {
  const { token } = useAuth();

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState(createDefaultEvent(new Date()));
  const [pickerTarget, setPickerTarget] = useState(null);

  const loadEvents = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const result = await apiRequest('/api/events?limit=100', {
        token,
      });

      setEvents(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || 'Unable to load calendar events.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventDays = useMemo(
    () => new Set(events.map((event) => dateKey(parseDate(event.start_at)))),
    [events]
  );

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < mondayOffset; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [visibleMonth]);

  const selectedEvents = useMemo(() => {
    return events
      .filter((event) => dateKey(parseDate(event.start_at)) === dateKey(selectedDate))
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [events, selectedDate]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => new Date(event.end_at) >= new Date())
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
      .slice(0, 5);
  }, [events]);

  function changeMonth(direction) {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + direction, 1)
    );
  }

  function openCreateModal() {
    setEditingEvent(null);
    setForm(createDefaultEvent(selectedDate));
    setPickerTarget(null);
    setModalVisible(true);
  }

  function openEditModal(event) {
    setEditingEvent(event);
    setForm({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      start: parseDate(event.start_at),
      end: parseDate(event.end_at),
    });
    setPickerTarget(null);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setPickerTarget(null);
    setEditingEvent(null);
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePickerChange(event, value) {
    if (Platform.OS === 'android') {
      const target = pickerTarget;
      setPickerTarget(null);

      if (event.type === 'dismissed' || !value) return;

      setForm((current) => ({
        ...current,
        [target]: value,
      }));
      return;
    }

    if (value) {
      setForm((current) => ({
        ...current,
        [pickerTarget]: value,
      }));
    }
  }

  async function saveEvent() {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Please enter an event title.');
      return;
    }

    if (form.end <= form.start) {
      Alert.alert(
        'Invalid time',
        'The end time must be later than the start time.'
      );
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim() || null,
      start_at: form.start.toISOString(),
      end_at: form.end.toISOString(),
    };

    setSaving(true);

    try {
      if (editingEvent) {
        await apiRequest(`/api/events/${editingEvent.id}`, {
          token,
          method: 'PATCH',
          body: payload,
        });
      } else {
        await apiRequest('/api/events', {
          token,
          method: 'POST',
          body: payload,
        });
      }

      setSelectedDate(new Date(form.start));
      setVisibleMonth(
        new Date(form.start.getFullYear(), form.start.getMonth(), 1)
      );

      closeModal();
      await loadEvents();

      Alert.alert(
        'Saved successfully',
        editingEvent ? 'Your event has been updated.' : 'Your event has been added.'
      );
    } catch (err) {
      Alert.alert('Unable to save event', err.message);
    } finally {
      setSaving(false);
    }
  }

  function deleteEvent(event) {
    Alert.alert(
      'Delete event?',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/api/events/${event.id}`, {
                token,
                method: 'DELETE',
              });

              await loadEvents();
            } catch (err) {
              Alert.alert('Unable to delete event', err.message);
            }
          },
        },
      ]
    );
  }

  function renderEvent(event) {
    return (
      <Pressable
        key={event.id}
        style={styles.eventCard}
        onPress={() => openEditModal(event)}
      >
        <View style={styles.eventAccent} />

        <View style={styles.eventContent}>
          <Text style={styles.eventTime}>
            {formatTime(event.start_at)} – {formatTime(event.end_at)}
          </Text>

          <Text style={styles.eventTitle}>{event.title}</Text>

          {!!event.location && (
            <Text style={styles.eventMeta}>⌖ {event.location}</Text>
          )}

          {!!event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
        </View>

        <Pressable
          style={styles.deleteButton}
          onPress={() => deleteEvent(event)}
          hitSlop={10}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      </Pressable>
    );
  }

  const pickerValue =
    pickerTarget === 'start'
      ? form.start
      : pickerTarget === 'end'
        ? form.end
        : selectedDate;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>YOUR TIME, IN VIEW</Text>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>
            Bring your plans and important moments together.
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={openCreateModal}
          accessibilityRole="button"
          accessibilityLabel="Add calendar event"
        >
          <Text style={styles.addButtonText}>＋</Text>
        </Pressable>
      </View>

      <Surface style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <View>
            <Text style={styles.monthTitle}>{formatMonth(visibleMonth)}</Text>
            <Text style={styles.monthSubtitle}>Your schedule</Text>
          </View>

          <View style={styles.monthControls}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}>
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
            <Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}>
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => (
            <Text key={day} style={styles.weekday}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {calendarDays.map((date, index) => {
            if (!date) {
              return <View key={`blank-${index}`} style={styles.dayCell} />;
            }

            const selected = dateKey(date) === dateKey(selectedDate);
            const today = dateKey(date) === dateKey(new Date());
            const hasEvents = eventDays.has(dateKey(date));

            return (
              <Pressable
                key={dateKey(date)}
                onPress={() => setSelectedDate(date)}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    selected && styles.selectedDay,
                    today && !selected && styles.todayDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      selected && styles.selectedDayText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>

                <View style={styles.dayIndicator}>
                  {hasEvents && <View style={styles.eventDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.calendarFooter}>
          <Text style={styles.footerHint}>● Events scheduled</Text>
          <Pressable
            onPress={() => {
              const today = new Date();
              setSelectedDate(today);
              setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            }}
          >
            <Text style={styles.todayAction}>Today</Text>
          </Pressable>
        </View>
      </Surface>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Your schedule</Text>
          <Text style={styles.sectionSubtitle}>{formatDate(selectedDate)}</Text>
        </View>

        <Pressable onPress={openCreateModal}>
          <Text style={styles.sectionAction}>＋ Add event</Text>
        </Pressable>
      </View>

      {loading ? (
        <Surface style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>Loading your schedule...</Text>
        </Surface>
      ) : error ? (
        <Surface style={styles.stateCard}>
          <Text style={styles.stateTitle}>Couldn't load events</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={loadEvents}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </Surface>
      ) : selectedEvents.length === 0 ? (
        <Surface style={styles.stateCard}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.stateTitle}>Nothing scheduled</Text>
          <Text style={styles.stateText}>
            Your events for this day will appear here.
          </Text>
          <Pressable style={styles.emptyAddButton} onPress={openCreateModal}>
            <Text style={styles.emptyAddText}>＋ Create an event</Text>
          </Pressable>
        </Surface>
      ) : (
        <View style={styles.eventList}>
          {selectedEvents.map(renderEvent)}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Coming up</Text>
          <Text style={styles.sectionSubtitle}>Your next commitments</Text>
        </View>
      </View>

      {!loading && upcomingEvents.length === 0 ? (
        <Surface style={styles.stateCard}>
          <Text style={styles.stateTitle}>No upcoming events</Text>
          <Text style={styles.stateText}>
            Make room for the things that matter.
          </Text>
        </Surface>
      ) : (
        <View style={styles.eventList}>
          {upcomingEvents.map((event) => (
            <Pressable
              key={`upcoming-${event.id}`}
              onPress={() => {
                const date = parseDate(event.start_at);
                setSelectedDate(date);
                setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
              }}
            >
              <Surface style={styles.upcomingCard}>
                <View style={styles.upcomingDate}>
                  <Text style={styles.upcomingDay}>
                    {parseDate(event.start_at).getDate()}
                  </Text>
                  <Text style={styles.upcomingMonth}>
                    {parseDate(event.start_at).toLocaleDateString([], {
                      month: 'short',
                    })}
                  </Text>
                </View>

                <View style={styles.upcomingContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>
                    {formatTime(event.start_at)} · {formatDate(parseDate(event.start_at))}
                  </Text>
                </View>
                <Text style={styles.upcomingArrow}>›</Text>
              </Surface>
            </Pressable>
          ))}
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  {editingEvent ? 'UPDATE YOUR PLANS' : 'MAKE TIME FOR IT'}
                </Text>
                <Text style={styles.modalTitle}>
                  {editingEvent ? 'Edit event' : 'New event'}
                </Text>
              </View>

              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Event title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Project meeting"
                placeholderTextColor={colors.muted}
                value={form.title}
                onChangeText={(value) => updateForm('title', value)}
                maxLength={200}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Add details about this event..."
                placeholderTextColor={colors.muted}
                value={form.description}
                onChangeText={(value) => updateForm('description', value)}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Add a location (optional)"
                placeholderTextColor={colors.muted}
                value={form.location}
                onChangeText={(value) => updateForm('location', value)}
                maxLength={300}
              />

              <Text style={styles.inputLabel}>Date and time</Text>

              <Pressable
                style={styles.dateTimeButton}
                onPress={() => setPickerTarget('date')}
              >
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>
                  {form.start.toLocaleDateString()}
                </Text>
              </Pressable>

              <View style={styles.timeRow}>
                <Pressable
                  style={[styles.dateTimeButton, styles.timeButton]}
                  onPress={() => setPickerTarget('start')}
                >
                  <Text style={styles.dateTimeLabel}>Starts</Text>
                  <Text style={styles.dateTimeValue}>
                    {formatTime(form.start)}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.dateTimeButton, styles.timeButton]}
                  onPress={() => setPickerTarget('end')}
                >
                  <Text style={styles.dateTimeLabel}>Ends</Text>
                  <Text style={styles.dateTimeValue}>
                    {formatTime(form.end)}
                  </Text>
                </Pressable>
              </View>

              {pickerTarget && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={pickerValue}
                    mode={pickerTarget === 'date' ? 'date' : 'time'}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handlePickerChange}
                    minimumDate={
                      pickerTarget === 'date' ? new Date(2000, 0, 1) : undefined
                    }
                  />

                  {Platform.OS === 'ios' && (
                    <Pressable
                      style={styles.pickerDone}
                      onPress={() => setPickerTarget(null)}
                    >
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <Pressable
                style={[
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={saveEvent}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingEvent ? 'Save changes' : 'Create event'}
                  </Text>
                )}
              </Pressable>

              {editingEvent && (
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => deleteEvent(editingEvent)}
                >
                  <Text style={styles.cancelButtonText}>Delete event</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  headerText: { flex: 1, paddingRight: 10 },
  eyebrow: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 7,
  },
  subtitle: {
    color: colors.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 27, fontWeight: '400' },
  calendarCard: { marginBottom: 28, padding: 18 },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  monthTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  monthSubtitle: { color: colors.secondary, fontSize: 12, marginTop: 4 },
  monthControls: { flexDirection: 'row', gap: 8 },
  monthArrow: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: { color: colors.ink, fontSize: 25, lineHeight: 29 },
  weekdayRow: { flexDirection: 'row', marginBottom: 10 },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: { backgroundColor: colors.primary },
  todayDay: { borderWidth: 1.5, borderColor: colors.primary },
  dayNumber: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  selectedDayText: { color: '#FFFFFF', fontWeight: '800' },
  dayIndicator: { height: 5, justifyContent: 'center' },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  calendarFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
    paddingTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerHint: { color: colors.secondary, fontSize: 11 },
  todayAction: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
    marginTop: 3,
  },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: colors.secondary, fontSize: 11, marginTop: 4 },
  sectionAction: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  stateCard: { alignItems: 'center', paddingVertical: 28, marginBottom: 25 },
  stateTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  stateText: {
    color: colors.secondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
    paddingHorizontal: 12,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '800',
    marginTop: 15,
  },
  emptyIcon: { fontSize: 27, color: colors.primary, marginBottom: 9 },
  emptyAddButton: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: 17,
  },
  emptyAddText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 },
  eventList: { gap: 10, marginBottom: 24 },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadow.card,
  },
  eventAccent: { width: 4, backgroundColor: colors.primary },
  eventContent: { flex: 1, padding: 15 },
  eventTime: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  eventTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  eventMeta: { color: colors.secondary, fontSize: 11, marginTop: 6 },
  eventDescription: {
    color: colors.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  deleteButton: {
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  deleteText: { color: colors.danger, fontSize: 24 },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    padding: 13,
  },
  upcomingDate: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingDay: { color: colors.primaryDark, fontSize: 18, fontWeight: '800' },
  upcomingMonth: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '700',
  },
  upcomingContent: { flex: 1, marginLeft: 13 },
  upcomingArrow: { color: colors.secondary, fontSize: 25 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 22, 39, 0.48)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 23,
    paddingBottom: 28,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  modalEyebrow: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { color: colors.ink, fontSize: 25 },
  inputLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 13,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.ink,
    fontSize: 13,
  },
  multilineInput: { minHeight: 85, textAlignVertical: 'top' },
  dateTimeButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    padding: 14,
    marginBottom: 9,
  },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeButton: { flex: 1 },
  dateTimeLabel: { color: colors.secondary, fontSize: 10, fontWeight: '700' },
  dateTimeValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    marginTop: 8,
    alignItems: 'center',
    padding: 10,
  },
  pickerDone: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  pickerDoneText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  cancelButton: { alignItems: 'center', padding: 14, marginTop: 7 },
  cancelButtonText: { color: colors.danger, fontSize: 13, fontWeight: '800' },
});
