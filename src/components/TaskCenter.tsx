import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 任务类型定义
interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'achievement';
  status: 'pending' | 'completed' | 'expired';
  reward: {
    points: number;
    badge?: string;
  };
  progress: number;
  target: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 模拟数据
const tasks: Task[] = [
  {
    id: '1',
    title: '每日签到',
    description: '连续签到7天可获得额外奖励',
    type: 'daily',
    status: 'pending',
    reward: { points: 10 },
    progress: 0,
    target: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: '完成3个创作任务',
    description: '创作并发布3个作品',
    type: 'weekly',
    status: 'pending',
    reward: { points: 50, badge: '创作达人' },
    progress: 1,
    target: 3,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: '邀请好友注册',
    description: '邀请3位好友注册并完成首次创作',
    type: 'monthly',
    status: 'pending',
    reward: { points: 100, badge: '邀请大使' },
    progress: 0,
    target: 3,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    title: '获得10个作品点赞',
    description: '作品累计获得10个点赞',
    type: 'achievement',
    status: 'pending',
    reward: { points: 30, badge: '人气之星' },
    progress: 5,
    target: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    title: '首次创作',
    description: '完成你的第一个创作作品',
    type: 'achievement',
    status: 'completed',
    reward: { points: 20, badge: '创作新星' },
    progress: 1,
    target: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const TaskCenter: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'achievement'>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    return selectedType === 'all' || task.type === selectedType;
  });

  // 处理任务完成
  const handleCompleteTask = (taskId: string) => {
    // 这里可以添加任务完成的逻辑
    console.log('完成任务:', taskId);
  };

  // 切换任务展开状态
  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  return (
    <div className={`min-h-screen p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">任务中心</h1>

        {/* 任务类型筛选 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { value: 'all', label: '全部任务' },
            { value: 'daily', label: '每日任务' },
            { value: 'weekly', label: '每周任务' },
            { value: 'monthly', label: '每月任务' },
            { value: 'achievement', label: '成就任务' }
          ].map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === type.value 
                ? isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white' 
                : isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* 任务列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg overflow-hidden shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              {/* 任务头部 */}
              <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{task.title}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {task.type === 'daily' ? '每日' : task.type === 'weekly' ? '每周' : task.type === 'monthly' ? '每月' : '成就'}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-500 text-white' : task.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>
                    {task.status === 'completed' ? '已完成' : task.status === 'pending' ? '进行中' : '已过期'}
                  </span>
                </div>
              </div>

              {/* 任务内容 */}
              <div className="p-4">
                <p className="text-sm opacity-70 mb-4">{task.description}</p>

                {/* 进度条 */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>进度</span>
                    <span>{task.progress}/{task.target}</span>
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(task.progress / task.target) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 奖励信息 */}
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm">奖励: {task.reward.points} 积分</span>
                  {task.reward.badge && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {task.reward.badge}
                    </span>
                  )}
                </div>

                {/* 截止日期 */}
                {task.deadline && (
                  <div className="text-sm mb-4">
                    <span className="opacity-70">截止日期: </span>
                    <span>{task.deadline.toLocaleDateString()}</span>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                    >
                      立即完成
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-200'} cursor-not-allowed`}
                      disabled
                    >
                      已完成
                    </button>
                  )}
                  <button
                    onClick={() => toggleTaskExpanded(task.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {expandedTask === task.id ? '收起' : '详情'}
                  </button>
                </div>

                {/* 展开的任务详情 */}
                {expandedTask === task.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <h4 className="font-medium mb-2">任务详情</h4>
                    <p className="text-sm opacity-70 mb-3">
                      {task.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="opacity-70">任务类型: </span>
                        <span>{task.type === 'daily' ? '每日任务' : task.type === 'weekly' ? '每周任务' : task.type === 'monthly' ? '每月任务' : '成就任务'}</span>
                      </div>
                      <div>
                        <span className="opacity-70">创建时间: </span>
                        <span>{task.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="opacity-70">更新时间: </span>
                        <span>{task.updatedAt.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="opacity-70">状态: </span>
                        <span>{task.status === 'completed' ? '已完成' : task.status === 'pending' ? '进行中' : '已过期'}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 无任务提示 */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">暂无任务</h3>
            <p className="opacity-70">请稍后再来查看</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCenter;