import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Info, Key, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Case, CaseItem, useCaseItems } from '@/hooks/useCases';
import { formatUC } from '@/lib/uc';
import { CaseVisual } from './CaseVisual';

interface CaseCardProps {
  case: Case;
  onOpen: (caseId: string) => void;
  userBalance: bigint;
  index: number;
}

const rarityConfig = {
  common:     { label: 'Common',     color: '#b0c3d9', bar: 'bg-[#b0c3d9]' },
  rare:       { label: 'Rare',       color: '#5e98d9', bar: 'bg-[#5e98d9]' },
  epic:       { label: 'Epic',       color: '#a855f7', bar: 'bg-[#a855f7]' },
  legendary:  { label: 'Legendary',  color: '#eb4b4b', bar: 'bg-[#eb4b4b]' },
  premium:    { label: 'PREMIUM',    color: '#ffd700', bar: 'bg-[#ffd700]' },
};

function getItemDisplay(item: CaseItem) {
  const badge = item.badge || item.global_badge;
  if (item.item_type === 'premium_key') {
    return { name: 'Premium Key', icon: null, isPremiumKey: true };
  }
  if (item.item_type === 'coins') {
    return { name: `${item.coin_amount} Coins`, icon: null, isCoins: true };
  }
  return { name: badge?.name || 'Badge', icon: badge?.icon_url || null, isBadge: true };
}

function ItemRow({ item }: { item: CaseItem }) {
  const display = getItemDisplay(item);
  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig.common;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: rarity.color }} />
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${rarity.color}18`, border: `1px solid ${rarity.color}40` }}>
        {display.isPremiumKey ? (
          <Key className="w-5 h-5" style={{ color: rarity.color }} />
        ) : display.isCoins ? (
          <Coins className="w-5 h-5 text-amber-400" />
        ) : display.icon ? (
          <img src={display.icon} alt="" className="w-6 h-6 object-contain" />
        ) : (
          <ShieldCheck className="w-5 h-5" style={{ color: rarity.color }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{display.name}</p>
        <p className="text-xs" style={{ color: rarity.color }}>{rarity.label}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">{parseFloat(item.drop_rate.toString()).toFixed(3)}%</p>
        <p className="text-xs text-gray-500">chance</p>
      </div>
    </div>
  );
}

export function CaseCard({ case: caseItem, onOpen, userBalance, index }: CaseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { data: items } = useCaseItems(showDetails ? caseItem.id : null);
  const canAfford = userBalance >= BigInt(caseItem.price);
  const accentColor = caseItem.accent_color || '#60a5fa';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        whileHover={{ y: -6, scale: 1.02 }}
        className="group relative cursor-pointer"
        onClick={() => canAfford && onOpen(caseItem.id)}
      >
        <div
          className="relative rounded-2xl overflow-hidden border transition-all duration-300"
          style={{
            background: caseItem.gradient_css || 'linear-gradient(135deg, #0d1b3e 0%, #1a3a6e 100%)',
            borderColor: `${accentColor}30`,
            boxShadow: `0 0 0 1px ${accentColor}20`,
          }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ boxShadow: `inset 0 0 60px ${accentColor}20` }}
          />

          {/* Case visual */}
          <div className="relative h-44 flex items-center justify-center p-4 overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: `radial-gradient(circle at 50% 60%, ${accentColor} 0%, transparent 70%)` }}
            />
            <motion.div
              className="relative z-10"
              style={{ filter: `drop-shadow(0 0 20px ${accentColor}60)` }}
              whileHover={{ scale: 1.08, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <CaseVisual caseName={caseItem.name} accentColor={accentColor} />
            </motion.div>
          </div>

          {/* Accent bar */}
          <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{caseItem.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{caseItem.description}</p>
            </div>

            {/* Price pill */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
            >
              <Coins className="w-3.5 h-3.5" />
              {formatUC(caseItem.price)}
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={(e) => { e.stopPropagation(); onOpen(caseItem.id); }}
                disabled={!canAfford}
                className="flex-1 text-sm font-semibold h-9 transition-all"
                style={canAfford ? {
                  background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
                  color: '#000',
                  border: 'none',
                } : {}}
              >
                {canAfford ? 'Open Case' : 'Need More Coins'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg flex-shrink-0 text-gray-400 hover:text-white"
                style={{ backgroundColor: `${accentColor}15` }}
                onClick={(e) => { e.stopPropagation(); setShowDetails(true); }}
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col bg-[#0a0a0f] border-white/10 p-0">
          {/* Header with gradient */}
          <div
            className="relative px-6 pt-6 pb-4 flex-shrink-0"
            style={{ background: caseItem.gradient_css || 'linear-gradient(135deg, #0d1b3e 0%, #1a3a6e 100%)' }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{ background: `radial-gradient(circle at 50% 100%, ${accentColor} 0%, transparent 60%)` }}
            />
            <div className="relative flex items-center gap-4">
              <div className="w-20 h-16 flex-shrink-0" style={{ filter: `drop-shadow(0 0 12px ${accentColor}80)` }}>
                <CaseVisual caseName={caseItem.name} accentColor={accentColor} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">{caseItem.name}</DialogTitle>
                <p className="text-sm text-gray-300 mt-0.5">{caseItem.description}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Coins className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="font-bold text-sm" style={{ color: accentColor }}>{formatUC(caseItem.price)} coins to open</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Possible Drops ({items?.length || 0})
            </p>
            {items?.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
            {!items && (
              <div className="text-center py-8 text-gray-500 text-sm">Loading items...</div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-4 pt-2 border-t border-white/5 flex-shrink-0">
            <Button
              onClick={() => { setShowDetails(false); onOpen(caseItem.id); }}
              disabled={!canAfford}
              className="w-full h-10 font-semibold"
              style={canAfford ? {
                background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
                color: '#000',
                border: 'none',
              } : {}}
            >
              {canAfford ? 'Open Now' : 'Insufficient Coins'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
