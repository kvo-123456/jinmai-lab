import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { llmService, ModelRole } from '../services/llmService';

interface RoleManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: ModelRole;
  onSave: (role: Omit<ModelRole, 'id' | 'created_at' | 'updated_at'>) => void;
  isDark: boolean;
}

// 编辑角色模态框组件
const EditRoleModal: React.FC<EditRoleModalProps> = ({ isOpen, onClose, role, onSave, isDark }) => {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(role?.system_prompt || '');
  const [temperature, setTemperature] = useState(role?.temperature || 0.7);
  const [topP, setTopP] = useState(role?.top_p || 0.9);
  const [presencePenalty, setPresencePenalty] = useState(role?.presence_penalty || 0);
  const [frequencyPenalty, setFrequencyPenalty] = useState(role?.frequency_penalty || 0);
  const [tags, setTags] = useState<string[]>(role?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isDefault, setIsDefault] = useState(role?.is_default || false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 重置表单
  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setSystemPrompt(role.system_prompt);
      setTemperature(role.temperature);
      setTopP(role.top_p);
      setPresencePenalty(role.presence_penalty);
      setFrequencyPenalty(role.frequency_penalty);
      setTags(role.tags || []);
      setIsDefault(role.is_default);
    } else {
      setName('');
      setDescription('');
      setSystemPrompt('');
      setTemperature(0.7);
      setTopP(0.9);
      setPresencePenalty(0);
      setFrequencyPenalty(0);
      setTags([]);
      setIsDefault(false);
    }
    setError(null);
    setTagInput('');
  }, [role, isOpen]);

  // 处理标签添加
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // 处理标签删除
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('角色名称不能为空');
      return;
    }

    if (!systemPrompt.trim()) {
      setError('系统提示词不能为空');
      return;
    }

    // 准备角色数据
    const roleData = {
      name: name.trim(),
      description: description.trim(),
      system_prompt: systemPrompt.trim(),
      temperature,
      top_p: topP,
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
      tags,
      is_default: isDefault
    };

    onSave(roleData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-2xl w-full mx-4 overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 模态框头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">{role ? '编辑角色' : '创建角色'}</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 模态框内容 */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          {/* 错误信息 */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm flex items-center dark:bg-red-900/20 dark:text-red-400`}>
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          {/* 角色名称 */}
          <div className="mb-4">
            <label htmlFor="role-name" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              角色名称
            </label>
            <input
              type="text"
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入角色名称"
              className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
          </div>

          {/* 角色描述 */}
          <div className="mb-4">
            <label htmlFor="role-description" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              角色描述
            </label>
            <input
              type="text"
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入角色描述"
              className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* 系统提示词 */}
          <div className="mb-4">
            <label htmlFor="system-prompt" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              系统提示词
            </label>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="请输入系统提示词"
              className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical min-h-[100px]`}
              required
            />
          </div>

          {/* 参数配置 */}
          <div className="mb-4">
            <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              模型参数配置
            </h4>

            {/* 温度 */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  温度 (Temperature)
                </label>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}
              />
            </div>

            {/* Top P */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  多样性 (Top P)
                </label>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {topP.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}
              />
            </div>

            {/* Presence Penalty */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  新主题权重 (Presence Penalty)
                </label>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {presencePenalty.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={presencePenalty}
                onChange={(e) => setPresencePenalty(parseFloat(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}
              />
            </div>

            {/* Frequency Penalty */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  重复内容惩罚 (Frequency Penalty)
                </label>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {frequencyPenalty.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={frequencyPenalty}
                onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}
              />
            </div>
          </div>

          {/* 标签管理 */}
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              标签
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="添加标签"
                className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm transition-colors`}
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className={`ml-1 text-xs font-bold hover:text-red-500 transition-colors`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 默认角色选项 */}
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="is-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className={`w-4 h-4 rounded ${isDark ? 'bg-gray-700 border-gray-600 text-blue-500' : 'border-gray-300 text-blue-500'}`}
            />
            <label htmlFor="is-default" className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              设置为默认角色
            </label>
          </div>

          {/* 按钮组 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 rounded-lg border transition-colors ${isDark
                ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              取消
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg transition-colors ${isDark
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              {role ? '保存修改' : '创建角色'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// 主角色管理组件
const RoleManager: React.FC<RoleManagerProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [roles, setRoles] = useState<ModelRole[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ModelRole | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载角色列表
  const loadRoles = () => {
    const rolesList = llmService.getRoles();
    setRoles(rolesList);
  };

  // 初始化和刷新角色列表
  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  // 处理创建角色
  const handleCreateRole = () => {
    setEditingRole(undefined);
    setIsEditModalOpen(true);
  };

  // 处理编辑角色
  const handleEditRole = (role: ModelRole) => {
    setEditingRole(role);
    setIsEditModalOpen(true);
  };

  // 处理删除角色
  const handleDeleteRole = (role: ModelRole) => {
    if (role.is_default) {
      toast.error('默认角色不能被删除');
      return;
    }

    const success = llmService.deleteRole(role.id);
    if (success) {
      toast.success(`已删除角色: ${role.name}`);
      loadRoles();
    } else {
      toast.error('删除角色失败');
    }
  };

  // 处理保存角色
  const handleSaveRole = (roleData: Omit<ModelRole, 'id' | 'created_at' | 'updated_at'>) => {
    let success = false;
    
    if (editingRole) {
      // 更新现有角色
      const updatedRole = llmService.updateRole(editingRole.id, roleData);
      success = updatedRole !== null;
      if (success) {
        toast.success(`已更新角色: ${roleData.name}`);
      }
    } else {
      // 创建新角色
      llmService.createRole(roleData);
      success = true;
      toast.success(`已创建角色: ${roleData.name}`);
    }

    if (success) {
      loadRoles();
    } else {
      toast.error('保存角色失败');
    }
  };

  // 过滤角色
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-4xl w-full mx-4 overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 面板头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">角色管理</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCreateRole}
              className={`px-4 py-2 rounded-lg transition-colors ${isDark
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-green-500 hover:bg-green-600'}
                text-white text-sm flex items-center`}
            >
              <i className="fas fa-plus mr-2"></i>
              新建角色
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              aria-label="关闭"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* 面板内容 */}
        <div ref={containerRef} className="p-6 overflow-y-auto flex-1">
          {/* 搜索框 */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索角色名称、描述或标签..."
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* 角色列表 */}
          {filteredRoles.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-search text-4xl mb-3"></i>
              <p>未找到匹配的角色</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`mt-2 text-sm text-blue-500 hover:underline`}
                >
                  清除搜索
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRoles.map((role) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-lg border p-4 transition-all hover:shadow-md ${isDark
                    ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    : 'bg-white border-gray-300 hover:border-gray-400'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {role.name}
                        </h4>
                        {role.is_default && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isDark
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-yellow-100 text-yellow-700'}`}
                          >
                            默认
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {role.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditRole(role)}
                        className={`p-2 rounded-lg text-sm transition-colors ${isDark
                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role)}
                        disabled={role.is_default}
                        className={`p-2 rounded-lg text-sm transition-colors ${role.is_default
                          ? isDark
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : isDark
                          ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400'
                          : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* 系统提示词预览 */}
                  <div className={`mb-3 p-3 rounded-lg text-xs ${isDark ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-50 text-gray-600'} overflow-hidden`}>
                    <div className="flex items-center mb-1">
                      <span className={`font-medium mr-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        系统提示词:
                      </span>
                    </div>
                    <p className="line-clamp-2">{role.system_prompt}</p>
                  </div>
                  
                  {/* 标签 */}
                  {role.tags && role.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {role.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`inline-block px-2 py-0.5 rounded-full text-xs ${isDark
                            ? 'bg-gray-600 text-gray-200'
                            : 'bg-gray-100 text-gray-700'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 参数概览 */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      温度: {role.temperature.toFixed(2)}
                    </span>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Top P: {role.top_p.toFixed(2)}
                    </span>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Presence Penalty: {role.presence_penalty.toFixed(2)}
                    </span>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Frequency Penalty: {role.frequency_penalty.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* 编辑角色模态框 */}
      <EditRoleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        role={editingRole}
        onSave={handleSaveRole}
        isDark={isDark}
      />
    </motion.div>
  );
};

export default RoleManager;