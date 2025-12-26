import { usePrograms } from '@/hooks/usePrograms';
import { Calendar, GraduationCap, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isPast, isFuture, isThisMonth } from 'date-fns';

export function IntakeCalendarView() {
  const { programs, loading } = usePrograms();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const sortedPrograms = [...programs].sort((a, b) => 
    new Date(a.intake_date).getTime() - new Date(b.intake_date).getTime()
  );

  const upcomingIntakes = sortedPrograms.filter(p => isFuture(new Date(p.intake_date)));

  const getIntakeStatus = (program: any) => {
    const intakeDate = new Date(program.intake_date);
    const fillRate = (program.enrolled / program.capacity) * 100;
    
    if (isPast(intakeDate)) {
      return { label: 'Completed', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
    }
    if (isThisMonth(intakeDate)) {
      return { label: 'This Month', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    if (fillRate >= 90) {
      return { label: 'Almost Full', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
    }
    if (fillRate >= 70) {
      return { label: 'Filling Up', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    return { label: 'Open', color: 'bg-green-500/10 text-green-400 border-green-500/30' };
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-bold text-white">Upcoming Intakes</h3>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
            {upcomingIntakes.length} Scheduled
          </Badge>
        </div>
        
        {upcomingIntakes.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No upcoming intakes scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingIntakes.map((program) => {
              const status = getIntakeStatus(program);
              const fillRate = (program.enrolled / program.capacity) * 100;
              const daysUntil = Math.ceil((new Date(program.intake_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <div key={program.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <GraduationCap className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{program.name}</h4>
                        <p className="text-sm text-gray-400">{program.department}</p>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", status.color)}>
                      {status.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-400">Intake Date</p>
                      <p className="text-sm font-medium text-white">
                        {format(new Date(program.intake_date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">{daysUntil} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Enrollment</p>
                      <p className="text-sm font-medium text-white">
                        {program.enrolled} / {program.capacity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Fill Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              fillRate >= 90 ? "bg-red-500" : fillRate >= 70 ? "bg-amber-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(fillRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white">{fillRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {fillRate < 50 && daysUntil < 30 && (
                    <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-400">Low enrollment - needs attention</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
