import React from 'react';
import { Calendar, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Calendar as CalendarType } from '../../api';

interface CalendarListProps {
  calendars: CalendarType[];
  actionLoading: string | null;
  onToggleCalendar: (calendarId: string) => void;
  onCreateSampleData: () => void;
}

export const CalendarList = ({
  calendars,
  actionLoading,
  onToggleCalendar,
  onCreateSampleData,
}: CalendarListProps) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar Management</h2>

      {calendars.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calendars found</h3>
            <p className="text-gray-500 mb-4">Create some sample data to get started.</p>
            <Button
              variant="primary"
              size="md"
              onClick={onCreateSampleData}
              disabled={actionLoading === 'sample-data'}
              isLoading={actionLoading === 'sample-data'}
              icon={<Calendar className="w-4 h-4" />}
            >
              Create Sample Data
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 mb-0">
            <h3 className="text-lg font-medium text-gray-900">
              Calendars ({calendars.length})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Toggle calendars on/off to control what appears on the public dashboard
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {[...calendars].sort((a, b) => b.selected - a.selected).map((calendar) => (
              <div key={calendar.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{calendar.name}</h4>
                    {calendar.description && (
                      <p className="text-sm text-gray-500">{calendar.description}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onToggleCalendar(calendar.id)}
                  disabled={actionLoading === calendar.id}
                  className="flex items-center space-x-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === calendar.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                  ) : calendar.selected ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">Visible</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-500">Hidden</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
