// 下载所有应用YAML文件（动态日期，格式：应用名_dify_workflow_YYYYMMDD.yaml）
// 注意：此脚本仅适用于 Dify 版本 >= 1.10.0
// 对于 Dify < 1.10.0 版本，请使用 nozipexport.js
(() => {
  // 1. 获取动态日期（格式：YYYYMMDD，自动补0处理）
  const getDynamicDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份0-11，补0为2位
    const day = String(date.getDate()).padStart(2, '0'); // 日期1-31，补0为2位
    return `${year}${month}${day}`;
  };

  // 2. 基础配置
  const baseUrl = window.location.origin; // 添加基础URL支持
  const dynamicDate = getDynamicDate(); // 动态生成当前日期

  // 版本兼容性提示
  console.log('%c注意：此脚本仅适用于 Dify 版本 >= 1.10.0', 'color: #ff9800; font-weight: bold;');
  console.log('%c对于 Dify < 1.10.0 版本，请使用 nozipexport.js', 'color: #ff9800; font-weight: bold;');

  // 获取 CSRF token 的多种方式
  const getCsrfToken = () => {
    // 方式1: 从 meta 标签获取
    let csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    
    // 方式2: 从 cookie 中获取 csrf_token
    if (!csrfToken) {
      const cookies = document.cookie.split(';');
      const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf_token='));
      if (csrfCookie) {
        csrfToken = csrfCookie.split('=')[1];
      }
    }
    
    // 方式3: 从 localStorage 获取
    if (!csrfToken) {
      csrfToken = localStorage.getItem('csrf-token') || sessionStorage.getItem('csrf-token');
    }
    
    return csrfToken;
  };

  const csrfToken = getCsrfToken();

  if (!csrfToken) {
    console.error('❌ 未找到 CSRF Token，请先登录并在支持的页面运行此脚本');
    console.info('💡 提示：请确保您已登录Dify平台，并在应用列表等页面上运行此脚本');
    console.info('🔧 调试信息：');
    console.info('- Meta标签中的CSRF Token:', document.querySelector('meta[name="csrf-token"]')?.content);
    console.info('- Cookie中的信息:', document.cookie);
    console.info('- LocalStorage中的csrf-token:', localStorage.getItem('csrf-token'));
    console.info('- SessionStorage中的csrf-token:', sessionStorage.getItem('csrf-token'));
    return;
  }

  // 3. 获取所有应用列表（支持分页）
  const fetchAllApps = async () => {
    const allApps = [];
    let page = 1;
    let hasMore = true;

    console.log('🔍 正在获取Dify应用列表...');

    while (hasMore) {
      try {
        const response = await fetch(`${baseUrl}/console/api/apps?page=${page}&limit=100&name=&is_created_by_me=false`, {
          headers: { 
            'x-csrf-token': csrfToken,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(`认证失败，请检查您的登录状态和访问权限`);
          }
          throw new Error(`应用列表请求失败：${response.status} ${response.statusText}`);
        }

        const appData = await response.json();
        const apps = appData.data || [];
        
        if (apps.length === 0) {
          hasMore = false;
          break;
        }

        allApps.push(...apps);
        console.log(`✅ 已获取第${page}页应用，数量：${apps.length}`);
        
        // 如果当前页应用数量小于limit，说明已经是最后一页
        if (apps.length < 100) {
          hasMore = false;
        }
        
        page++;
      } catch (err) {
        console.error(`❌ 获取第${page}页应用失败：`, err.message || err);
        hasMore = false;
      }
    }

    return allApps;
  };

  // 4. 下载单个应用的YAML文件
  const downloadAppYaml = async (app, index, total) => {
    try {
      const response = await fetch(`${baseUrl}/console/api/apps/${app.id}/export?include_secret=false`, {
        headers: { 
          'x-csrf-token': csrfToken,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`应用【${app.name}】导出失败：${response.status} ${response.statusText}`);
      }

      const exportJson = await response.json();
      
      // 生成符合要求的文件名：应用名_dify_workflow_YYYYMMDD.yaml
      const safeAppName = (app.name || `unknown-app-${app.id}`).replace(/[<>:"/\\|?*]/g, '_'); // 清理非法文件名字符
      const fileName = `${safeAppName}_dify_workflow_${dynamicDate}.yaml`;
      
      // 生成YAML文件并触发下载
      const yamlBlob = new Blob([exportJson.data], { type: 'text/yaml;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(yamlBlob);
      const aTag = document.createElement('a');
      
      aTag.href = downloadUrl;
      aTag.download = fileName;
      document.body.appendChild(aTag);
      aTag.click(); // 模拟点击下载
      
      // 清理临时资源
      document.body.removeChild(aTag);
      URL.revokeObjectURL(downloadUrl);
      
      console.log(`✅ 已下载(${index + 1}/${total})：${fileName}`);
      return true;
    } catch (err) {
      console.error(`❌ 应用【${app.name || app.id}】处理失败：`, err.message || err);
      return false;
    }
  };

  // 5. 主流程
  const main = async () => {
    try {
      console.log(`🚀 开始执行Dify工作流批量导出任务`);
      console.log(`🌐 API基础地址: ${baseUrl}`);
      console.log(`📅 使用日期戳: ${dynamicDate}`);
      console.log(`🔑 CSRF Token: ${csrfToken ? '已找到' : '未找到'}`);
      
      // 获取所有应用
      const apps = await fetchAllApps();
      
      if (apps.length === 0) {
        console.error('❌ 未获取到任何应用数据');
        return;
      }
      
      console.log(`🎉 共获取到${apps.length}个应用，开始批量下载...`);
      
      // 逐个下载所有应用的YAML文件
      let successCount = 0;
      for (let i = 0; i < apps.length; i++) {
        const success = await downloadAppYaml(apps[i], i, apps.length);
        if (success) {
          successCount++;
        }
      }
      
      console.log(`\n🎉 批量下载完成！成功下载 ${successCount}/${apps.length} 个应用`);
      
      if (successCount !== apps.length) {
        console.warn(`⚠️ 有 ${apps.length - successCount} 个应用下载失败，请查看上方错误信息`);
      }
    } catch (err) {
      console.error('❌ 整体流程失败：', err.message || err);
    }
  };

  // 启动主流程
  main();
})();