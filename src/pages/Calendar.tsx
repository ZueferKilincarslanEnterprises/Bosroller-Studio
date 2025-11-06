import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shoot, Project, TeamMember } from '../types';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import DateClickModal from '../components/calendar/DateClickModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type FilterType = 'all' | 'my-projects' | 'by-status';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [shootsRes, projectsRes, teamRes] = await Promise.all([
        supabase.from('shoots').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('team_members').select('*'),
      ]);

      if (shootsRes.data) setShoots(shootsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (teamRes.data) setTeamMembers(teamRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const getFilteredShoots = () => {
    let filtered = shoots;

    if (filter === 'by-status' && statusFilter !== 'all') {
      filtered = filtered.filter((shoot) => {
        const project = projects.find((p) => p.id === shoot.project_id);
        return project?.status === statusFilter;
      });
    }

    return filtered;
  };

  const getShootsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const filtered = getFilteredShoots();
    return filtered.filter((s) => s.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setShowModal(true);
  };

  if (loading) {
    return <div className="p-3 sm:p-6 text-slate-400">Loading calendar...</div>;
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const statusOptions = ['Planned', 'In Production', 'Finished', 'Posted'];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          Shoot Calendar
        </h1>
        <p className="text-sm sm:text-base text-slate-400">Schedule and manage your filming dates</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <label className="text-sm text-slate-400 mb-2 block">Filter</label>
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-100">
                All Projects
              </SelectItem>
              <SelectItem value="my-projects" className="text-slate-100">
                My Projects
              </SelectItem>
              <SelectItem value="by-status" className="text-slate-100">
                By Status
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filter === 'by-status' && (
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-slate-100">
                  All Statuses
                </SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status} className="text-slate-100">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <h2 className="text-lg sm:text-2xl font-bold text-white">{monthName}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevMonth} className="min-h-[44px] text-xs sm:text-sm">
              Previous
            </Button>
            <Button variant="outline" onClick={handleNextMonth} className="min-h-[44px] text-xs sm:text-sm">
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs sm:text-sm font-semibold text-slate-400 py-1 sm:py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-slate-900 rounded-lg"></div>
          ))}
          {days.map((day) => {
            const dayShoots = getShootsForDate(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-square p-2 rounded-lg border transition-colors flex flex-col items-start justify-start gap-1 text-left group min-h-[60px] sm:min-h-[80px] ${
                  isToday
                    ? 'bg-blue-600 border-blue-500'
                    : dayShoots.length > 0
                      ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-slate-200'}`}>
                  {day}
                </span>
                {dayShoots.length > 0 && (
                  <div className="w-full space-y-1">
                    {dayShoots.slice(0, 2).map((shoot, idx) => (
                      <div
                        key={idx}
                        className={`text-xs px-1 py-0.5 rounded truncate font-medium ${
                          isToday ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                        }`}
                        title={shoot.project_title}
                      >
                        {shoot.project_title}
                      </div>
                    ))}
                    {dayShoots.length > 2 && (
                      <div className="text-xs text-slate-300 px-1">
                        +{dayShoots.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <DateClickModal
          isOpen={showModal}
          date={selectedDate}
          onClose={() => {
            setShowModal(false);
            setSelectedDate(null);
            fetchData();
          }}
          projects={projects}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}
