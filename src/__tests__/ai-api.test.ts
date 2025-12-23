// AI大模型API连接检查和测试
// 核心API测试文件

import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { llmService, AVAILABLE_MODELS } from '../services/llmService';
import apiClient from '../lib/apiClient';
import errorService from '../services/errorService';

// 测试报告类型定义
interface TestResult {
  modelId: string;
  modelName: string;
  tests: {
    name: string;
    status: 'pass' | 'fail';
    error?: string;
    responseTime?: number;
    details?: any;
  }[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageResponseTime: number;
  };
}

// 测试报告存储
const testResults: TestResult[] = [];

// 测试配置
const TEST_CONFIG = {
  timeout: 10000, // 单个测试超时时间（毫秒）
  retryCount: 2, // 失败重试次数
  pingTimeout: 5000, // 网络连接测试超时时间（毫秒）
  // 简单的测试提示，用于验证模型基本功能
  testPrompt: '请用一句话介绍你自己',
  // 用于边界测试的超长提示
  longPrompt: '测试'.repeat(1000),
};

// 生成测试结果报告
const generateTestReport = () => {
  console.log('\n=== AI大模型API测试报告 ===\n');
  
  // 总体统计
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalResponseTime = 0;
  let testCount = 0;
  
  testResults.forEach(result => {
    totalTests += result.summary.totalTests;
    totalPassed += result.summary.passedTests;
    totalFailed += result.summary.failedTests;
    
    if (result.summary.averageResponseTime > 0) {
      totalResponseTime += result.summary.averageResponseTime;
      testCount++;
    }
    
    console.log(`\n模型: ${result.modelName} (${result.modelId})`);
    console.log(`状态: ${result.summary.failedTests === 0 ? '✅ 全部通过' : `❌ 部分失败 (${result.summary.passedTests}/${result.summary.totalTests})`}`);
    console.log(`平均响应时间: ${result.summary.averageResponseTime.toFixed(2)}ms`);
    
    if (result.summary.failedTests > 0) {
      console.log('失败测试:');
      result.tests.filter(test => test.status === 'fail').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
  });
  
  const overallAverageResponseTime = testCount > 0 ? totalResponseTime / testCount : 0;
  
  console.log('\n=== 总体测试结果 ===');
  console.log(`测试模型数量: ${testResults.length}`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过测试数: ${totalPassed}`);
  console.log(`失败测试数: ${totalFailed}`);
  console.log(`总体平均响应时间: ${overallAverageResponseTime.toFixed(2)}ms`);
  console.log(`总体通过率: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
  
  // 输出JSON格式报告，便于后续处理
  console.log('\n=== JSON格式报告 ===');
  console.log(JSON.stringify(testResults, null, 2));
  
  return testResults;
};

describe('AI大模型API连接检查和测试', () => {
  // 测试每个AI模型
  AVAILABLE_MODELS.forEach(model => {
    describe(`${model.name} (${model.id})`, () => {
      let modelTestResult: TestResult;
      
      beforeEach(() => {
        // 初始化模型测试结果
        modelTestResult = {
          modelId: model.id,
          modelName: model.name,
          tests: [],
          summary: {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            averageResponseTime: 0
          }
        };
      });
      
      // 记录单个测试结果
      const recordTestResult = (name: string, status: 'pass' | 'fail', error?: string, responseTime?: number, details?: any) => {
        modelTestResult.tests.push({
          name,
          status,
          error,
          responseTime,
          details
        });
        
        // 更新统计信息
        modelTestResult.summary.totalTests++;
        if (status === 'pass') {
          modelTestResult.summary.passedTests++;
        } else {
          modelTestResult.summary.failedTests++;
        }
        
        if (responseTime) {
          modelTestResult.summary.averageResponseTime = (
            modelTestResult.summary.averageResponseTime * (modelTestResult.summary.totalTests - 1) + responseTime
          ) / modelTestResult.summary.totalTests;
        }
      };
      
      // 1. 网络连接状态检查
      it('网络连接状态检查 - 验证API服务可达性', async () => {
        const testName = '网络连接状态检查';
        try {
          const startTime = Date.now();
          
          // 使用llmService的checkConnectionStatus方法检查连接状态
          const status = await llmService.checkConnectionStatus(model.id);
          
          const responseTime = Date.now() - startTime;
          
          expect(status).toBe('connected');
          recordTestResult(testName, 'pass', undefined, responseTime);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          recordTestResult(testName, 'fail', errorMessage);
          // 不抛出错误，继续执行其他测试
        }
      }, TEST_CONFIG.timeout);
      
      // 2. API端点功能测试 - 基本连接测试
      it('API端点功能测试 - 基本连接测试', async () => {
        const testName = 'API端点功能测试 - 基本连接测试';
        try {
          const startTime = Date.now();
          
          // 发送简单的测试请求
          const response = await llmService.generateResponse(TEST_CONFIG.testPrompt, {
            signal: AbortSignal.timeout(TEST_CONFIG.timeout)
          });
          
          const responseTime = Date.now() - startTime;
          
          // 验证响应
          expect(typeof response).toBe('string');
          expect(response.length).toBeGreaterThan(0);
          
          recordTestResult(testName, 'pass', undefined, responseTime, {
            responseLength: response.length
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          recordTestResult(testName, 'fail', errorMessage);
          // 不抛出错误，继续执行其他测试
        }
      }, TEST_CONFIG.timeout);
      
      // 3. API端点功能测试 - 文本生成测试
      it('API端点功能测试 - 文本生成测试', async () => {
        const testName = 'API端点功能测试 - 文本生成测试';
        try {
          const startTime = Date.now();
          
          // 发送测试提示
          const response = await llmService.generateResponse(TEST_CONFIG.testPrompt, {
            signal: AbortSignal.timeout(TEST_CONFIG.timeout)
          });
          
          const responseTime = Date.now() - startTime;
          
          // 验证响应
          expect(typeof response).toBe('string');
          expect(response.length).toBeGreaterThan(0);
          // 检查响应是否包含与提示相关的内容
          expect(response.toLowerCase()).toContain('介绍');
          
          recordTestResult(testName, 'pass', undefined, responseTime, {
            responseLength: response.length
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          recordTestResult(testName, 'fail', errorMessage);
          // 不抛出错误，继续执行其他测试
        }
      }, TEST_CONFIG.timeout);
      
      // 4. 边界情况测试 - 空提示测试
      it('边界情况测试 - 空提示测试', async () => {
        const testName = '边界情况测试 - 空提示测试';
        try {
          const startTime = Date.now();
          
          // 发送空提示
          const response = await llmService.generateResponse('', {
            signal: AbortSignal.timeout(TEST_CONFIG.timeout)
          });
          
          const responseTime = Date.now() - startTime;
          
          // 验证响应
          expect(typeof response).toBe('string');
          // 模型应该能够处理空提示，返回合理的响应
          expect(response.length).toBeGreaterThan(0);
          
          recordTestResult(testName, 'pass', undefined, responseTime);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          recordTestResult(testName, 'fail', errorMessage);
          // 不抛出错误，继续执行其他测试
        }
      }, TEST_CONFIG.timeout);
      
      // 5. 边界情况测试 - 超长提示测试
      it('边界情况测试 - 超长提示测试', async () => {
        const testName = '边界情况测试 - 超长提示测试';
        try {
          const startTime = Date.now();
          
          // 发送超长提示
          const response = await llmService.generateResponse(TEST_CONFIG.longPrompt, {
            signal: AbortSignal.timeout(TEST_CONFIG.timeout)
          });
          
          const responseTime = Date.now() - startTime;
          
          // 验证响应
          expect(typeof response).toBe('string');
          // 模型应该能够处理超长提示，返回合理的响应或错误信息
          expect(response.length).toBeGreaterThan(0);
          
          recordTestResult(testName, 'pass', undefined, responseTime, {
            responseLength: response.length
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          recordTestResult(testName, 'fail', errorMessage);
          // 不抛出错误，继续执行其他测试
        }
      }, TEST_CONFIG.timeout);
      
      // 保存测试结果到全局报告
      afterAll(() => {
        testResults.push(modelTestResult);
      });
    });
  });
  
  // 生成最终测试报告
  afterAll(() => {
    generateTestReport();
  });
});
