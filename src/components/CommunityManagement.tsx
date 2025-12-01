import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// 类型定义
export type Community = {
  id: string;
  name: string;
  description: string;
  cover: string;
  tags: string[];
  members: number;
};

interface CommunityManagementProps {
  isDark: boolean;
  userCommunities: Community[];
  onUserCommunitiesChange: (communities: Community[]) => void;
  joinedCommunities: string[];
  onJoinedCommunitiesChange: (communities: string[]) => void;
  adminStore: Record<string, string[]>;
  onAdminStoreChange: (store: Record<string, string[]>) => void;
  memberStore: Record<string, string[]>;
  onMemberStoreChange: (store: Record<string, string[]>) => void;
  announceStore: Record<string, string>;
  onAnnounceStoreChange: (store: Record<string, string>) => void;
  privacyStore: Record<string, 'public' | 'private'>;
  onPrivacyStoreChange: (store: Record<string, 'public' | 'private'>) => void;
  currentEmail: string;
  communityTab: 'recommended' | 'user' | 'joined';
  onCommunityTabChange: (tab: 'recommended' | 'user' | 'joined') => void;
}

const CommunityManagement: React.FC<CommunityManagementProps> = ({
  isDark,
  userCommunities,
  onUserCommunitiesChange,
  joinedCommunities,
  onJoinedCommunitiesChange,
  adminStore,
  onAdminStoreChange,
  memberStore,
  onMemberStoreChange,
  announceStore,
  onAnnounceStoreChange,
  privacyStore,
  onPrivacyStoreChange,
  currentEmail,
  communityTab,
  onCommunityTabChange
}) => {
  // 状态管理
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newCommunityTags, setNewCommunityTags] = useState('');
  const [editDraft, setEditDraft] = useState<{ id: string; name: string; desc: string; tags: string } | null>(null);
  const [manageCommunityId, setManageCommunityId] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [expandedMembersId, setExpandedMembersId] = useState<string | null>(null);

  // 判断是否为管理员
  const isAdmin = (communityId: string) => {
    return adminStore[communityId]?.includes(currentEmail) || false;
  };

  // 创建新社群
  const createCommunity = () => {
    const name = newCommunityName.trim();
    const desc = newCommunityDesc.trim();
    const tags = newCommunityTags.split(',').map(t => t.trim()).filter(Boolean);
    
    if (!name) { toast.warning('请输入社群名称'); return; }
    if (!desc) { toast.warning('请输入社群简介'); return; }
    
    const id = `uc-${Date.now()}`;
    const cover = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=User%20community%20banner%20minimal%20style';
    
    const newCommunity: Community = { 
      id, 
      name, 
      description: desc, 
      cover, 
      tags, 
      members: 1 
    };
    
    // 更新状态
    onUserCommunitiesChange([newCommunity, ...userCommunities]);
    onJoinedCommunitiesChange([...joinedCommunities, id]);
    
    if (currentEmail) {
      onAdminStoreChange({ 
        ...adminStore, 
        [id]: [currentEmail] 
      });
    }
    
    // 重置表单
    setNewCommunityName('');
    setNewCommunityDesc('');
    setNewCommunityTags('');
    
    onCommunityTabChange('user');
    toast.success('已创建社群');
  };

  // 开始编辑社群
  const startEditCommunity = (community: Community) => {
    setEditDraft({
      id: community.id,
      name: community.name,
      desc: community.description,
      tags: community.tags.join(',')
    });
  };

  // 取消编辑社群
  const cancelEditCommunity = () => {
    setEditDraft(null);
  };

  // 保存编辑社群
  const saveEditCommunity = () => {
    if (!editDraft) return;
    
    const name = editDraft.name.trim();
    const desc = editDraft.desc.trim();
    const tags = editDraft.tags.split(',').map(t => t.trim()).filter(Boolean);
    
    if (!name || !desc) {
      toast.warning('名称与简介不能为空');
      return;
    }
    
    const updatedCommunities = userCommunities.map(c => 
      c.id === editDraft.id 
        ? { ...c, name, description: desc, tags } 
        : c
    );
    
    onUserCommunitiesChange(updatedCommunities);
    toast.success('已保存社群信息');
    setEditDraft(null);
  };

  // 删除社群
  const deleteCommunity = (communityId: string) => {
    if (!isAdmin(communityId)) {
      toast.warning('仅管理员可删除社群');
      return;
    }
    
    const updatedUserCommunities = userCommunities.filter(c => c.id !== communityId);
    const updatedJoinedCommunities = joinedCommunities.filter(id => id !== communityId);
    
    // 更新状态
    onUserCommunitiesChange(updatedUserCommunities);
    onJoinedCommunitiesChange(updatedJoinedCommunities);
    
    // 清理相关数据
    const updatedAdminStore = { ...adminStore };
    const updatedMemberStore = { ...memberStore };
    const updatedAnnounceStore = { ...announceStore };
    const updatedPrivacyStore = { ...privacyStore };
    
    delete updatedAdminStore[communityId];
    delete updatedMemberStore[communityId];
    delete updatedAnnounceStore[communityId];
    delete updatedPrivacyStore[communityId];
    
    onAdminStoreChange(updatedAdminStore);
    onMemberStoreChange(updatedMemberStore);
    onAnnounceStoreChange(updatedAnnounceStore);
    onPrivacyStoreChange(updatedPrivacyStore);
    
    toast.success('已删除社群');
  };

  // 打开管理面板
  const openManage = (communityId: string) => {
    setManageCommunityId(communityId);
    setNewMemberEmail('');
  };

  // 关闭管理面板
  const closeManage = () => {
    setManageCommunityId(null);
    setNewMemberEmail('');
  };

  // 添加成员
  const addMember = () => {
    if (!manageCommunityId) return;
    if (!isAdmin(manageCommunityId)) {
      toast.warning('仅管理员可添加成员');
      return;
    }
    
    const email = newMemberEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.warning('请输入有效邮箱');
      return;
    }
    
    const updatedMemberStore = {
      ...memberStore,
      [manageCommunityId]: Array.from(new Set([
        ...(memberStore[manageCommunityId] || []), 
        email
      ]))
    };
    
    onMemberStoreChange(updatedMemberStore);
    setNewMemberEmail('');
    toast.success('已添加成员');
  };

  // 移除成员
  const removeMember = (email: string) => {
    if (!manageCommunityId) return;
    if (!isAdmin(manageCommunityId)) {
      toast.warning('仅管理员可移除成员');
      return;
    }
    
    const updatedMemberStore = {
      ...memberStore,
      [manageCommunityId]: (memberStore[manageCommunityId] || []).filter(e => e !== email)
    };
    
    onMemberStoreChange(updatedMemberStore);
    toast.success('已移除成员');
  };

  // 设置社群公告
  const setAnnouncementForManaged = (text: string) => {
    if (!manageCommunityId) return;
    if (!isAdmin(manageCommunityId)) {
      toast.warning('仅管理员可设置公告');
      return;
    }
    
    const updatedAnnounceStore = {
      ...announceStore,
      [manageCommunityId]: text
    };
    
    onAnnounceStoreChange(updatedAnnounceStore);
    toast.success('公告已更新');
  };

  // 切换社群隐私设置
  const togglePrivacyForManaged = () => {
    if (!manageCommunityId) return;
    if (!isAdmin(manageCommunityId)) {
      toast.warning('仅管理员可切换隐私');
      return;
    }
    
    const currentPrivacy = privacyStore[manageCommunityId] || 'public';
    const updatedPrivacyStore: Record<string, 'public' | 'private'> = {
      ...privacyStore,
      [manageCommunityId]: currentPrivacy === 'public' ? 'private' : 'public'
    };
    
    onPrivacyStoreChange(updatedPrivacyStore);
    toast.success(`社群已切换为${currentPrivacy === 'public' ? '私密' : '公开'}模式`);
  };

  // 切换管理员角色
  const toggleAdminRole = (email: string) => {
    if (!manageCommunityId) return;
    if (!isAdmin(manageCommunityId)) {
      toast.warning('仅管理员可更改角色');
      return;
    }
    
    const currentAdmins = adminStore[manageCommunityId] || [];
    const updatedAdmins = currentAdmins.includes(email)
      ? currentAdmins.filter(e => e !== email)
      : [...currentAdmins, email];
    
    const updatedAdminStore = {
      ...adminStore,
      [manageCommunityId]: updatedAdmins
    };
    
    onAdminStoreChange(updatedAdminStore);
    toast.success('管理员角色已更新');
  };

  // 切换成员列表展开状态
  const toggleMembersExpanded = (communityId: string) => {
    setExpandedMembersId(expandedMembersId === communityId ? null : communityId);
  };

  return (
    <>
      {/* 创建新社群表单 */}
      {communityTab === 'user' && (
        <div className={`${isDark ? 'bg-gray-700' : 'bg-white/70'} p-4 rounded-xl mb-4 ring-1 ${isDark ? 'ring-gray-700' : 'ring-rose-200'}`}>
          <div className="text-sm opacity-70 mb-2">创建新社群</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              value={newCommunityName} 
              onChange={e => setNewCommunityName(e.target.value)} 
              placeholder="社群名称" 
              className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
            />
            <input 
              value={newCommunityDesc} 
              onChange={e => setNewCommunityDesc(e.target.value)} 
              placeholder="社群简介" 
              className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
            />
            <input 
              value={newCommunityTags} 
              onChange={e => setNewCommunityTags(e.target.value)} 
              placeholder="标签（逗号分隔）" 
              className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button 
              onClick={createCommunity} 
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white transition-colors hover:opacity-90"
            >
              创建
            </button>
          </div>
        </div>
      )}

      {/* 自建社群列表 */}
      {communityTab === 'user' && (
        <>
          {userCommunities.length === 0 ? (
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无自建社群，快来创建吧～</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userCommunities.map(c => (
                <motion.div 
                  key={c.id} 
                  className={`${isDark ? 'bg-gray-800' : 'bg-white/80'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-rose-200'} rounded-xl overflow-hidden shadow-sm`} 
                  whileHover={{ y: -4 }}
                >
                  <img src={c.cover} alt={c.name} className="w-full aspect-[4/3] object-cover" />
                  <div className="p-4">
                    <div className="font-medium mb-1 flex items-center gap-2">
                      {c.name}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-rose-100 text-rose-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-rose-200'}`}>个人</span>
                    </div>
                    <div className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.description}</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {c.tags.map((t, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>#{t}</span>
                      ))}
                    </div>
                    
                    {/* 成员列表 */}
                    <div className="mb-3">
                      <div 
                        className="text-xs opacity-70 flex items-center gap-1 cursor-pointer" 
                        onClick={() => toggleMembersExpanded(c.id)}
                      >
                        <span>成员 {memberStore[c.id]?.length || 1} 人</span>
                        <span>{expandedMembersId === c.id ? '▼' : '▶'}</span>
                      </div>
                      {expandedMembersId === c.id && (
                        <div className="mt-2 space-y-1 text-xs">
                          {[currentEmail, ...(memberStore[c.id] || [])].map((email, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span>{email}</span>
                              <span className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                {adminStore[c.id]?.includes(email) ? '管理员' : '成员'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {privacyStore[c.id] === 'private' ? '私密' : '公开'}
                      </div>
                      <div className="flex items-center gap-2">
                        {editDraft?.id === c.id ? (
                          <>
                            <button onClick={saveEditCommunity} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}>保存</button>
                            <button onClick={cancelEditCommunity} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>取消</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditCommunity(c)} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>编辑</button>
                            <button onClick={() => openManage(c.id)} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>管理</button>
                            <button onClick={() => deleteCommunity(c.id)} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}>删除</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 管理面板 */}
      {manageCommunityId && (
        <div className={`fixed inset-0 z-50 ${isDark ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-sm flex items-center justify-center p-4`}>
          <motion.div 
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">社群管理</h3>
              <button 
                onClick={closeManage} 
                className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-xl`}
              >
                ×
              </button>
            </div>
            
            {/* 成员管理 */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">成员管理</h4>
              <div className="flex items-center gap-2 mb-3">
                <input 
                  value={newMemberEmail} 
                  onChange={e => setNewMemberEmail(e.target.value)} 
                  placeholder="添加成员邮箱" 
                  className={`flex-1 ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
                />
                <button 
                  onClick={addMember} 
                  className={`${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'} px-3 py-2 rounded-lg text-sm`}
                >
                  添加
                </button>
              </div>
              <div className="space-y-2">
                {[currentEmail, ...(memberStore[manageCommunityId] || [])].map((email, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">{email}</div>
                      {adminStore[manageCommunityId]?.includes(email) && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`}>管理员</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {email !== currentEmail && (
                        <>
                          <button 
                            onClick={() => toggleAdminRole(email)} 
                            className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                          >
                            {adminStore[manageCommunityId]?.includes(email) ? '移除管理员' : '设为管理员'}
                          </button>
                          <button 
                            onClick={() => removeMember(email)} 
                            className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}
                          >
                            移除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 社群设置 */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">社群设置</h4>
              <div className="space-y-4">
                {/* 隐私设置 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">隐私设置</div>
                    <button 
                      onClick={togglePrivacyForManaged} 
                      className={`text-xs px-3 py-1 rounded-full ${privacyStore[manageCommunityId] === 'private' ? (isDark ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800') : (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')}`}
                    >
                      {privacyStore[manageCommunityId] === 'private' ? '私密' : '公开'}
                    </button>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {privacyStore[manageCommunityId] === 'private' ? '仅邀请成员可加入' : '所有人可加入'}
                  </div>
                </div>
                
                {/* 公告设置 */}
                <div>
                  <div className="text-sm mb-2">社群公告</div>
                  <textarea 
                    value={announceStore[manageCommunityId] || ''} 
                    onChange={e => setAnnouncementForManaged(e.target.value)} 
                    placeholder="输入社群公告" 
                    className={`w-full h-20 ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={closeManage} 
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} transition-colors hover:opacity-90`}
              >
                关闭
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default CommunityManagement;