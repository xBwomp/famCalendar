import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Settings, ChevronLeft, ChevronRight, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { eventApi, calendarApi, CalendarEvent, Calendar as CalendarType } from '../api';

import { useTheme } from '../context/ThemeContext';

import '../themes/halloween.css';
import '../themes/thanksgiving.css';
import '../themes/christmas.css';
import '../themes/newYears.css';

const PublicDashboard: React.FC = () => {
  const { theme } = useTheme();
  console.log('Rendering PublicDashboard');

  const darkenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return `#${(0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1)}`;
  };
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const formatLocalDateISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);

  const toggleDescription = (eventId: string) => {
    setExpandedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId) 
        : [...prev, eventId]
    );
  };

  const [simpleDate, setSimpleDate] = useState<string>(formatLocalDateISO(new Date()));

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = React.useCallback(async () => {
    console.log('Fetching data');
    setLoading(true);
    setError(null);
    
    try {
      // Fetch selected calendars and events for the next 30 days
      // Include current day by using local start-of-day for the start date
      const startDate = new Date();
      // start two days ago at local 00:00 to include earlier events
      startDate.setDate(startDate.getDate() - 2);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // 30 days ahead
      endDate.setHours(23, 59, 59, 999); // include entire last day
      
      const [calendarsResponse, eventsResponse] = await Promise.all([
        calendarApi.getSelected(),
        eventApi.getAll({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
      ]);

      if (calendarsResponse.success && calendarsResponse.data) {
        setCalendars(calendarsResponse.data);
      }

      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data);
      } else {
        setError(eventsResponse.error || 'Failed to fetch events');
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch calendar data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('PublicDashboard useEffect');
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string) => {
    // If dateString is date-only (YYYY-MM-DD), construct a local Date to avoid UTC shift
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    let d: Date;
    if (dateOnly.test(dateString)) {
      const [y, m, day] = dateString.split('-').map(n => parseInt(n, 10));
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(dateString);
    }

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York',
    }).format(d);
  };

  // Navigate simple view date
  const navigateSimpleDate = (direction: 'prev' | 'next') => {
    const d = new Date(simpleDate);
    d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    setSimpleDate(d.toISOString().split('T')[0]);
  };

  // Helper to robustly parse event start/end times into Date objects
  const parseEventDateTime = (dateTimeStr: string, fallbackDateISO?: string): Date => {
    // If it's a full ISO string, let Date handle it
    const isoLike = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (isoLike.test(dateTimeStr)) return new Date(dateTimeStr);

    // If it's a date-only (YYYY-MM-DD), treat as start of day
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnly.test(dateTimeStr)) return new Date(`${dateTimeStr}T00:00:00`);

    // If it's time-only like '8:00' or '8:00 AM', combine with fallbackDateISO (or today)
    const timeOnly = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i;
    const m = dateTimeStr.match(timeOnly);
    if (m) {
      const hour = parseInt(m[1], 10);
      const minute = parseInt(m[2], 10);
      const ampm = m[3];
      let h = hour;
      if (ampm) {
        const isPM = ampm.toUpperCase() === 'PM';
        if (hour === 12) h = isPM ? 12 : 0;
        else h = isPM ? hour + 12 : hour;
      }
      const base = fallbackDateISO || new Date().toISOString().split('T')[0];
      return new Date(`${base}T${String(h).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`);
    }

    // Fallback: let Date try, and if invalid, return epoch
    const d = new Date(dateTimeStr);
    if (!isNaN(d.getTime())) return d;
    return new Date(0);
  };

  // Precompute parsed event times for sorting
  const parsedEvents = events.map(event => ({
    ...event,
    parsedStartTime: parseEventDateTime(event.start_time),
    parsedEndTime: parseEventDateTime(event.end_time),
  }));

  // Sort events by parsed start time
  parsedEvents.sort((a, b) => a.parsedStartTime.getTime() - b.parsedStartTime.getTime());

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering dashboard');
  return (
    <div className={`min-h-screen ${theme.name.toLowerCase()}-theme`} style={{ background: `linear-gradient(to bottom, ${theme.styles.backgroundColor}, ${darkenColor(theme.styles.backgroundColor, 10)})`, color: theme.styles.textColor }}>
      {/* Header */}
      <header className="shadow-sm border-b" style={{ background: `linear-gradient(to right, ${theme.styles.primaryColor}, ${theme.styles.secondaryColor})`, color: theme.styles.textColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 items-center">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold" style={{ color: theme.styles.textColor }}>Family Calendar</h1>
            </div>

            <div className="text-center">
              <p className="text-sm" style={{ color: theme.styles.textColor }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2 mt-1">
                  <button
                    onClick={fetchData}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm transition-colors"
                    style={{ backgroundColor: 'white', color: theme.styles.primaryColor }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>

              <a
                href="/admin"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm transition-colors"
                style={{ backgroundColor: 'white', color: theme.styles.primaryColor }}
              >
                <Settings className="w-4 h-4 mr-1" />
                Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Active Calendars */}
        {calendars.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold" style={{ color: theme.styles.textColor }}>Active Calendars</h2>
              <div className="flex flex-wrap gap-2">
                {calendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${calendar.color}20`,
                      color: calendar.color,
                      borderColor: calendar.color,
                      borderWidth: '1px',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: calendar.color }}
                    />
                    {calendar.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Simple View (always shown) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" style={{ color: theme.styles.textColor }}>
              Events for {formatDate(simpleDate)}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateSimpleDate('prev')}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={simpleDate}
                onChange={(e) => setSimpleDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                style={{ backgroundColor: 'white', color: 'black' }}
                aria-label="Select date"
              />

              <button
                onClick={() => navigateSimpleDate('next')}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSimpleDate(formatLocalDateISO(new Date()))}
                className="ml-2 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                style={{ backgroundColor: 'white', color: 'black' }}
              >
                Today
              </button>
            </div>
          </div>

          {/* Precompute filtered and sorted events for the selected date */}
          {(() => {
            const selected = simpleDate;
            const filteredEvents = events.filter(event => {
              const startLocal = (() => {
                const sd = new Date(event.start_time);
                return formatLocalDateISO(new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()));
              })();
              const endLocal = (() => {
                const ed = new Date(event.end_time);
                return formatLocalDateISO(new Date(ed.getFullYear(), ed.getMonth(), ed.getDate()));
              })();
              return startLocal <= selected && endLocal >= selected;
            }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

            if (filteredEvents.length === 0) {
              return <div className="p-4 text-gray-500">No events found.</div>;
            }

            return (
              <div className="space-y-4">
                {filteredEvents.map(event => {
                  const calendar = calendars.find(c => c.id === event.calendar_id);
                  const startTime = new Date(event.start_time);
                  const endTime = new Date(event.end_time);
                  const isCurrent = startTime <= currentTime && currentTime <= endTime;

                  return (
                    <div className={`rounded-lg ${isCurrent ? 'breathing-border' : ''}`}>
                      <div 
                        key={event.id} 
                        className={`bg-white rounded-lg shadow-md p-4 border-l-4 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl`}
                        style={{ borderColor: calendar ? calendar.color : '#ccc' }}
                      >
                        <div className="relative">
                          <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                          {event.description && event.description.length > 100 && (
                            <button 
                              onClick={() => toggleDescription(event.id)}
                              className="absolute top-0 right-0 text-gray-500 hover:text-gray-700"
                            >
                              {expandedEvents.includes(event.id) ? <ChevronUp /> : <ChevronDown />}
                            </button>
                          )}
                        </div>
                        <div className="text-md text-gray-600 mt-1 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                        </div>
                        {event.location && (
                          <div className="text-md text-gray-600 mt-1 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.description && (
                          <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                            {expandedEvents.includes(event.id) 
                              ? event.description 
                              : `${event.description.substring(0, 100)}...`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
};

export default PublicDashboard;