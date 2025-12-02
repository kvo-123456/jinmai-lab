import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

import AnalyticsDashboard from '@/components/AnalyticsDashboard';

const Analytics: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnalyticsDashboard />
      </motion.div>
    </main>
  );
};

export default Analytics;
