
import React, { useState, useMemo } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Users, Clock } from 'lucide-react';

export const CalendarPage = () => {
    const { elections, candidates } = useRealtime();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get month/year info
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const startingDay = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add the actual days
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(currentYear, currentMonth, i));
        }

        return days;
    }, [currentMonth, currentYear]);

    // Get elections for a specific date
    const getElectionsForDate = (date: Date) => {
        return elections.filter(e => {
            const startDate = new Date(e.startDate);
            const endDate = new Date(e.endDate);
            const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const startCheck = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endCheck = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            return checkDate >= startCheck && checkDate <= endCheck;
        });
    };

    const navigateMonth = (delta: number) => {
        setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const today = new Date();
    const isToday = (date: Date) => {
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-3">
                        <CalendarIcon className="text-primary-600" size={28} />
                        Election Calendar
                    </h2>
                    <p className="text-sm text-slate-500">View scheduled elections across all regions</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div className="text-lg font-bold text-slate-800 dark:text-white min-w-[180px] text-center">
                        {monthNames[currentMonth]} {currentYear}
                    </div>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    {dayNames.map(day => (
                        <div key={day} className="p-3 text-center text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Cells */}
                <div className="grid grid-cols-7">
                    {calendarDays.map((date, idx) => {
                        const dayElections = date ? getElectionsForDate(date) : [];
                        return (
                            <div
                                key={idx}
                                className={`min-h-[120px] p-2 border-b border-r border-slate-100 dark:border-slate-700 ${!date ? 'bg-slate-50 dark:bg-slate-900/30' :
                                        date && isToday(date) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                    }`}
                            >
                                {date && (
                                    <>
                                        <div className={`text-sm font-bold mb-2 ${isToday(date) ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                            {date.getDate()}
                                            {isToday(date) && <span className="ml-1 text-xs font-normal">(Today)</span>}
                                        </div>
                                        <div className="space-y-1">
                                            {dayElections.slice(0, 3).map(e => (
                                                <div
                                                    key={e.id}
                                                    className={`text-xs p-1.5 rounded truncate font-medium ${e.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                                                            e.status === 'UPCOMING' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                                                'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                        }`}
                                                    title={e.title}
                                                >
                                                    {e.title}
                                                </div>
                                            ))}
                                            {dayElections.length > 3 && (
                                                <div className="text-xs text-slate-500 pl-1">+{dayElections.length - 3} more</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend & Upcoming Elections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Legend */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Legend</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-emerald-500"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Active Election</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-blue-500"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Upcoming Election</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-slate-400"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Ended Election</span>
                        </div>
                    </div>
                </div>

                {/* This Month's Elections */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">This Month's Elections</h3>
                    <div className="space-y-3">
                        {elections
                            .filter(e => {
                                const startDate = new Date(e.startDate);
                                return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
                            })
                            .map(e => (
                                <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-8 rounded-full ${e.status === 'ACTIVE' ? 'bg-emerald-500' :
                                                e.status === 'UPCOMING' ? 'bg-blue-500' : 'bg-slate-400'
                                            }`}></div>
                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-white">{e.title}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                <MapPin size={12} />
                                                {e.region === 'National' ? 'National' :
                                                    e.region === 'State' ? e.regionState :
                                                        `${e.regionDistrict}, ${e.regionState}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Clock size={12} />
                                            {new Date(e.startDate).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Users size={12} />
                                            {candidates.filter(c => c.electionId === e.id).length} candidates
                                        </div>
                                    </div>
                                </div>
                            ))}
                        {elections.filter(e => {
                            const startDate = new Date(e.startDate);
                            return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
                        }).length === 0 && (
                                <p className="text-center text-slate-500 py-4">No elections scheduled for this month</p>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};
