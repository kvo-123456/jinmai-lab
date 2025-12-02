import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import PrivacyModal from '@/components/PrivacyModal';
import InterestTagsSelector from '@/components/InterestTagsSelector';

// 注册表单验证模式
const registerSchema = z.object({
  username: z.string()
    .min(2, { message: '用户名至少需要2个字符' })
    .max(20, { message: '用户名最多20个字符' }),
  email: z.string()
    .email({ message: '请输入有效的邮箱地址' }),
  password: z.string()
    .min(8, { message: '密码至少需要8个字符' })
    .regex(/[a-zA-Z]/, { message: '密码需要包含至少一个字母' })
    .regex(/[0-9]/, { message: '密码需要包含至少一个数字' }),
});

export default function Register() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { register, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [age, setAge] = useState('');
  const [tags, setTags] = useState<string[]>(['国潮爱好者']);
  
  // 如果已登录，直接跳转到仪表板
  if (isAuthenticated) {
    navigate('/dashboard');
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    try {
      registerSchema.parse({ username, email, password });
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach(issue => {
          newErrors[issue.path[0]] = issue.message;
        });
        setErrors(newErrors);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await register(username, email, password, age, tags);
      
      if (success) {
        toast.success('注册成功！自动登录中...');
        navigate('/dashboard');
      } else {
        toast.error('注册失败，请稍后重试');
      }
    } catch (error) {
      toast.error('注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-red-600 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-600 opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      <motion.div 
        className={`relative z-10 w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-1">
            <span className="text-xl font-bold text-red-600">AI</span>
            <span className="text-xl font-bold">共创</span>
          </div>
          
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} transition-colors`}
            aria-label="切换主题"
          >
            {isDark ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
          </button>
        </div>
        
        <motion.h1 
          className="text-2xl font-bold mb-6"
          variants={itemVariants}
        >
          创建新账号
        </motion.h1>
        
        <motion.p 
          className="mb-8 opacity-70"
          variants={itemVariants}
        >
          加入AI共创平台，开启您的创意之旅
        </motion.p>
        
        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-6"
          variants={itemVariants}
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                errors.username 
                  ? "border-red-500 focus:ring-red-500" 
                  : isDark 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
              )}
              placeholder="请输入您的用户名"
              required
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium mb-2">年龄</label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                isDark 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
              )}
              placeholder="请输入您的年龄"
            />
          </div>

          <InterestTagsSelector value={tags} onChange={setTags} />
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">邮箱</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                errors.email 
                  ? "border-red-500 focus:ring-red-500" 
                  : isDark 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
              )}
              placeholder="请输入您的邮箱"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2",
                errors.password 
                  ? "border-red-500 focus:ring-red-500" 
                  : isDark 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:ring-red-500" 
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border focus:ring-red-500"
              )}
              placeholder="请设置您的密码"
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
            <p className="mt-1 text-xs opacity-60">密码至少8个字符，包含至少一个字母和一个数字</p>
          </div>
          
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                注册中...
              </>
            ) : (
              '注册'
            )}
          </motion.button>
        </motion.form>
        
        <motion.div 
          className="mt-8 text-center"
          variants={itemVariants}
        >
          <p className="opacity-70">
            已有账号？{' '}
            <Link to="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors">
              立即登录
            </Link>
          </p>
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center text-xs opacity-60"
          variants={itemVariants}
        >
          点击"注册"，即表示您同意我们的服务条款和隐私政策
        </motion.div>

        <PrivacyModal 
          open={showPrivacy}
          onAccept={() => setShowPrivacy(false)}
          onClose={() => setShowPrivacy(false)}
        />
      </motion.div>
    </div>
  );
}
