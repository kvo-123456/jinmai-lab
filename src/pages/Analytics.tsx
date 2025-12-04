import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

// 数据分析页面
export default function Analytics() {
  const { isDark } = useTheme();

  return (
    <>
      <GradientHero 
        title="数据分析与洞察" 
        subtitle="深入了解作品表现、用户活动和主题趋势"
        theme="indigo"
        stats={[
          { label: '总数据点数', value: '10,000+' },
          { label: '分析维度', value: '7+' },
          { label: '实时更新', value: 'Yes' }
        ]}
        pattern={true}
        size="md"
      />

      <main className="container mx-auto px-4 py-8">
        <AnalyticsDashboard />
      </main>
    </>
  );
}