 import { useMemo } from 'react';
 import { User } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface TemplatePreviewProps {
   templateData: Record<string, unknown> | null;
   mini?: boolean;
 }
 
 export function TemplatePreview({ templateData, mini = false }: TemplatePreviewProps) {
   // Extract style properties from template data
   const styles = useMemo(() => {
     if (!templateData) return {};
     
     return {
       backgroundColor: templateData.background_color as string || '#0a0a0a',
       backgroundImage: templateData.background_url ? `url(${templateData.background_url})` : undefined,
       cardColor: templateData.card_color as string || 'rgba(0,0,0,0.6)',
       textColor: templateData.text_color as string || '#ffffff',
       accentColor: templateData.accent_color as string || '#8B5CF6',
       avatarShape: templateData.avatar_shape as string || 'rounded',
       cardStyle: templateData.card_style as string || 'glass',
       profileOpacity: (templateData.profile_opacity as number) ?? 100,
       profileBlur: (templateData.profile_blur as number) ?? 0,
       cardBorderEnabled: templateData.card_border_enabled as boolean || false,
       cardBorderColor: templateData.card_border_color as string || '#ffffff',
       cardBorderWidth: (templateData.card_border_width as number) ?? 1,
       glowUsername: templateData.glow_username as boolean || false,
     };
   }, [templateData]);
 
   const avatarClass = styles.avatarShape === 'circle' 
     ? 'rounded-full' 
     : styles.avatarShape === 'square' 
       ? 'rounded-lg' 
       : 'rounded-xl';
 
   if (mini) {
     return (
       <div 
         className="w-full h-full relative"
         style={{
           backgroundColor: styles.backgroundColor,
           backgroundImage: styles.backgroundImage,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
         }}
       >
         {/* Mini card preview */}
         <div className="absolute inset-0 flex items-center justify-center p-2">
           <div 
             className="w-full max-w-[80%] p-2 rounded-lg"
             style={{
               backgroundColor: styles.cardColor,
               opacity: styles.profileOpacity / 100,
               backdropFilter: styles.profileBlur > 0 ? `blur(${styles.profileBlur}px)` : undefined,
               border: styles.cardBorderEnabled 
                 ? `${Math.max(1, styles.cardBorderWidth / 2)}px solid ${styles.cardBorderColor}` 
                 : undefined,
             }}
           >
             <div className="flex items-center gap-1.5">
               <div 
                 className={cn("w-4 h-4 bg-muted flex items-center justify-center", avatarClass)}
                 style={{ backgroundColor: styles.accentColor + '30' }}
               >
                 <User className="w-2 h-2" style={{ color: styles.accentColor }} />
               </div>
               <div className="flex-1 space-y-0.5">
                 <div 
                   className="h-1.5 w-12 rounded-full" 
                   style={{ backgroundColor: styles.textColor + '80' }} 
                 />
                 <div 
                   className="h-1 w-8 rounded-full" 
                   style={{ backgroundColor: styles.textColor + '40' }} 
                 />
               </div>
             </div>
           </div>
         </div>
       </div>
     );
   }
 
   // Full preview
   return (
     <div 
       className="w-full h-full relative overflow-hidden"
       style={{
         backgroundColor: styles.backgroundColor,
         backgroundImage: styles.backgroundImage,
         backgroundSize: 'cover',
         backgroundPosition: 'center',
       }}
     >
       <div className="absolute inset-0 flex items-center justify-center p-6">
         <div 
           className="w-full max-w-xs p-6 rounded-2xl space-y-4"
           style={{
             backgroundColor: styles.cardColor,
             opacity: styles.profileOpacity / 100,
             backdropFilter: styles.profileBlur > 0 ? `blur(${styles.profileBlur}px)` : undefined,
             border: styles.cardBorderEnabled 
               ? `${styles.cardBorderWidth}px solid ${styles.cardBorderColor}` 
               : undefined,
           }}
         >
           {/* Avatar */}
           <div className="flex justify-center">
             <div 
               className={cn("w-20 h-20 flex items-center justify-center", avatarClass)}
               style={{ 
                 backgroundColor: styles.accentColor + '20',
                 border: `2px solid ${styles.accentColor}40`
               }}
             >
               <User className="w-10 h-10" style={{ color: styles.accentColor }} />
             </div>
           </div>
 
           {/* Username */}
           <div className="text-center space-y-1">
             <h3 
               className="text-lg font-bold"
               style={{ 
                 color: styles.textColor,
                 textShadow: styles.glowUsername ? `0 0 20px ${styles.accentColor}` : undefined
               }}
             >
               username
             </h3>
             <p 
               className="text-sm opacity-60"
               style={{ color: styles.textColor }}
             >
               Sample bio text here
             </p>
           </div>
 
           {/* Mock social links */}
           <div className="space-y-2">
             {[1, 2, 3].map((i) => (
               <div 
                 key={i}
                 className="h-8 rounded-lg"
                 style={{ 
                   backgroundColor: styles.accentColor + '15',
                   border: `1px solid ${styles.accentColor}30`
                 }}
               />
             ))}
           </div>
 
           {/* Mock badges */}
           <div className="flex justify-center gap-2">
             {[1, 2, 3].map((i) => (
               <div 
                 key={i}
                 className="w-6 h-6 rounded-full"
                 style={{ backgroundColor: styles.accentColor + '30' }}
               />
             ))}
           </div>
         </div>
       </div>
     </div>
   );
 }