import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Globe,
  Shield,
  Database,
  Server,
  ArrowLeft,
  Clock,
  Cloud,
  MessageCircle,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'checking';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: ServiceStatus;
  responseTime?: number;
  lastChecked?: Date;
  uptime?: number;
  hasActiveIncident?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Cloud,
  Database,
  Shield,
  MessageCircle,
  Server,
  Activity,
};

export default function Status() {
  const [services, setServices] = useState<Service[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServiceStatus = async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_current_service_status');

      if (rpcError) {
        console.error('Error loading service status:', rpcError);
        setError('Failed to load service status');
        return;
      }

      if (data) {
        const formattedServices: Service[] = data.map((s: any) => ({
          id: s.service_slug,
          name: s.service_name,
          description: s.service_description,
          icon: iconMap[s.service_icon] || Server,
          status: (s.current_status as ServiceStatus) || 'checking',
          responseTime: s.response_time_ms,
          lastChecked: s.last_checked ? new Date(s.last_checked) : undefined,
          hasActiveIncident: s.has_active_incident,
        }));

        setServices(formattedServices);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading service status:', err);
      setError('Failed to load service status');
    }
  };

  const triggerStatusCheck = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const { error: checkError } = await supabase.functions.invoke('check-service-status');

      if (checkError) {
        console.error('Error triggering status check:', checkError);
        setError('Failed to check service status');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadServiceStatus();

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error during status check:', err);
      setError('Failed to check service status');
    } finally {
      setRefreshing(false);
    }
  };

  const loadUptimeData = async () => {
    try {
      const serviceIds = services.map(s => s.id);

      const uptimePromises = serviceIds.map(async (slug) => {
        const { data: serviceData } = await supabase
          .from('services')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (!serviceData?.id) return { slug, uptime: 100 };

        const { data: uptimeData, error } = await supabase
          .rpc('get_service_uptime', {
            p_service_id: serviceData.id,
            p_hours: 24
          });

        if (error) {
          console.error(`Error loading uptime for ${slug}:`, error);
          return { slug, uptime: 100 };
        }

        return { slug, uptime: uptimeData || 100 };
      });

      const uptimeResults = await Promise.all(uptimePromises);

      setServices(prev => prev.map(s => {
        const uptimeData = uptimeResults.find(u => u.slug === s.id);
        return { ...s, uptime: uptimeData?.uptime };
      }));
    } catch (err) {
      console.error('Error loading uptime data:', err);
    }
  };

  useEffect(() => {
    loadServiceStatus();
    const interval = setInterval(loadServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      loadUptimeData();
    }
  }, [services.length]);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/20 border-green-500/30';
      case 'degraded':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'outage':
        return 'bg-red-500/20 border-red-500/30';
      case 'checking':
        return 'bg-muted/20 border-border';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded';
      case 'outage':
        return 'Outage';
      case 'checking':
        return 'Checking...';
    }
  };

  const overallStatus = services.every(s => s.status === 'operational')
    ? 'operational'
    : services.some(s => s.status === 'outage')
    ? 'outage'
    : services.some(s => s.status === 'checking')
    ? 'checking'
    : 'degraded';

  const getOverallMessage = () => {
    switch (overallStatus) {
      case 'operational':
        return 'All systems operational';
      case 'degraded':
        return 'Some services experiencing issues';
      case 'outage':
        return 'Major outage detected';
      case 'checking':
        return 'Checking service status...';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-foreground">System Status</h1>
              <p className="text-xs text-muted-foreground">UserVault.cc Services</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={triggerStatusCheck}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-200">{error}</p>
          </motion.div>
        )}

        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 mb-8 ${getStatusColor(overallStatus)}`}
        >
          <div className="flex items-center gap-4">
            {getStatusIcon(overallStatus)}
            <div>
              <h2 className="text-lg font-semibold">{getOverallMessage()}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3" />
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Services
          </h3>
          
          <div className="grid gap-3">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl border p-4 ${getStatusColor(service.status)} transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center">
                      <service.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {service.uptime !== undefined && (
                      <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span className="font-mono">{service.uptime.toFixed(2)}%</span>
                      </div>
                    )}
                    {service.responseTime && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {service.responseTime}ms
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="text-sm font-medium hidden sm:inline">
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Status Legend */}
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Status Legend
          </h3>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Degraded Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Outage</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Need help? Join our{' '}
            <a 
              href="https://discord.gg/uservault" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Discord server
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
