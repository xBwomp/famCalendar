import React, { useState } from 'react';
import { CalendarEvent } from '../api';
import { motion } from 'framer-motion';

export type ViewType = 'day' | 'week' | 'month';


interface CalendarViewProps {
  events: CalendarEvent[];
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  startHour?: number;
  endHour?: number;
  daysToShow?: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  view,
  onViewChange,
  startHour = 7,
  endHour = 20
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number, y: number } | null>(null);

  // Adjust the type for e in handleEventClick to match broader compatibility
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent<Element, MouseEvent>) => {
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    setSelectedEvent(event);
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY + rect.height,
    });

    console.log('Event clicked:', event);
    console.log('Popover position:', {
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY + rect.height,
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    // Use local date (browser timezone) for Today
    setCurrentDate(new Date());
  };

  // Parse event date/time into a local Date object. If the input is date-only
  // (YYYY-MM-DD), construct a local-midnight Date to avoid UTC shifting.
  const parseToLocalDate = (s: string) => {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnly.test(s)) {
      const [y, m, d] = s.split('-').map(n => parseInt(n, 10));
      return new Date(y, m - 1, d);
    }
    return new Date(s);
  };

  type EventWithLayout = CalendarEvent & {
    column: number;
    totalColumns: number;
  };

  const assignEventColumns = (events: CalendarEvent[]): EventWithLayout[] => {
    if (events.length === 0) return [];

    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => {
      const aStart = parseToLocalDate(a.start_time);
      const bStart = parseToLocalDate(b.start_time);
      return aStart.getTime() - bStart.getTime();
    });

    // Track ongoing events and their columns
    const columns: { event: EventWithLayout; endTime: Date }[][] = [];
    const result: EventWithLayout[] = [];

    for (const event of sortedEvents) {
      const start = parseToLocalDate(event.start_time);
      const end = parseToLocalDate(event.end_time);

      // Remove finished columns
      columns.forEach((col, i) => {
        columns[i] = col.filter(item => item.endTime > start);
      });

      // Find first available column or create new
      let columnIndex = columns.findIndex(col => col.length === 0);
      if (columnIndex === -1) {
        columnIndex = columns.length;
        columns.push([]);
      }

      // Add event to its column
      const eventWithLayout: EventWithLayout = {
        ...event,
        column: columnIndex,
        totalColumns: columns.length
      };
      columns[columnIndex].push({ event: eventWithLayout, endTime: end });
      result.push(eventWithLayout);
    }

    // Update total columns for all events in this group
    result.forEach(event => {
      event.totalColumns = columns.length;
    });

    return result;
  };

  const getEventsForDate = (date: Date, events: CalendarEvent[]): EventWithLayout[] => {
    // Normalize comparisons to local YYYY-MM-DD strings to avoid UTC shifts
    const toLocalISODate = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const target = toLocalISODate(date);

    const eventsForDate = events.filter(event => {
      const eventStart = parseToLocalDate(event.start_time);
      const eventEnd = parseToLocalDate(event.end_time);

      const startLocal = toLocalISODate(eventStart);
      const endLocal = toLocalISODate(eventEnd);

      return startLocal <= target && endLocal >= target;
    });

    return assignEventColumns(eventsForDate);
  };

  const getWeekDays = (date: Date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      
      if (days.length >= 42) break; // 6 weeks max
    }
    
    return days;
  };

  const getHourSlots = () => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const getEventPosition = (event: CalendarEvent, date: Date) => {
  const eventStart = parseToLocalDate(event.start_time);
  const eventEnd = parseToLocalDate(event.end_time);
    const dayStart = new Date(date);
    dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, 0, 0, 0);

    if (event.all_day) {
      return { top: 0, height: 100 };
    }

    const startMinutes = Math.max(
      (eventStart.getTime() - dayStart.getTime()) / (1000 * 60),
      0
    );
    const endMinutes = Math.min(
      (eventEnd.getTime() - dayStart.getTime()) / (1000 * 60),
      (endHour - startHour) * 60
    );

    const totalMinutes = (endHour - startHour) * 60;
    const top = (startMinutes / totalMinutes) * 100;
    const height = ((endMinutes - startMinutes) / totalMinutes) * 100;

    return { top, height: Math.max(height, 5) };
  };

  // Define PopoverPosition type
  interface PopoverPosition {
    x: number;
    y: number;
    align?: 'left' | 'right';
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate, events);
    const hourSlots = getHourSlots();

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-full" onClick={() => console.log('Container clicked')}>
          {/* Render hour slots */}
          {hourSlots.map((hour, index) => (
            <div key={index} className="hour-slot">
              {hour}
            </div>
          ))}
          {/* All-day events */}
          {dayEvents.filter(e => e.all_day).length > 0 && (
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">All Day</h4>
              <div className="space-y-1">
                {dayEvents.filter(e => e.all_day).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-2 p-2 rounded text-sm"
                    style={{
                      backgroundColor: `${event.calendar_color || '#3B82F6'}20`,
                      borderLeft: `3px solid ${event.calendar_color || '#3B82F6'}`,
                    }}
                    onClick={(e: React.MouseEvent) => handleEventClick(event, e)}
                  >
                    <span>{event.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example usage of EventPopover */}
          {selectedEvent && popoverPosition && (
            <EventPopover
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              position={popoverPosition}
            />
          )}
        </div>
      </div>
    );
  };

  // Add explicit types for parameters
  const EventPopover: React.FC<{
    event: CalendarEvent;
    onClose: () => void;
    position: PopoverPosition;
  }> = ({ event, onClose, position }) => {
    return (
      <motion.div
        id="event-popover"
        className="absolute bg-white shadow-lg rounded p-4 z-50"
        style={{
          top: position.y,
          left: position.x,
          transform: 'translate(-50%, 0)',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        <h4 className="text-lg font-medium mb-2">{event.title}</h4>
        <p className="text-sm text-gray-600 mb-2">
          {formatTime(event.start_time)} - {formatTime(event.end_time)}
        </p>
        {event.location && (
          <p className="text-sm text-gray-600 mb-2">Location: {event.location}</p>
        )}
        {event.description && (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
        )}
      </motion.div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const hourSlots = getHourSlots();

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Week header */}
          <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div className="w-16 flex-shrink-0"></div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="flex-1 p-2 text-center border-l border-gray-200">
                <div className="text-xs text-gray-500">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-medium ${
                  day.toDateString() === new Date().toDateString() 
                    ? 'text-blue-600' 
                    : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* All-day events for the week */}
          <div className="flex border-b border-gray-200">
            <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-500 text-right">All-day</div>
            {weekDays.map(day => {
              const allDayEvents = getEventsForDate(day, events).filter(e => e.all_day);
              return (
                <div key={day.toISOString()} className="flex-1 border-l border-gray-200 p-1">
                  {allDayEvents.map(event => (
                    <div
                      key={event.id}
                      className="p-1 rounded text-xs truncate"
                      style={{
                        backgroundColor: `${event.calendar_color || '#3B82F6'}20`,
                        color: event.calendar_color || '#3B82F6',
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative" style={{ height: `${(endHour - startHour) * 4}rem` }}>
            {/* Hour lines */}
            {hourSlots.map(hour => (
              <div key={hour} className="flex absolute w-full" style={{ top: `${((hour - startHour) / (endHour - startHour)) * 100}%` }}>
                <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-500 text-right">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 border-t border-gray-100"></div>
              </div>
            ))}

            {/* Day columns */}
            <div className="grid grid-cols-7 h-full ml-16">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="relative border-l border-gray-200">
                  {getEventsForDate(day, events)
                    .filter(e => !e.all_day)
                    .map(event => {
                      const position = getEventPosition(event, day);
                      return (
                        <motion.div
                          key={event.id}
                          layoutId={`event-${event.id}`}
                          className="absolute p-1 rounded overflow-hidden cursor-pointer"
                          style={{
                            top: `${position.top}%`,
                            height: `${position.height}%`,
                            left: `${(event.column * 100) / event.totalColumns}%`,
                            width: `${100 / event.totalColumns}%`,
                            backgroundColor: `${event.calendar_color || '#3B82F6'}CC`,
                            color: 'white',
                            minHeight: '20px',
                            zIndex: selectedEvent?.id === event.id ? 50 : 10,
                          }}
                          whileHover={{
                            scale: 1.02,
                            backgroundColor: event.calendar_color || '#3B82F6',
                            zIndex: 20,
                            transition: { duration: 0.1 }
                          }}
                          onClick={(e: React.MouseEvent) => {
                            console.log('Event item clicked');
                            handleEventClick(event, e);
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {position.height >= 8 && (
                            <div className="text-xs opacity-90 truncate">
                              {formatTime(event.start_time)}
                              {position.height >= 12 && ` - ${formatTime(event.end_time)}`}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays(currentDate);
    const weeks = [];
    
    for (let i = 0; i < monthDays.length; i += 7) {
      weeks.push(monthDays.slice(i, i + 7));
    }

    return (
      <div className="flex-1 overflow-auto">
        <div className="h-full">
          {/* Month header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="flex-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0" style={{ minHeight: '120px' }}>
                {week.map(day => {
                  const dayEvents = getEventsForDate(day, events);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div key={day.toISOString()} className="border-r border-gray-200 last:border-r-0 p-1 overflow-hidden">
                      <div className={`text-sm font-medium mb-1 ${
                        isToday 
                          ? 'text-blue-600 font-bold' 
                          : isCurrentMonth 
                            ? 'text-gray-900' 
                            : 'text-gray-400'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded truncate"
                            style={{
                              backgroundColor: `${event.calendar_color || '#3B82F6'}20`,
                              color: event.calendar_color || '#3B82F6',
                            }}
                          >
                            {event.all_day ? event.title : `${formatTime(event.start_time)} ${event.title}`}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    switch (view) {
      case 'day':
        return formatDate(currentDate);
      case 'week':
        const weekDays = getWeekDays(currentDate);
        const startWeek = weekDays[0];
        const endWeek = weekDays[6];
        if (startWeek.getMonth() === endWeek.getMonth()) {
          return `${startWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${startWeek.getDate()}-${endWeek.getDate()}`;
        } else {
          return `${formatShortDate(startWeek)} - ${formatShortDate(endWeek)}, ${endWeek.getFullYear()}`;
        }
      case 'month':
        return formatMonthYear(currentDate);
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">{getViewTitle()}</h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Navigation */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              {/* <ChevronLeft className="w-5 h-5" /> */}
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              {/* <ChevronRight className="w-5 h-5" /> */}
            </button>
          </div>

          {/* View switcher */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            {(['day', 'week', 'month'] as ViewType[]).map(viewType => (
              <button
                key={viewType}
                onClick={() => onViewChange(viewType)}
                className={`px-3 py-1 text-sm font-medium capitalize transition-colors ${
                  view === viewType
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar content */}
      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}

      {/* Event popover - for debugging, you can remove this later */}
      {/* <EventPopover 
        event={{
          id: '1',
          title: 'Sample Event',
          start_time: '2023-10-10T10:00:00',
          end_time: '2023-10-10T11:00:00',
          all_day: false,
          location: '123 Sample St',
          description: 'This is a sample event description.',
          calendar_color: '#3B82F6',
        }}
        onClose={() => {}}
        position={{ x: 100, y: 100 }}
      /> */}
    </div>
  );
};

export default CalendarView;