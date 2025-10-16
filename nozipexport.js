// 下载所有应用YAML文件（动态日期，格式：应用名_dify_workflow_YYYYMMDD.yaml）
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
  const token = localStorage.console_token || sessionStorage.console_token || window.console_token;
  const dynamicDate = getDynamicDate(); // 动态生成当前日期
  if (!token) return console.error('❌ 未找到console_token，请先登录');

  // 3. 获取所有应用列表（支持分页）
  const fetchAllApps = async () => {
    const allApps = [];
    let page = 1;
    let hasMore = true;

    console.log('🔍 正在获取Dify应用列表...');

    while (hasMore) {
      try {
        const response = await fetch(`/console/api/apps?page=${page}&limit=100&name=&is_created_by_me=false`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`应用列表请求失败：${response.status}`);
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
        console.error(`❌ 获取第${page}页应用失败：`, err);
        hasMore = false;
      }
    }

    return allApps;
  };

  // 4. 下载单个应用的YAML文件
  const downloadAppYaml = async (app, index, total) => {
    try {
      const response = await fetch(`/console/api/apps/${app.id}/export?include_secret=false`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`应用【${app.name}】导出失败：${response.status}`);
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
      console.error(`❌ 应用【${app.name || app.id}】处理失败：`, err);
      return false;
    }
  };

  // 5. 主流程
  const main = async () => {
    try {
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
    } catch (err) {
      console.error('❌ 整体流程失败：', err);
    }
  };

  // 启动主流程
  main();
})();