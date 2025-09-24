(() => {
  // 1. 动态加载JSZip库（提供多个备用源解决跨域问题）
  const loadJSZip = () => {
    return new Promise((resolve, reject) => {
      console.log('🔧 正在加载ZIP打包库...');
      
      // 备用CDN列表（按优先级排序）
      const jsZipSources = [
        'https://cdn.staticfile.org/jszip/3.10.1/jszip.min.js', // 阿里云静态资源CDN（国内节点，稳定性强）
        'https://static.cloud.tencent.com/ajax/libs/jszip/3.10.1/jszip.min.js', // 腾讯云静态资源CDN（国内节点，覆盖广）
        'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', // jsDelivr CDN（国际知名开源库CDN）
        'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js', // unpkg CDN（专注于npm包分发的CDN）
        'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js' // Cloudflare CDN（cdnjs项目，开源库分发）
      ];
      
      let currentSourceIndex = 0;
      
      // 尝试加载JSZip的函数
      const tryLoadSource = () => {
        if (currentSourceIndex >= jsZipSources.length) {
          reject(new Error('所有ZIP库源都加载失败，请检查网络或手动引入JSZip'));
          return;
        }
        
        const script = document.createElement('script');
        const currentSource = jsZipSources[currentSourceIndex];
        console.log(`尝试从源 ${currentSourceIndex + 1}/${jsZipSources.length} 加载: ${currentSource}`);
        
        script.src = currentSource;
        script.onload = () => {
          if (window.JSZip) {
            console.log('✅ ZIP库加载成功');
            resolve(window.JSZip);
          } else {
            console.warn(`❌ 源 ${currentSourceIndex + 1} 加载但未找到JSZip对象，尝试下一个源...`);
            currentSourceIndex++;
            tryLoadSource();
          }
        };
        
        script.onerror = () => {
          console.warn(`❌ 源 ${currentSourceIndex + 1} 加载失败，尝试下一个源...`);
          currentSourceIndex++;
          tryLoadSource();
        };
        
        // 设置超时处理（10秒）
        setTimeout(() => {
          if (!window.JSZip) {
            console.warn(`⏰ 源 ${currentSourceIndex + 1} 加载超时，尝试下一个源...`);
            script.remove(); // 移除未加载完成的脚本
            currentSourceIndex++;
            tryLoadSource();
          }
        }, 10000);
        
        document.head.appendChild(script);
      };
      
      // 开始加载
      tryLoadSource();
    });
  };

  // 2. 获取动态日期（格式：YYYYMMDD，自动补0）
  const getDynamicDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // 3. 核心：获取应用YAML并打包成ZIP
  const fetchAppsAndZip = async (JSZip) => {
    const token = localStorage.console_token || sessionStorage.console_token || window.console_token;
    const dynamicDate = getDynamicDate();
    if (!token) {
      console.error('❌ 未找到console_token，请先登录Dify控制台');
      return;
    }

    try {
      // 3.1 获取应用列表
      console.log('🔍 正在获取Dify应用列表...');
      const appRes = await fetch('/console/api/apps?page=1&limit=30&name=&is_created_by_me=false', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (!appRes.ok) throw new Error(`应用列表请求失败：${appRes.status}`);

      const appData = await appRes.json();
      const apps = appData.data || [];
      if (apps.length === 0) {
        console.error('❌ 未获取到任何应用数据');
        return;
      }
      console.log(`✅ 共获取到 ${apps.length} 个应用，开始下载YAML并打包...`);

      // 3.2 初始化ZIP，批量添加YAML文件
      const zip = new JSZip();

      // 用Promise.all确保所有YAML都添加到ZIP后再生成文件
      const addToZipPromises = apps.map((app, index) => {
        return fetch(`/console/api/apps/${app.id}/export?include_secret=false`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(exportJson => {
          // 生成符合要求的YAML文件名
          const safeAppName = app.name || `unknown-app-${app.id}`;
          const yamlFileName = `${safeAppName}_dify_workflow_${dynamicDate}.yaml`;
          // 将YAML文件添加到ZIP
          zip.file(yamlFileName, exportJson.data);
          console.log(`✅ 已添加到压缩包 (${index + 1}/${apps.length})：${yamlFileName}`);
          return true;
        })
        .catch(err => {
          console.error(`❌ 应用【${app.name || app.id}】处理失败：${err.message}`);
          return false;
        });
      });

      // 3.3 等待所有文件添加完成，生成ZIP
      await Promise.all(addToZipPromises);
      console.log('\n⏳ 正在生成ZIP压缩包...');
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE' // 不压缩（仅打包，速度快）
      });

      // 3.4 下载ZIP压缩包
      const zipFileName = `dify_apps_yaml_压缩包_${dynamicDate}.zip`;
      const downloadUrl = URL.createObjectURL(zipBlob);
      const aTag = document.createElement('a');
      aTag.href = downloadUrl;
      aTag.download = zipFileName;
      document.body.appendChild(aTag);
      aTag.click();

      // 清理资源
      document.body.removeChild(aTag);
      URL.revokeObjectURL(downloadUrl);
      console.log(`\n🎉 压缩包生成完成！已下载：${zipFileName}`);
      console.log(`📌 提示：解压后可直接获取每个应用的独立YAML文件`);

    } catch (globalErr) {
      console.error(`\n❌ 整体流程失败：${globalErr.message}`);
    }
  };

  // 启动流程：先加载ZIP库，再执行打包
  loadJSZip()
    .then(JSZip => fetchAppsAndZip(JSZip))
    .catch(err => console.error(`❌ 初始化失败：${err.message}`));
})();
