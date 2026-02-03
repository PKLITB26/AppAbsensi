import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarEvent {
  id: number;
  date: string;
  title: string;
  type: 'birthday' | 'holiday' | 'event';
  data?: any;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDatePress?: (date: Date, events: CalendarEvent[]) => void;
  weekendDays?: number[];
  showWeekends?: boolean;
}

export default function CustomCalendar({ 
  events = [], 
  onDatePress,
  weekendDays = [0, 6],
  showWeekends = true 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isWeekend = (date: Date | null) => {
    if (!date || !showWeekends) return false;
    return weekendDays.includes(date.getDay());
  };

  const getDateEvents = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const handleDatePress = (date: Date | null) => {
    if (!date) return;
    const dateEvents = getDateEvents(date);
    if (onDatePress) {
      onDatePress(date, dateEvents);
    } else if (dateEvents.length > 0) {
      const eventList = dateEvents.map(e => `• ${e.title}`).join('\n');
      Alert.alert(
        `${date.getDate()} ${date.toLocaleDateString('id-ID', { month: 'long' })}`,
        eventList,
        [{ text: 'Tutup', style: 'cancel' }]
      );
    }
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getEventTypeStyle = (events: CalendarEvent[]) => {
    if (events.length === 0) return {};
    const hasHoliday = events.some(e => e.type === 'holiday');
    const hasBirthday = events.some(e => e.type === 'birthday');
    const hasEvent = events.some(e => e.type === 'event');

    if (hasHoliday) return { backgroundColor: '#FFEBEE', borderColor: '#FFD6D6' };
    if (hasBirthday) return { backgroundColor: '#E8F5E8', borderColor: '#C8E6C9' };
    if (hasEvent) return { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' };
    return {};
  };

  const getEventTextStyle = (events: CalendarEvent[]) => {
    if (events.length === 0) return {};
    const hasHoliday = events.some(e => e.type === 'holiday');
    const hasBirthday = events.some(e => e.type === 'birthday');
    const hasEvent = events.some(e => e.type === 'event');

    if (hasHoliday) return { color: '#E53E3E', fontWeight: '600' };
    if (hasBirthday) return { color: '#4CAF50', fontWeight: '600' };
    if (hasEvent) return { color: '#2196F3', fontWeight: '600' };
    return {};
  };

  const getDotColor = (events: CalendarEvent[]) => {
    if (events.length === 0) return null;
    const hasHoliday = events.some(e => e.type === 'holiday');
    const hasBirthday = events.some(e => e.type === 'birthday');
    const hasEvent = events.some(e => e.type === 'event');

    if (hasHoliday) return '#E53E3E';
    if (hasBirthday) return '#4CAF50';
    if (hasEvent) return '#2196F3';
    return '#666';
  };

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
          <Ionicons name="chevron-back" size={24} color="#004643" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthName}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
          <Ionicons name="chevron-forward" size={24} color="#004643" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, i) => (
          <Text key={i} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((date, index) => {
          const isWE = isWeekend(date);
          const dateEvents = getDateEvents(date);
          const hasEvents = dateEvents.length > 0;
          const isToday = date && date.toDateString() === new Date().toDateString();
          const eventStyle = getEventTypeStyle(dateEvents);
          const eventTextStyle = getEventTextStyle(dateEvents);
          const dotColor = getDotColor(dateEvents);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !date && styles.emptyCell,
                isWE && styles.weekendCell,
                hasEvents && { ...eventStyle, borderWidth: 1 },
                isToday && styles.todayCell
              ]}
              onPress={() => handleDatePress(date)}
              disabled={!date}
            >
              {date && (
                <Text style={[
                  styles.dayText,
                  isWE && styles.weekendText,
                  hasEvents && eventTextStyle,
                  isToday && styles.todayText
                ]}>
                  {date.getDate()}
                </Text>
              )}
              {hasEvents && dotColor && <View style={[styles.eventDot, { backgroundColor: dotColor }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  monthBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5'
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#666'
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayCell: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 4
  },
  emptyCell: {
    backgroundColor: 'transparent'
  },
  weekendCell: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6'
  },
  todayCell: {
    backgroundColor: '#004643',
    elevation: 2,
    shadowColor: '#004643',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3
  },
  dayText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500'
  },
  weekendText: {
    color: '#E53E3E',
    fontWeight: '600'
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2
  }
});