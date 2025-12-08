import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';

// 直接导入游戏组件，避免懒加载可能带来的问题
import CulturalQuizGame from '@/components/CulturalQuizGame';
import CulturalMemoryGame from '@/components/CulturalMemoryGame';
import CulturalMatchingGame from '@/components/CulturalMatchingGame';
import CulturalPuzzleGame from '@/components/CulturalPuzzleGame';
import CulturalSortingGame from '@/components/CulturalSortingGame';
import CulturalRiddleGame from '@/components/CulturalRiddleGame';
import CulturalWordChainGame from '@/components/CulturalWordChainGame';
import CulturalSpotTheDifferenceGame from '@/components/CulturalSpotTheDifferenceGame';
import CulturalTimelineGame from '@/components/CulturalTimelineGame';
import CulturalPairMatchingGame from '@/components/CulturalPairMatchingGame';

const Games: React.FC = () => {
  const { isDark } = useTheme();
  const [showQuizGame, setShowQuizGame] = useState(false);
  const [showMemoryGame, setShowMemoryGame] = useState(false);
  const [showMatchingGame, setShowMatchingGame] = useState(false);
  const [showPuzzleGame, setShowPuzzleGame] = useState(false);
  const [showSortingGame, setShowSortingGame] = useState(false);
  const [showRiddleGame, setShowRiddleGame] = useState(false);
  const [showWordChainGame, setShowWordChainGame] = useState(false);
  const [showSpotTheDifferenceGame, setShowSpotTheDifferenceGame] = useState(false);
  const [showTimelineGame, setShowTimelineGame] = useState(false);
  const [showPairMatchingGame, setShowPairMatchingGame] = useState(false);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* 显示游戏组件 */}
      {showQuizGame ? (
        <CulturalQuizGame 
          isOpen={showQuizGame} 
          onClose={() => setShowQuizGame(false)} 
        />
      ) : showMemoryGame ? (
        <CulturalMemoryGame 
          isOpen={showMemoryGame} 
          onClose={() => setShowMemoryGame(false)} 
        />
      ) : showMatchingGame ? (
        <CulturalMatchingGame 
          isOpen={showMatchingGame} 
          onClose={() => setShowMatchingGame(false)} 
        />
      ) : showPuzzleGame ? (
        <CulturalPuzzleGame 
          isOpen={showPuzzleGame} 
          onClose={() => setShowPuzzleGame(false)} 
        />
      ) : showSortingGame ? (
        <CulturalSortingGame 
          isOpen={showSortingGame} 
          onClose={() => setShowSortingGame(false)} 
        />
      ) : showRiddleGame ? (
        <CulturalRiddleGame 
          isOpen={showRiddleGame} 
          onClose={() => setShowRiddleGame(false)} 
        />
      ) : showWordChainGame ? (
        <CulturalWordChainGame 
          isOpen={showWordChainGame} 
          onClose={() => setShowWordChainGame(false)} 
        />
      ) : showSpotTheDifferenceGame ? (
        <CulturalSpotTheDifferenceGame 
          isOpen={showSpotTheDifferenceGame} 
          onClose={() => setShowSpotTheDifferenceGame(false)} 
        />
      ) : showTimelineGame ? (
        <CulturalTimelineGame 
          isOpen={showTimelineGame} 
          onClose={() => setShowTimelineGame(false)} 
        />
      ) : showPairMatchingGame ? (
        <CulturalPairMatchingGame 
          isOpen={showPairMatchingGame} 
          onClose={() => setShowPairMatchingGame(false)} 
        />
      ) : (
        // 显示游戏介绍
        <div className="container mx-auto px-4 py-8">

          
          <GradientHero 
            title="文化知识游戏" 
            subtitle="通过游戏学习天津地方文化和中国传统文化" 
            theme="indigo"
            stats={[
              { label: '游戏类型', value: '多样化' },
              { label: '难度级别', value: '分关卡' },
              { label: '学习方式', value: '互动式' },
              { label: '挑战模式', value: '计时赛' }
            ]}
            pattern={true}
            size="lg"
          />

          {/* 游戏列表 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 grid md:grid-cols-2 gap-8 mb-12"
          >
            {/* 文化知识挑战 */}
            <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
              <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Cultural%20quiz%20game%20interface%20with%20traditional%20Chinese%20elements"
                  alt="文化知识挑战"
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <h2 className="text-2xl font-bold mb-3">文化知识挑战</h2>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                测试你对天津地方文化和中国传统文化的了解，包含多种题型和难度级别。
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>多种题型：单选题、多选题、判断题</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>关卡制：包含3个不同难度的关卡</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>计时挑战：记录你的答题时间</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>提示系统：提供提示帮助你解题</span>
                </li>
              </ul>
              <button
                onClick={() => setShowQuizGame(true)}
                className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
              >
                <i className="fas fa-question-circle mr-2"></i>开始挑战
              </button>
            </div>

            {/* 文化记忆游戏 */}
            <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
              <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Memory%20card%20game%20with%20Chinese%20cultural%20elements%20flip%20cards"
                  alt="文化记忆游戏"
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <h2 className="text-2xl font-bold mb-3">文化记忆游戏</h2>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                翻牌匹配相同的文化元素，挑战你的记忆力和文化知识，包含多种难度级别。
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>多种难度：4x4、6x6、8x8网格</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>精美的卡片设计：包含文化元素图片和介绍</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>计时挑战：记录你的完成时间</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>进度保存：记录你的游戏成就</span>
                </li>
              </ul>
              <button
                onClick={() => setShowMemoryGame(true)}
                className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
              >
                <i className="fas fa-gamepad mr-2"></i>开始游戏
              </button>
            </div>

            {/* 文化元素连连看 */}
            <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
              <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                <img
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Matching%20game%20with%20Chinese%20cultural%20elements%20cards"
                  alt="文化元素连连看"
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <h2 className="text-2xl font-bold mb-3">文化元素连连看</h2>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                通过匹配相同的文化元素卡片，了解中国传统文化和天津地方特色，赢取丰厚奖励！
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>多种关卡：从简单到困难，逐步挑战</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>丰富的文化元素：包含天津地方特色和中国传统文化</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>计时挑战：记录你的完成时间，挑战最佳成绩</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span>提示系统：遇到困难时可使用提示功能</span>
                </li>
              </ul>
              <button
                onClick={() => setShowMatchingGame(true)}
                className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
              >
                <i className="fas fa-gamepad mr-2"></i>开始游戏
              </button>
            </div>

            {/* 文化拼图游戏 */}
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
                  <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                    <img
                      src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Puzzle%20game%20with%20Chinese%20cultural%20elements%20in%20Tianjin"
                      alt="文化拼图游戏"
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">文化拼图游戏</h2>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    拼合文化图片碎片，了解天津地方文化和中国传统文化，挑战你的观察力和动手能力！
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>多种难度：4x4、5x5、6x6 不同规格的拼图</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>丰富的文化图片：包含天津地标、民俗文化和非遗技艺</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>计时挑战：记录你的完成时间和移动次数</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>提示功能：遇到困难时可使用提示和查看答案</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowPuzzleGame(true)}
                    className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
                  >
                    <i className="fas fa-gamepad mr-2"></i>开始游戏
                  </button>
                </div>

                {/* 文化元素排序游戏 */}
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
                  <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                    <img
                      src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Sorting%20game%20with%20Chinese%20cultural%20elements%20timeline"
                      alt="文化元素排序游戏"
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">文化元素排序游戏</h2>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    按照时间顺序或逻辑顺序排列文化元素，了解天津地方文化和中国传统文化的发展脉络！
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>多种排序类型：时间顺序、逻辑顺序</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>拖拽排序：支持直观的拖拽操作</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>计时挑战：记录你的完成时间</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>详细解析：提供文化元素的详细介绍</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowSortingGame(true)}
                    className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
                  >
                    <i className="fas fa-sort mr-2"></i>开始排序
                  </button>
                </div>

                {/* 文化猜谜游戏 */}
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
                  <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                    <img
                      src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Riddle%20game%20with%20Chinese%20cultural%20elements%20lanterns"
                      alt="文化猜谜游戏"
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">文化猜谜游戏</h2>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    根据提示猜文化元素、成语或历史人物，了解天津地方文化和中国传统文化的丰富内涵！
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>多种猜谜类型：文化元素、成语、历史人物</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>递进式提示：提供多级提示帮助解题</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>计时挑战：记录你的完成时间</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>详细解析：提供谜底的文化背景介绍</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowRiddleGame(true)}
                    className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
                  >
                    <i className="fas fa-lightbulb mr-2"></i>开始猜谜
                  </button>
                </div>

                {/* 文化词汇接龙游戏 */}
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
                  <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                    <img
                      src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Word%20chain%20game%20with%20Chinese%20cultural%20elements"
                      alt="文化词汇接龙游戏"
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">文化词汇接龙游戏</h2>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    从给定的文化词汇开始，按照规则接龙，挑战你的词汇量和文化知识！
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>丰富的文化词汇：涵盖天津地方文化和中国传统文化</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>拖拽式操作：直观的拖拽排序玩法</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>提示功能：遇到困难时可使用提示</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>详细解析：提供词汇的文化背景介绍</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowWordChainGame(true)}
                    className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
                  >
                    <i className="fas fa-link mr-2"></i>开始接龙
                  </button>
                </div>

                {/* 文化图片找茬游戏 */}
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
                  <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                    <img
                      src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Spot%20the%20difference%20game%20with%20Chinese%20cultural%20images"
                      alt="文化图片找茬游戏"
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">文化图片找茬游戏</h2>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    对比两张文化主题图片，找出所有不同之处，考验你的观察力和文化敏感度！
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>精美的文化图片：包含天津地方文化和中国传统文化元素</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>自动识别差异：点击图片即可标记差异</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>计时挑战：记录你的完成时间</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>详细解析：提供差异处的文化背景介绍</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowSpotTheDifferenceGame(true)}
                    className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-pink-600 hover:bg-pink-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
                  >
                    <i className="fas fa-search mr-2"></i>开始找茬
                  </button>
                </div>

                {/* 文化时间轴游戏 */}
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
                  <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                    <img
                      src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Timeline%20game%20with%20Chinese%20historical%20events"
                      alt="文化时间轴游戏"
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">文化时间轴游戏</h2>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    将历史文化事件按照时间顺序排列，了解天津和中国传统文化的发展脉络！
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>丰富的历史事件：涵盖不同时期的文化发展</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>拖拽式操作：直观的时间轴排序玩法</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>计时挑战：记录你的完成时间</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>详细解析：提供事件的历史背景介绍</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowTimelineGame(true)}
                    className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
                  >
                    <i className="fas fa-history mr-2"></i>开始排序
                  </button>
                </div>

                {/* 文化配对游戏 */}
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-xl transition-shadow`}>
                  <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                    <img
                      src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Pair%20matching%20game%20with%20Chinese%20cultural%20elements"
                      alt="文化配对游戏"
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">文化配对游戏</h2>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    翻转卡片，找到匹配的文化元素对，挑战你的记忆力和文化知识！
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>精美的卡片设计：包含文化元素图片和介绍</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>多种难度：不同数量的卡片组合</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>计时挑战：记录你的完成时间</span>
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>详细解析：提供配对元素的文化背景介绍</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowPairMatchingGame(true)}
                    className="w-full px-6 py-3 text-lg font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-300 shadow-md hover:shadow-xl"
                  >
                    <i className="fas fa-puzzle-piece mr-2"></i>开始配对
                  </button>
                </div>
          </motion.div>

          {/* 游戏特色介绍 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} mb-12`}
          >
            <h2 className="text-2xl font-bold mb-4">游戏特色</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                  <i className="fas fa-book-open text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">文化学习</h3>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  通过游戏了解天津地方文化和中国传统文化的丰富内涵
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <i className="fas fa-user-friends text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">互动体验</h3>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  丰富的互动设计，让学习变得更加有趣和生动
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  <i className="fas fa-trophy text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">挑战成就</h3>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  完成关卡获得奖励，解锁新的游戏内容和成就
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Games;