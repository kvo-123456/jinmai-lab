import React, { useState } from 'react';
import { llmService } from '../services/llmService';
import { motion } from 'framer-motion';

const ColorAssistant: React.FC = () => {
  const [theme, setTheme] = useState('国潮');
  const [style, setStyle] = useState('');
  const [colorScheme, setColorScheme] = useState<string[]>([]);
  const [colorAdvice, setColorAdvice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateColors = () => {
    setIsGenerating(true);
    
    // 生成色彩方案
    const scheme = llmService.generateColorScheme(theme, style);
    setColorScheme(scheme);
    
    // 获取色彩搭配建议
    const advice = llmService.getColorMatchingAdvice(scheme);
    setColorAdvice(advice);
    
    setIsGenerating(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">AI智能配色助手</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
            主题
          </label>
          <input
            type="text"
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="例如：国潮、天津、春节、自然"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
            风格（可选）
          </label>
          <input
            type="text"
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="例如：传统、现代、简约"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateColors}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? '生成中...' : '生成配色方案'}
        </motion.button>
      </div>
      
      {colorScheme.length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">生成的色彩方案</h3>
            <div className="grid grid-cols-5 gap-4">
              {colorScheme.map((color, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className="w-full h-32 rounded-lg shadow-md mb-2"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{color}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">色彩搭配建议</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{colorAdvice}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorAssistant;