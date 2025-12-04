# API文档

## 🌟 API文档

### 1. 介绍

本API文档详细介绍了AI共创平台的API接口，包括认证、用户管理、作品管理、社区互动等方面的API。开发者可以使用这些API构建自己的应用或扩展平台功能。

### 2. 目录

```
- [1. 介绍](#1-介绍)
- [2. 目录](#2-目录)
- [3. 基本信息](#3-基本信息)
  - [3.1 基础URL](#31-基础url)
  - [3.2 认证方式](#32-认证方式)
  - [3.3 响应格式](#33-响应格式)
  - [3.4 错误码](#34-错误码)
- [4. API端点](#4-api端点)
  - [4.1 认证相关](#41-认证相关)
  - [4.2 用户管理](#42-用户管理)
  - [4.3 作品管理](#43-作品管理)
  - [4.4 社区互动](#44-社区互动)
  - [4.5 数据分析](#45-数据分析)
- [5. 示例代码](#5-示例代码)
- [6. 常见问题](#6-常见问题)
- [7. 总结](#7-总结)
```

### 3. 基本信息

#### 3.1 基础URL

```
https://api.example.com/v1
```

#### 3.2 认证方式

- **JWT认证**：使用JSON Web Token进行认证，在请求头中添加 `Authorization: Bearer <token>`
- **API密钥**：用于服务器间通信，在请求头中添加 `X-API-Key: <api-key>`

#### 3.3 响应格式

所有API响应都使用JSON格式，包含以下字段：

```json
{
  "code": 0,          // 状态码，0表示成功，非0表示失败
  "message": "成功",  // 状态消息
  "data": {}          // 响应数据
}
```

**示例成功响应**：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**示例失败响应**：

```json
{
  "code": 401,
  "message": "未授权",
  "data": null
}
```

#### 3.4 错误码

| 错误码 | 描述 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 405 | 方法不允许 |
| 500 | 服务器内部错误 |
| 501 | 未实现 |
| 502 | 网关错误 |
| 503 | 服务不可用 |
| 504 | 网关超时 |

### 4. API端点

#### 4.1 认证相关

##### 4.1.1 注册

- **URL**：`/auth/register`
- **方法**：`POST`
- **请求体**：
  ```json
  {
    "username": "string",      // 用户名，长度2-20字符
    "email": "string",         // 邮箱地址
    "password": "string",      // 密码，长度6-20字符
    "phone": "string",         // 手机号（可选）
    "interests": "string",     // 兴趣爱好（可选）
    "age": 0,                   // 年龄（可选）
    "tags": "string"           // 标签（可选）
  }
  ```
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "注册成功",
    "data": {
      "id": 0,
      "username": "string",
      "email": "string",
      "token": "string"
    }
  }
  ```

##### 4.1.2 登录

- **URL**：`/auth/login`
- **方法**：`POST`
- **请求体**：
  ```json
  {
    "email": "string",      // 邮箱地址
    "password": "string"    // 密码
  }
  ```
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "登录成功",
    "data": {
      "id": 0,
      "username": "string",
      "email": "string",
      "token": "string"
    }
  }
  ```

##### 4.1.3 刷新令牌

- **URL**：`/auth/refresh`
- **方法**：`POST`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "令牌刷新成功",
    "data": {
      "token": "string"
    }
  }
  ```

##### 4.1.4 退出登录

- **URL**：`/auth/logout`
- **方法**：`POST`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "退出成功",
    "data": null
  }
  ```

#### 4.2 用户管理

##### 4.2.1 获取用户信息

- **URL**：`/users/:id`
- **方法**：`GET`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "id": 0,
      "username": "string",
      "email": "string",
      "phone": "string",
      "avatar_url": "string",
      "interests": "string",
      "age": 0,
      "tags": "string",
      "created_at": 0,
      "updated_at": 0
    }
  }
  ```

##### 4.2.2 更新用户信息

- **URL**：`/users/:id`
- **方法**：`PUT`
- **请求头**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "username": "string",      // 用户名（可选）
    "email": "string",         // 邮箱地址（可选）
    "phone": "string",         // 手机号（可选）
    "avatar_url": "string",    // 头像URL（可选）
    "interests": "string",     // 兴趣爱好（可选）
    "age": 0,                   // 年龄（可选）
    "tags": "string"           // 标签（可选）
  }
  ```
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "更新成功",
    "data": {
      "id": 0,
      "username": "string",
      "email": "string"
    }
  }
  ```

##### 4.2.3 获取用户列表

- **URL**：`/users`
- **方法**：`GET`
- **请求头**：`Authorization: Bearer <token>`
- **查询参数**：
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认10
  - `keyword`: 搜索关键词（可选）
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "items": [
        {
          "id": 0,
          "username": "string",
          "email": "string"
        }
      ],
      "total": 0,
      "page": 1,
      "limit": 10
    }
  }
  ```

##### 4.2.4 删除用户

- **URL**：`/users/:id`
- **方法**：`DELETE`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "删除成功",
    "data": null
  }
  ```

#### 4.3 作品管理

##### 4.3.1 创建作品

- **URL**：`/works`
- **方法**：`POST`
- **请求头**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "title": "string",          // 作品标题
    "description": "string",    // 作品描述
    "image_url": "string",      // 作品图片URL
    "tags": "string",           // 作品标签
    "category": "string",       // 作品分类
    "cultural_elements": "string"  // 文化元素
  }
  ```
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "创建成功",
    "data": {
      "id": 0,
      "title": "string",
      "description": "string",
      "image_url": "string",
      "user_id": 0,
      "created_at": 0
    }
  }
  ```

##### 4.3.2 获取作品详情

- **URL**：`/works/:id`
- **方法**：`GET`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "id": 0,
      "title": "string",
      "description": "string",
      "image_url": "string",
      "user_id": 0,
      "username": "string",
      "tags": "string",
      "category": "string",
      "cultural_elements": "string",
      "likes": 0,
      "comments": 0,
      "created_at": 0,
      "updated_at": 0
    }
  }
  ```

##### 4.3.3 更新作品

- **URL**：`/works/:id`
- **方法**：`PUT`
- **请求头**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "title": "string",          // 作品标题（可选）
    "description": "string",    // 作品描述（可选）
    "image_url": "string",      // 作品图片URL（可选）
    "tags": "string",           // 作品标签（可选）
    "category": "string",       // 作品分类（可选）
    "cultural_elements": "string"  // 文化元素（可选）
  }
  ```
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "更新成功",
    "data": {
      "id": 0,
      "title": "string",
      "description": "string"
    }
  }
  ```

##### 4.3.4 获取作品列表

- **URL**：`/works`
- **方法**：`GET`
- **查询参数**：
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认10
  - `category`: 作品分类（可选）
  - `keyword`: 搜索关键词（可选）
  - `sort_by`: 排序字段，默认created_at
  - `sort_order`: 排序顺序，asc或desc，默认desc
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "items": [
        {
          "id": 0,
          "title": "string",
          "image_url": "string",
          "user_id": 0,
          "username": "string",
          "likes": 0,
          "comments": 0,
          "created_at": 0
        }
      ],
      "total": 0,
      "page": 1,
      "limit": 10
    }
  }
  ```

##### 4.3.5 删除作品

- **URL**：`/works/:id`
- **方法**：`DELETE`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "删除成功",
    "data": null
  }
  ```

#### 4.4 社区互动

##### 4.4.1 点赞作品

- **URL**：`/works/:id/like`
- **方法**：`POST`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "点赞成功",
    "data": {
      "likes": 0
    }
  }
  ```

##### 4.4.2 取消点赞

- **URL**：`/works/:id/unlike`
- **方法**：`POST`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "取消点赞成功",
    "data": {
      "likes": 0
    }
  }
  ```

##### 4.4.3 获取评论列表

- **URL**：`/works/:id/comments`
- **方法**：`GET`
- **查询参数**：
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认10
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "items": [
        {
          "id": 0,
          "content": "string",
          "user_id": 0,
          "username": "string",
          "created_at": 0
        }
      ],
      "total": 0,
      "page": 1,
      "limit": 10
    }
  }
  ```

##### 4.4.4 添加评论

- **URL**：`/works/:id/comments`
- **方法**：`POST`
- **请求头**：`Authorization: Bearer <token>`
- **请求体**：
  ```json
  {
    "content": "string"  // 评论内容
  }
  ```
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "评论成功",
    "data": {
      "id": 0,
      "content": "string",
      "user_id": 0,
      "username": "string",
      "created_at": 0
    }
  }
  ```

##### 4.4.5 删除评论

- **URL**：`/comments/:id`
- **方法**：`DELETE`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "删除成功",
    "data": null
  }
  ```

##### 4.4.6 关注用户

- **URL**：`/users/:id/follow`
- **方法**：`POST`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "关注成功",
    "data": {
      "followers": 0
    }
  }
  ```

##### 4.4.7 取消关注

- **URL**：`/users/:id/unfollow`
- **方法**：`POST`
- **请求头**：`Authorization: Bearer <token>`
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "取消关注成功",
    "data": {
      "followers": 0
    }
  }
  ```

#### 4.5 数据分析

##### 4.5.1 获取作品统计

- **URL**：`/analytics/works`
- **方法**：`GET`
- **请求头**：`Authorization: Bearer <token>`
- **查询参数**：
  - `start_date`: 开始日期，格式YYYY-MM-DD
  - `end_date`: 结束日期，格式YYYY-MM-DD
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "total_works": 0,
      "total_likes": 0,
      "total_comments": 0,
      "daily_data": [
        {
          "date": "2024-01-01",
          "works": 0,
          "likes": 0,
          "comments": 0
        }
      ]
    }
  }
  ```

##### 4.5.2 获取用户统计

- **URL**：`/analytics/users`
- **方法**：`GET`
- **请求头**：`Authorization: Bearer <token>`
- **查询参数**：
  - `start_date`: 开始日期，格式YYYY-MM-DD
  - `end_date`: 结束日期，格式YYYY-MM-DD
- **响应体**：
  ```json
  {
    "code": 0,
    "message": "成功",
    "data": {
      "total_users": 0,
      "new_users": 0,
      "active_users": 0,
      "daily_data": [
        {
          "date": "2024-01-01",
          "new_users": 0,
          "active_users": 0
        }
      ]
    }
  }
  ```

### 5. 示例代码

#### 5.1 JavaScript示例

```javascript
// 使用fetch API调用登录接口
async function login(email, password) {
  try {
    const response = await fetch('https://api.example.com/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.code === 0) {
      console.log('登录成功', data.data);
      localStorage.setItem('token', data.data.token);
    } else {
      console.error('登录失败', data.message);
    }
  } catch (error) {
    console.error('请求失败', error);
  }
}

// 使用fetch API获取作品列表
async function getWorks() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('https://api.example.com/v1/works', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (data.code === 0) {
      console.log('作品列表', data.data);
      return data.data;
    } else {
      console.error('获取作品列表失败', data.message);
    }
  } catch (error) {
    console.error('请求失败', error);
  }
}
```

#### 5.2 Python示例

```python
import requests

# 登录
url = 'https://api.example.com/v1/auth/login'
data = {
    'email': 'test@example.com',
    'password': 'password123'
}
response = requests.post(url, json=data)
result = response.json()
if result['code'] == 0:
    token = result['data']['token']
    print('登录成功', token)
else:
    print('登录失败', result['message'])

# 获取作品列表
url = 'https://api.example.com/v1/works'
headers = {
    'Authorization': f'Bearer {token}'
}
response = requests.get(url, headers=headers)
result = response.json()
if result['code'] == 0:
    works = result['data']['items']
    print('作品列表', works)
else:
    print('获取作品列表失败', result['message'])
```

#### 5.3 响应式设计示例

```javascript
// 根据不同设备尺寸调整API请求
async function getWorks() {
  const isMobile = window.innerWidth < 768;
  const limit = isMobile ? 5 : 10; // 移动端每页5条，桌面端每页10条
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://api.example.com/v1/works?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('请求失败', error);
  }
}
```

### 6. 常见问题

| 问题 | 解决方案 |
|------|----------|
| 如何获取API密钥？ | 联系管理员获取API密钥，用于服务器间通信 |
| JWT令牌过期怎么办？ | 使用刷新令牌API获取新的令牌，或重新登录 |
| API请求返回401错误？ | 检查Authorization头是否正确，令牌是否过期 |
| API请求返回403错误？ | 检查用户权限是否足够，是否有操作该资源的权限 |
| 如何处理API请求超时？ | 实现重试机制，或检查网络连接 |
| 如何获取更多数据？ | 使用分页查询，调整page和limit参数 |
| 如何搜索特定内容？ | 使用keyword查询参数进行搜索 |
| 如何排序数据？ | 使用sort_by和sort_order查询参数进行排序 |

### 7. 总结

本API文档详细介绍了AI共创平台的API接口，包括认证、用户管理、作品管理、社区互动和数据分析等方面的API。开发者可以使用这些API构建自己的应用或扩展平台功能。

如果您在使用API过程中遇到问题，请查看常见问题或联系技术支持团队。我们欢迎您的反馈和建议，共同改进API服务。

---

## 更新日志

- **2024-01-01**：初始版本发布
- **2024-02-15**：添加社区互动API
- **2024-03-30**：添加数据分析API
- **2024-04-15**：优化API响应格式

---

## 参考资料

1. [REST API设计最佳实践](https://restfulapi.net/)
2. [JSON Web Token (JWT) 认证](https://jwt.io/)
3. [HTTP状态码](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
4. [API设计指南](https://apiguide.dev/)
