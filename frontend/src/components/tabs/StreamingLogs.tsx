import { useCallback } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import type { StreamingLog } from '@/types';
import { api } from '@/lib/api';
import { Play, Clock, MapPin, Users, Monitor, Wifi } from 'lucide-react';

export function StreamingLogsTab() {

  const columns = [
    {
      key: 'play_id',
      header: 'Play ID',
      width: '100px',
      render: (row: StreamingLog) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rg-gold/10 rounded">
            <Play className="w-3 h-3 text-rg-gold" />
          </div>
          <span className="font-mono text-rg-text-secondary text-[12px]">{row.play_id}</span>
        </div>
      ),
    },
    {
      key: 'content_id',
      header: 'Content ID',
      width: '120px',
      render: (row: StreamingLog) => (
        <span className="font-mono text-rg-text-primary font-semibold">{row.content_id}</span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '180px',
      render: (row: StreamingLog) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-rg-text-muted" />
          <span className="font-mono text-rg-text-secondary text-[12px]">{row.timestamp}</span>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      width: '100px',
      render: (row: StreamingLog) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rg-text-muted" />
          <span className="text-rg-text-primary font-semibold">{row.country}</span>
        </div>
      ),
    },
    {
      key: 'plays',
      header: 'Plays',
      width: '100px',
      render: (row: StreamingLog) => (
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-rg-cyan" />
          <span className="font-mono text-rg-text-primary font-semibold">{Number(row.plays).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'user_type',
      header: 'User Type',
      width: '120px',
      render: (row: StreamingLog) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-rg-text-muted" />
          <span className={`text-[11px] uppercase font-bold px-2.5 py-1 rounded-rg-md ${
            row.user_type === 'Premium' 
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rg-bg-tertiary text-rg-text-muted border border-rg-border-default'
          }`}>
            {row.user_type}
          </span>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'Device',
      width: '120px',
      render: (row: StreamingLog) => (
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-rg-text-muted" />
          <span className="text-rg-text-secondary">{row.device}</span>
        </div>
      ),
    },
  ];

  const fetchData = useCallback(async (page: number, search?: string) => {
    const res = await api.getLogs(page, search);
    return res as any;
  }, []);

  const handleDownload = useCallback((search: string) => {
    return api.downloadLogsCSV(search);
  }, []);

  return (
    <DataTable<any>
      title="Streaming Intelligence"
      subtitle="Real-time playback telemetry and regional data"
      columns={columns}
      fetchData={fetchData}
      onDownload={handleDownload}
      emptyTitle="No Streaming Data"
      emptyDescription="Streaming logs will appear here once playback events are recorded. Run an audit to analyze streaming data."
      emptyIcon="data"
      searchable
      rowsPerPage={50}
    />
  );
}
