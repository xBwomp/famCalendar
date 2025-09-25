import React, { useState, JSX } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '../api';

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
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = new Date(event.start_time).toISOString().split('T')[0];
      const eventEnd = new Date(event.end_time).toISOString().split('T')[0];
      return eventStart <= dateStr && eventEnd >= dateStr;
    });
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
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
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

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hourSlots = getHourSlots();

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
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
                  >
                    <span className="font-medium">{event.title}</span>
                    {event.location && (
                      <span className="text-gray-500">• {event.location}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time slots with full-day overlay for events */}
          <div className="relative">
            {/* Hour grid rows (to set the overall height) */}
            {hourSlots.map(hour => (
              <div key={hour} className="flex border-b border-gray-100">
                <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-500 text-right">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 h-16" />
              </div>
            ))}

            {/* Absolute overlay that spans the full day; events positioned by percent */}
            <div className="absolute inset-0 pointer-events-none">
              {dayEvents
                .filter(e => !e.all_day)
                .map(event => {
                  const position = getEventPosition(event, currentDate);
                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 p-1 rounded text-xs overflow-hidden pointer-events-auto"
                      style={{
                        top: `${position.top}%`,
                        height: `${position.height}%`,
                        backgroundColor: `${event.calendar_color || '#3B82F6'}90`,
                        color: 'white',
                        minHeight: '20px',
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {event.all_day ? 'All day' : `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const hourSlots = getHourSlots();

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Week header */}
          <div className="flex border-b border-gray-200 bg-gray-50">
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

          {/* Time slots */}
          {hourSlots.map(hour => (
            <div key={hour} className="flex border-b border-gray-100">
              <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-500 text-right">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {weekDays.map(day => {
                const dayEvents = getEventsForDate(day).filter(e => !e.all_day);
                const hourEvents = dayEvents.filter(e => {
                  const eventStart = new Date(e.start_time);
                  return eventStart.getHours() === hour;
                });

                return (
                  <div key={day.toISOString()} className="flex-1 h-16 relative border-l border-gray-200">
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className="absolute left-0 right-0 mx-1 p-1 rounded text-xs overflow-hidden"
                        style={{
                          backgroundColor: `${event.calendar_color || '#3B82F6'}90`,
                          color: 'white',
                          minHeight: '20px',
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
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
                  const dayEvents = getEventsForDate(day);
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
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
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
    </div>
  );
};

export default CalendarView;