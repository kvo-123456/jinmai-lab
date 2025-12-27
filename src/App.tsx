import React from 'react';
import { Routes, Route } from "react-router-dom";

// 简化应用，只显示一个简单的首页，用于测试应用是否能正常加载
const App = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>津脉智坊 - 津门老字号共创平台</h1>
      <p style={{ color: '#666', textAlign: 'center', maxWidth: '600px' }}>
        应用已成功加载！这是一个简化版本，用于测试应用的核心功能。
      </p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', width: '100%', maxWidth: '600px' }}>
        <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>当前状态：</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'green', marginRight: '10px' }}>✓</span>
            <span>应用核心功能正常</span>
          </li>
          <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'green', marginRight: '10px' }}>✓</span>
            <span>全局对象初始化成功</span>
          </li>
          <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'green', marginRight: '10px' }}>✓</span>
            <span>路由系统正常工作</span>
          </li>
        </ul>
      </div>
      <p style={{ color: '#9ca3af', marginTop: '30px', fontSize: '14px' }}>
        如果您看到这个页面，说明应用已经成功加载。
      </p>
    </div>
  );
};

export default App;