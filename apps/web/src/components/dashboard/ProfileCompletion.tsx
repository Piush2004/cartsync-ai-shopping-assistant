"use client";

import { Card } from "@/components/ui/Card";
import { ConfidenceRing } from "@/components/ui/ConfidenceRing";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useRouter } from "next/navigation";

interface ProfileCompletionProps {
  percentage: number;
  hasBasicProfile: boolean;
  hasMeasurements: boolean;
  hasStylePreferences: boolean;
  hasBrands: boolean;
  hasRecHistory: boolean;
  hasFeedback: boolean;
  hasPhoto: boolean;
}

export function ProfileCompletion({ 
  percentage, 
  hasBasicProfile, 
  hasMeasurements, 
  hasStylePreferences, 
  hasBrands, 
  hasRecHistory, 
  hasFeedback, 
  hasPhoto 
}: ProfileCompletionProps) {
  const router = useRouter();
  
  const items = [
    { label: "Basic Profile", weight: "15%", completed: hasBasicProfile, action: "Complete", href: "/profile" },
    { label: "Body Measurements", weight: "30%", completed: hasMeasurements, action: "Add", href: "/measurements" },
    { label: "Style Preferences", weight: "15%", completed: hasStylePreferences, action: "Select", href: "/profile/style" },
    { label: "Favorite Brands", weight: "15%", completed: hasBrands, action: "Select", href: "/profile/brands" },
    { label: "Recommendations", weight: "10%", completed: hasRecHistory, action: "View", href: "/products" },
    { label: "Product Feedback", weight: "10%", completed: hasFeedback, action: "Rate", href: "/history" },
    { label: "Profile Photo", weight: "5%", completed: hasPhoto, action: "Upload", href: "/profile" },
  ];

  // Find next best action (highest weight incomplete item)
  const nextAction = items.find(i => !i.completed && i.label === "Body Measurements") 
    || items.find(i => !i.completed) 
    || items[0];

  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary mb-6">Profile Completion</h2>
      
      <div className="flex flex-col items-center justify-center mb-6">
        <ConfidenceRing value={percentage} size={100} strokeWidth={8} color="var(--color-accent-blue)" />
      </div>

      <div className="text-center mb-6">
        {percentage === 100 ? (
          <p className="text-sm text-accent-emerald font-medium">Your profile is perfect!</p>
        ) : (
          <p className="text-sm text-text-secondary leading-snug px-4">
            Complete your <span className="text-text-primary font-semibold">{nextAction.label.toLowerCase()}</span> to unlock more accurate recommendations.
          </p>
        )}
      </div>
      
      <motion.div 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="space-y-3 mb-8"
      >
        {items.map((item, i) => (
          <motion.div key={i} variants={staggerItem} className="flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3">
              {item.completed ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 * i + 0.5 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-accent-emerald" />
                </motion.div>
              ) : (
                <Circle className="w-5 h-5 text-border group-hover:text-accent-blue/50 transition-colors" />
              )}
              <span className={`text-sm transition-colors ${item.completed ? "text-text-primary font-medium" : "text-text-secondary group-hover:text-text-primary"}`}>
                {item.label}
              </span>
            </div>
            <span className="text-xs font-bold text-text-muted">{item.weight}</span>
          </motion.div>
        ))}
      </motion.div>
      
      {percentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          <Button variant="secondary" className="w-full" onClick={() => router.push(nextAction.href)}>
            {nextAction.action} {nextAction.label}
          </Button>
        </motion.div>
      )}
    </Card>
  );
}
