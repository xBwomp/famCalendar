import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, RefreshCw, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { eventApi, calendarApi, CalendarEvent, Calendar as CalendarType } from '../api';
import CalendarView, { ViewType } from '../components/CalendarView';
import { useLocation } from 'react-router-dom';

const PublicDashboard: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showSimpleView, setShowSimpleView] = useState(false);
  const [simpleDate, setSimpleDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const location = useLocation();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch selected calendars and events for the next 30 days
      // Include current day by using local start-of-day for the start date
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // today at 00:00 local
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
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // If URL contains ?simple=1, auto-open Simple View
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('simple') === '1') {
      setShowSimpleView(true);
    }
  }, [location.search]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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

    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Family Calendar</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <button
                    onClick={fetchData}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowSimpleView(!showSimpleView)}
                    className={`inline-flex items-center px-3 py-1 border rounded-md text-sm transition-colors ${
                      showSimpleView
                        ? 'border-blue-300 text-blue-700 bg-blue-50'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    {showSimpleView ? 'Calendar View' : 'Simple View'}
                  </button>
                </div>
              </div>
              
              <a
                href="/admin"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Calendars</h2>
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
        )}


        {/* Calendar Views */}
        {showSimpleView ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
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
                  onClick={() => setSimpleDate(new Date().toISOString().split('T')[0])}
                  className="ml-2 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Precompute filtered and sorted events for the selected date */}
            {(() => {
              const selected = simpleDate;
              // Filter events that overlap the selected date
              // and sort them by start_time ascending
              const filteredEvents = events.filter(event => {
                const eventStart = new Date(event.start_time).toISOString().split('T')[0];
                const eventEnd = new Date(event.end_time).toISOString().split('T')[0];
                return eventStart <= selected && eventEnd >= selected;
              }).sort((a, b) => {
                // Compute effective local minutes-from-midnight for each event on the selected date
                const makeEffectiveMinutes = (ev: CalendarEvent) => {
                  // Parse start date/time (fall back to helper if needed)
                  let sd = new Date(ev.start_time);
                  if (isNaN(sd.getTime())) sd = parseEventDateTime(ev.start_time, selected);

                  // Extract local date portion of the event start
                  const evStartDateISO = sd.toISOString().split('T')[0];

                  // If event starts before the selected date, treat as 0 minutes (start of day)
                  if (evStartDateISO < selected) return 0;

                  // If event starts after the selected date, use the actual hour/minutes (converted to local via Date)
                  // But for events that start on the selected date, return local hours*60 + minutes
                  const hours = sd.getHours();
                  const mins = sd.getMinutes();
                  return hours * 60 + mins;
                };

                const ma = makeEffectiveMinutes(a);
                const mb = makeEffectiveMinutes(b);
                if (ma !== mb) return ma - mb;
                // tie-breaker: use full timestamp
                const ta = new Date(a.start_time).getTime() || parseEventDateTime(a.start_time, selected).getTime();
                const tb = new Date(b.start_time).getTime() || parseEventDateTime(b.start_time, selected).getTime();
                return ta - tb;
              });

              // Attach to window for debugging (optional)
              // (window as any).__filteredSimpleEvents = filteredEvents;

              return (
                <>
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No events on this date</h3>
                      <p className="text-gray-500">Enjoy your free day!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: event.calendar_color || '#3B82F6' }}
                                />
                                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                              </div>

                              {event.description && (
                                <p className="text-gray-600 mb-3">{event.description}</p>
                              )}

                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {event.all_day
                                      ? 'All day'
                                      : `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`
                                    }
                                  </span>
                                </div>

                                {event.location && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                  </div>
                                )}

                                {event.calendar_name && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{event.calendar_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
            <CalendarView
              events={events}
              view={currentView}
              onViewChange={setCurrentView}
              startHour={7}
              endHour={20}
              daysToShow={5}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicDashboard;