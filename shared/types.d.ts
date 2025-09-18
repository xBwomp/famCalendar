export interface Calendar {
    id: string;
    name: string;
    description?: string;
    color?: string;
    selected: boolean;
    created_at: string;
    updated_at: string;
}
export interface CalendarEvent {
    id: string;
    calendar_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    location?: string;
    created_at: string;
    updated_at: string;
}
export interface SyncLog {
    id: number;
    status: 'started' | 'completed' | 'failed';
    message?: string;
    events_synced: number;
    started_at: string;
    completed_at?: string;
    created_at: string;
}
export interface AdminSettings {
    key: string;
    value: string;
    created_at: string;
    updated_at: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export type CalendarView = 'day' | 'week' | 'month';
export interface DisplayPreferences {
    defaultView: CalendarView;
    daysToShow: number;
    startHour: number;
    endHour: number;
    showWeekends: boolean;
}
//# sourceMappingURL=types.d.ts.map