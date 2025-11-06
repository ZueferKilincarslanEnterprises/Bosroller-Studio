import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Clock, MapPin, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Project, TeamMember, ShootWithAttendees } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface DateClickModalProps {
  isOpen: boolean;
  date: Date;
  onClose: () => void;
  projects: Project[];
  teamMembers: TeamMember[];
}

interface NewShoot {
  projectId: string;
  time: string;
  location: string;
  notes: string;
  attendeeIds: string[];
}

export default function DateClickModal({
  isOpen,
  date,
  onClose,
  projects,
  teamMembers,
}: DateClickModalProps) {
  const [shoots, setShoots] = useState<ShootWithAttendees[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('view');

  const [newShoot, setNewShoot] = useState<NewShoot>({
    projectId: '',
    time: '10:00',
    location: '',
    notes: '',
    attendeeIds: [],
  });

  const dateStr = date.toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      fetchShoots();
    }
  }, [isOpen, dateStr]);

  const fetchShoots = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shoots')
        .select('*')
        .eq('date', dateStr);

      if (error) throw error;

      const shootsWithAttendees = await Promise.all(
        (data || []).map(async (shoot) => {
          const { data: attendeeData } = await supabase
            .from('shoot_attendees')
            .select('team_member_id')
            .eq('shoot_id', shoot.id);

          const attendeeIds = attendeeData?.map((a) => a.team_member_id) || [];
          const attendees = teamMembers.filter((m) =>
            attendeeIds.includes(m.id)
          );

          return { ...shoot, attendees };
        })
      );

      setShoots(shootsWithAttendees);
    } catch (error) {
      console.error('Error fetching shoots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShoot = async () => {
    if (!newShoot.projectId || !newShoot.time) return;

    try {
      const selectedProject = projects.find((p) => p.id === newShoot.projectId);
      if (!selectedProject) return;

      const location = newShoot.location || selectedProject.location || '';

      const { data: shootData, error } = await supabase
        .from('shoots')
        .insert([
          {
            project_id: newShoot.projectId,
            project_title: selectedProject.title,
            date: dateStr,
            time: newShoot.time,
            location,
            notes: newShoot.notes,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (shootData && newShoot.attendeeIds.length > 0) {
        const attendeeRecords = newShoot.attendeeIds.map((memberId) => ({
          shoot_id: shootData.id,
          team_member_id: memberId,
        }));

        await supabase.from('shoot_attendees').insert(attendeeRecords);
      }

      setNewShoot({
        projectId: '',
        time: '10:00',
        location: '',
        notes: '',
        attendeeIds: [],
      });

      await fetchShoots();
      setActiveTab('view');
    } catch (error) {
      console.error('Error saving shoot:', error);
    }
  };

  const handleDeleteShoot = async (shootId: string) => {
    if (!confirm('Are you sure you want to delete this shoot?')) return;

    try {
      await supabase.from('shoot_attendees').delete().eq('shoot_id', shootId);
      await supabase.from('shoots').delete().eq('id', shootId);
      await fetchShoots();
    } catch (error) {
      console.error('Error deleting shoot:', error);
    }
  };

  const selectedProject = projects.find((p) => p.id === newShoot.projectId);
  const eligibleProjects = projects.filter(
    (p) => p.status === 'Planned' || p.status === 'In Production'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <p className="text-sm text-slate-400">Manage shoots for this date</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-slate-700 border-b border-slate-600 rounded-none grid grid-cols-2">
            <TabsTrigger value="view">View Shoots</TabsTrigger>
            <TabsTrigger value="add">Add Shoot</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="p-4 sm:p-6">
            {loading ? (
              <p className="text-slate-400">Loading shoots...</p>
            ) : shoots.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No shoots scheduled for this date
              </p>
            ) : (
              <div className="space-y-3">
                {shoots.map((shoot) => (
                  <div
                    key={shoot.id}
                    className="bg-slate-700 rounded-lg p-4 border border-slate-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {shoot.project_title}
                        </h3>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Clock className="w-4 h-4" />
                            {shoot.time}
                          </div>
                          {shoot.location && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <MapPin className="w-4 h-4" />
                              {shoot.location}
                            </div>
                          )}
                          {shoot.attendees && shoot.attendees.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Users className="w-4 h-4" />
                              {shoot.attendees.map((a) => a.name).join(', ')}
                            </div>
                          )}
                          {shoot.notes && (
                            <p className="text-sm text-slate-400 mt-2">
                              {shoot.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-200 hidden"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteShoot(shoot.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Project
                </label>
                <Select value={newShoot.projectId} onValueChange={(value) =>
                  setNewShoot({ ...newShoot, projectId: value })
                }>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {eligibleProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-slate-100">
                        {project.title} ({project.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject && (
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold">{selectedProject.title}</span>
                  </p>
                  {selectedProject.location && (
                    <p className="text-xs text-slate-400 mt-1">
                      Default location: {selectedProject.location}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Time</label>
                <Input
                  type="time"
                  value={newShoot.time}
                  onChange={(e) =>
                    setNewShoot({ ...newShoot, time: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Location
                </label>
                <Input
                  value={newShoot.location}
                  onChange={(e) =>
                    setNewShoot({ ...newShoot, location: e.target.value })
                  }
                  placeholder={selectedProject?.location || 'Enter location'}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Team Members Attending
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-600 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={newShoot.attendeeIds.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewShoot({
                              ...newShoot,
                              attendeeIds: [...newShoot.attendeeIds, member.id],
                            });
                          } else {
                            setNewShoot({
                              ...newShoot,
                              attendeeIds: newShoot.attendeeIds.filter(
                                (id) => id !== member.id
                              ),
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-200">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Notes</label>
                <Textarea
                  value={newShoot.notes}
                  onChange={(e) =>
                    setNewShoot({ ...newShoot, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  className="bg-slate-700 border-slate-600 text-white h-24"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <Button
                  onClick={handleSaveShoot}
                  disabled={!newShoot.projectId || !newShoot.time}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Save Shoot
                </Button>
                <Button
                  onClick={() => setActiveTab('view')}
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
