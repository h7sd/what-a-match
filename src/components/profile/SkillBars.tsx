import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface Skill {
  name: string;
  percentage: number;
  icon?: string;
  color?: string;
}

interface SkillBarsProps {
  skills: Skill[];
  accentColor?: string;
  visible?: boolean;
}

export function SkillBars({ skills, accentColor = '#8B5CF6', visible = true }: SkillBarsProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setAnimate(true), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible || skills.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-center mb-4">Skills</h3>
      
      <div className="space-y-4">
        {skills.map((skill, index) => (
          <div key={skill.name} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                {skill.icon && (
                  <img src={skill.icon} alt={skill.name} className="w-5 h-5" />
                )}
                <span>{skill.name}</span>
              </div>
              <span className="text-muted-foreground">{skill.percentage}%</span>
            </div>
            
            <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: animate ? `${skill.percentage}%` : 0 }}
                transition={{ 
                  duration: 1.5, 
                  delay: index * 0.2,
                  ease: "easeOut" 
                }}
                className="h-full rounded-full"
                style={{
                  background: skill.color || `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
