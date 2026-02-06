import { AlertTriangle, ExternalLink } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const MaintenanceOverlay = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-4 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
          Database Maintenance
        </h1>
        
        {/* Message */}
        <div className="space-y-4 mb-8">
          <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed">
            We are currently restructuring and optimizing our database infrastructure.
          </p>
          <p className="text-base md:text-lg text-white/70 font-light">
            During this time, some features may be temporarily unavailable or experience minor delays.
          </p>
          <p className="text-base md:text-lg text-white/70 font-light">
            We appreciate your patience. Normal service will resume shortly.
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium px-6 py-3 h-auto rounded-xl border border-white/10 shadow-lg shadow-emerald-500/20"
          >
            <a 
              href="https://status.uservault.cc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Status Page
            </a>
          </Button>
          
          <Button
            asChild
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium px-6 py-3 h-auto rounded-xl border border-white/10 shadow-lg shadow-[#5865F2]/20"
          >
            <a 
              href="https://discord.com/channels/1464309088736252097/1464321025532629150" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <FaDiscord className="w-5 h-5" />
              Join Discord
            </a>
          </Button>
        </div>
        
        {/* Subtle branding */}
        <p className="mt-10 text-sm text-white/40 font-light">
          — The UserVault Team
        </p>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;
