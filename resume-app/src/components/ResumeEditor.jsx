import React, { useState, useRef, useEffect } from 'react';
// 确保导入 html2pdf
import html2pdf from 'html2pdf.js'; 
import { v4 as uuidv4 } from 'uuid'; // 添加这一行导入 uuid
import EditorPanel from './EditorPanel';
import A4Resume from './Resume';
import ResumeSettings from './ResumeSettings';
import ComponentEditor from './ComponentEditor';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// 初始设置
const initialResumeSettings = {
  pageSize: 'a4',
  orientation: 'portrait',
  themeColor: '#2196F3',
  backgroundColor: '#ffffff',
  fontFamily: "'Noto Sans SC', sans-serif",
  layout: 'standard',
  margins: {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
  }
};

// 创建新页面的默认设置
const createDefaultPage = (settings = {}) => ({
  id: uuidv4(),
  width: 210, // 默认 A4 宽度（mm）
  height: 297, // 默认 A4 高度（mm）
  orientation: 'portrait',
  margins: {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
  },
  backgroundColor: '#ffffff',
  components: [], // 页面中的组件
  ...settings // 允许覆盖默认设置
});

const ResumeEditor = ({ defaultSettings, defaultPages, activePageIndex = 0 }) => {
  const [pages, setPages] = useState([createDefaultPage()]); // 初始化一个页面
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [resumeSettings, setResumeSettings] = useState(initialResumeSettings);
  const resumeRef = useRef(null); // 整个简历预览区域的引用
  const pageRefs = useRef([]); // 用于存储每个页面的引用
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewImages, setPreviewImages] = useState([]); // 用于存储多页预览图像
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [openComponentId, setOpenComponentId] = useState(null); // 当前打开的组件ID
  const [exportMode, setExportMode] = useState('none'); // 'none', 'pdf', 'image'
  
  // 当页面数量变化时，确保pageRefs数组正确初始化
  useEffect(() => {
    pageRefs.current = Array(pages.length).fill(null);
  }, [pages.length]);

  // 设置页面引用的回调函数
  const setPageRef = (index, element) => {
    if (element && pageRefs.current) {
      pageRefs.current[index] = element;
    }
  };

  // 添加新页面
  const addPage = (settings = {}) => {
    // 获取当前页面作为模板
    const currentPage = pages[currentPageIndex];
    
    // 深拷贝当前页面的所有组件，并为每个组件生成新的ID
    const clonedComponents = currentPage.components.map(comp => {
      // 创建组件的深拷贝
      const clonedComponent = JSON.parse(JSON.stringify(comp));
      // 为主组件生成新的ID
      clonedComponent.id = uuidv4();
      
      // 如果组件有特殊子项也需要生成新ID (如作品集或图片集中的项目)
      if (clonedComponent.type === 'portfolio' && clonedComponent.content.portfolioItems) {
        clonedComponent.content.portfolioItems = clonedComponent.content.portfolioItems.map(item => ({
          ...item,
          id: uuidv4()
        }));
      }
      
      if (clonedComponent.type === 'image' && clonedComponent.content.images) {
        clonedComponent.content.images = clonedComponent.content.images.map(image => ({
          ...image,
          id: uuidv4()
        }));
      }
      
      return clonedComponent;
    });
    
    // 创建新页面，保留原页面的设置并复制组件
    const newPage = {
      ...createDefaultPage(settings),
      margins: { ...currentPage.margins },
      backgroundColor: currentPage.backgroundColor,
      components: clonedComponents
    };
    
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length); // 切换到新页面
    setOpenComponentId(null); // 关闭所有已打开的组件
  };

  // 删除页面
  const deletePage = (pageIndex) => {
    if (pages.length <= 1) return; // 保持至少一个页面
    const newPages = pages.filter((_, index) => index !== pageIndex);
    setPages(newPages);
    if (currentPageIndex >= pageIndex) {
      setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    }
  };

  // 更新页面设置
  const updatePageSettings = (pageIndex, settings) => {
    const updatedPages = pages.map((page, index) => 
      index === pageIndex ? { ...page, ...settings } : page
    );
    setPages(updatedPages);
  };

  // 添加组件到当前页面
  const addComponent = (type) => {
    const defaultPosition = { x: 0, y: 0 };
    const newComponent = createDefaultComponent(type, defaultPosition);
    const newComponentId = newComponent.id;
    
    setPages(pages.map((page, index) => 
      index === currentPageIndex 
        ? { ...page, components: [...page.components, newComponent] }
        : page
    ));
    
    // 添加后自动展开该组件
    setOpenComponentId(newComponentId);
  };
  
  // 更新组件的处理函数
  const updateComponent = (componentId, updatedComponent) => {
    setPages(pages.map((page, index) => 
      index === currentPageIndex 
        ? {
            ...page,
            components: page.components.map(comp => 
              comp.id === componentId ? updatedComponent : comp
            )
          }
        : page
    ));
  };
  
  // 删除组件的处理函数
  const deleteComponent = (componentId) => {
    // 如果删除的是当前打开的组件，清除openComponentId
    if (componentId === openComponentId) {
      setOpenComponentId(null);
    }
    
    setPages(pages.map((page, index) => 
      index === currentPageIndex 
        ? {
            ...page,
            components: page.components.filter(comp => comp.id !== componentId)
          }
        : page
    ));
  };
  
  // 复制组件的处理函数
  const duplicateComponent = (componentId) => {
    const componentToDuplicate = pages[currentPageIndex].components.find(comp => comp.id === componentId);
    if (componentToDuplicate) {
      const duplicatedComponent = {
        ...componentToDuplicate,
        id: uuidv4(), // 使用uuid生成新的ID
        style: {
          ...componentToDuplicate.style,
          x: (componentToDuplicate.style.x || 0) + 20, // 稍微偏移位置
          y: (componentToDuplicate.style.y || 0) + 20
        }
      };
      
      setPages(pages.map((page, index) => 
        index === currentPageIndex 
          ? { ...page, components: [...page.components, duplicatedComponent] }
          : page
      ));
      
      // 复制后自动展开新组件
      setOpenComponentId(duplicatedComponent.id);
    }
  };
  
  // 创建默认组件的辅助函数
  const createDefaultComponent = (type, position = { x: 0, y: 0 }) => {
    // 创建一个基础组件对象
    const baseComponent = {
      id: uuidv4(),
      type,
      style: {
        x: position.x,
        y: position.y,
        width: 250,
        height: 'auto',
        paddingTop: 15,
        paddingRight: 15,
        paddingBottom: 15,
        paddingLeft: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        shadow: true,
        zIndex: 10
      },
      content: {}
    };
  
    // 根据类型添加特定内容
    switch (type) {
      case 'personalInfo':
        return {
          ...baseComponent,
          content: {
            name: '姓名',
            title: '职位',
            avatar: '',
            contact: [
              { id: 1, type: 'Email', value: 'example@email.com' },
              { id: 2, type: 'Phone', value: '123-456-7890' }
            ]
          },
          style: {
            ...baseComponent.style,
            backgroundColor: resumeSettings.themeColor,
            width: 250
          }
        };
        
      case 'skills':
        return {
          ...baseComponent,
          content: {
            skills: [
              { name: '技能1', rating: 4 },
              { name: '技能2', rating: 3 }
            ]
          },
          style: {
            ...baseComponent.style,
            showProgressBar: true,
            width: 250
          }
        };
        
      case 'summary':
        return {
          ...baseComponent,
          content: {
            text: '这里是您的个人简介...'
          },
          style: {
            ...baseComponent.style,
            width: 500
          }
        };
        
      case 'education':
        return {
          ...baseComponent,
          content: {
            education: [
              {
                degree: '学位',
                school: '学校名称',
                dates: '2018 - 2022',
                description: '专业描述'
              }
            ]
          },
          style: {
            ...baseComponent.style,
            width: 500
          }
        };
        
      case 'experience':
        return {
          ...baseComponent,
          content: {
            experience: [
              {
                position: '职位',
                company: '公司名称',
                startDate: '2022年1月',
                endDate: '至今',
                description: '工作描述'
              }
            ]
          },
          style: {
            ...baseComponent.style,
            width: 500
          }
        };
        
      case 'achievements':
        return {
          ...baseComponent,
          content: {
            achievements: [
              '成就1',
              '成就2'
            ]
          },
          style: {
            ...baseComponent.style,
            width: 250
          }
        };
        
      case 'hobbies':
        return {
          ...baseComponent,
          content: {
            hobbies: ['阅读', '旅行', '摄影', '健身']
          },
          style: {
            ...baseComponent.style,
            width: 250
          }
        };
        
      case 'portfolio':
        return {
          ...baseComponent,
          content: {
            title: '个人成果展示', // 添加标题字段
            portfolioItems: [
              {
                id: uuidv4(),
                title: '项目名称',
                description: '项目描述',
                link: 'https://example.com',
                image: ''
              }
            ]
          },
          style: {
            ...baseComponent.style,
            width: 500
          }
        };
        
      case 'image':
        return {
          ...baseComponent,
          content: {
            title: '图片集', // 可编辑的标题字段
            images: [
              {
                id: uuidv4(),
                title: '图片标题', // 图片标题
                description: '图片描述', // 图片描述
                src: '', // 图片源
                scale: 1,
                offsetX: 0,
                offsetY: 0,
                width: '100%',
                align: 'center',
                borderStyle: 'none',
                borderWidth: 1,
                borderRadius: 0,
                shadow: false
              }
            ]
          },
          style: {
            ...baseComponent.style,
            width: 500
          }
        };
        
      default:
        return baseComponent;
    }
  };
  
  // 生成预览图
  const generatePreview = async (mode = 'pdf') => {
    // 设置预览状态
    setIsGeneratingPreview(true);
    setPreviewDialogOpen(true);
    setExportMode(mode);
    
    // 创建页面预览数组
    const pagePreviews = [];
    
    try {
      // 确保pageRefs数组有足够的长度
      if (pageRefs.current.length < pages.length) {
        pageRefs.current = Array(pages.length).fill(null);
      }
      
      // 为每个页面生成预览
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageRef = pageRefs.current[i];
        
        if (!pageRef) {
          console.warn(`无法找到页面 ${i + 1} 的引用`);
          continue;
        }

        const element = pageRef.querySelector('.a4-page');
        if (!element) {
          console.warn(`无法找到页面 ${i + 1} 的简历内容区域`);
          continue;
        }

        // 页面尺寸
        const pageWidth = page.width;
        const pageHeight = page.height;

        // 创建临时容器
        const container = document.createElement('div');
        container.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: ${pageWidth}mm;
          height: ${pageHeight}mm;
          background-color: ${page.backgroundColor || '#ffffff'};
          overflow: hidden;
        `;
        document.body.appendChild(container);

        // 克隆元素
        const clone = element.cloneNode(true);
        clone.style.cssText = `
          width: ${pageWidth}mm !important;
          height: ${pageHeight}mm !important;
          margin: 0 !important;
          padding: ${page.margins?.top || 0}mm ${page.margins?.right || 0}mm ${page.margins?.bottom || 0}mm ${page.margins?.left || 0}mm !important;
          background-color: ${page.backgroundColor || '#ffffff'} !important;
          box-sizing: border-box !important;
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          overflow: hidden !important;
        `;
        
        // 确保所有组件在导出时位置正确
        const componentElements = clone.querySelectorAll('[data-component-id]');
        componentElements.forEach(componentEl => {
          componentEl.style.position = 'absolute';
          componentEl.style.overflow = 'visible';
          
          // 移除拖拽控制按钮，以避免它们出现在导出的PDF中
          const controlButtons = componentEl.querySelectorAll('.no-drag');
          controlButtons.forEach(btn => btn.remove());
        });
        
        container.appendChild(clone);

        // 使用html2canvas渲染
        const scale = 3; // 增加缩放比例以提高清晰度
        const canvas = await html2canvas(clone, {
          scale: scale,
          useCORS: true,
          logging: false,
          width: pageWidth * 3.78,
          height: pageHeight * 3.78,
          backgroundColor: page.backgroundColor || '#ffffff',
          imageTimeout: 3000, // 增加超时时间
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector('.a4-page');
            if (clonedElement) {
              clonedElement.style.transform = 'none';
              
              // 确保所有组件在页面内正确显示
              const components = clonedElement.querySelectorAll('[data-component-id]');
              components.forEach(comp => {
                comp.style.position = 'absolute';
                comp.style.transformOrigin = 'top left';
                comp.style.transform = 'none';
              });
            }
          }
        });

        // 转换为图片URL
        const previewUrl = canvas.toDataURL('image/jpeg', 0.9); // 提高质量
        pagePreviews.push({
          index: i,
          pageId: page.id,
          url: previewUrl,
          selected: true // 默认选中所有页面
        });
        
        // 清理临时容器
        document.body.removeChild(container);
      }
      
      // 设置预览图片数组
      setPreviewImages(pagePreviews);
      
      // 兼容单页预览
      if (pagePreviews.length > 0) {
        setPreviewImage(pagePreviews[currentPageIndex]?.url || pagePreviews[0].url);
      }
    } catch (err) {
      console.error('预览生成错误:', err);
      alert('预览生成失败，请重试');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // 开始导出PDF预览
  const startPdfExport = () => {
    generatePreview('pdf');
  };

  // 确认导出PDF
  const confirmExport = async () => {
    try {
      // 检查是否有选中的页面
      const selectedPages = previewImages.filter(img => img.selected);
      if (selectedPages.length === 0) {
        alert('请至少选择一个要导出的页面');
        return;
      }
      
      // 按页面索引排序
      selectedPages.sort((a, b) => a.index - b.index);
      
      // 创建PDF实例 (用第一个选中页面的尺寸)
      const firstPage = pages[selectedPages[0].index];
      const pageWidth = firstPage.width;
      const pageHeight = firstPage.height;
      const isLandscape = pageWidth > pageHeight;
      
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pageWidth, pageHeight],
        hotfixes: ['px_scaling'],
        compress: true // 启用PDF压缩
      });
      
      // 对每个选中的页面进行处理
      for (let i = 0; i < selectedPages.length; i++) {
        const pagePreview = selectedPages[i];
        const pageIndex = pagePreview.index;
        const page = pages[pageIndex];
        
        // 如果不是第一页，需要添加新页面
        if (i > 0) {
          const thisPageWidth = page.width;
          const thisPageHeight = page.height;
          const thisPageIsLandscape = thisPageWidth > thisPageHeight;
          
          pdf.addPage([thisPageWidth, thisPageHeight], thisPageIsLandscape ? 'landscape' : 'portrait');
        }
        
        // 图片质量设置
        const imgData = pagePreview.url;
        
        // 优化图像添加方式，确保内容完整显示
        pdf.addImage(
          imgData, 
          'JPEG', 
          0, 
          0, 
          page.width, 
          page.height, 
          undefined, 
          'FAST',
          0 // 旋转角度
        );
      }
      
      // 保存PDF
      const filename = `我的简历_${new Date().toLocaleDateString().replace(/\//g, '_')}.pdf`;
      pdf.save(filename);
      
      console.log('PDF导出成功:', filename);
      
      // 关闭预览对话框
      setPreviewDialogOpen(false);
    } catch (err) {
      console.error('PDF导出错误:', err);
      alert('PDF导出失败，请重试: ' + err.message);
    }
  };

  // 导出图片预览
  const startImageExport = () => {
    // 使用相同的预览生成逻辑
    generatePreview();
    // 标记是图片导出模式
    setExportMode('image');
  };
  
  // 确认图片导出
  const confirmImageExport = async (imageType = 'png', quality = 1.0) => {
    try {
      // 检查是否有选中的页面
      const selectedPages = previewImages.filter(img => img.selected);
      if (selectedPages.length === 0) {
        alert('请至少选择一个要导出的页面');
        return;
      }
      
      // 按页面索引排序
      selectedPages.sort((a, b) => a.index - b.index);
      
      // 对每个选中的页面进行处理
      for (let i = 0; i < selectedPages.length; i++) {
        const pagePreview = selectedPages[i];
        const pageIndex = pagePreview.index;
        
        // 设置MIME类型
        const mimeType = `image/${imageType}`;
        
        // 从预览图获取图片数据
        const imgData = pagePreview.url;
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = imgData;
        
        // 如果只导出一页，不添加页码
        const filename = selectedPages.length > 1
          ? `我的简历_第${pageIndex + 1}页_${new Date().toLocaleDateString()}.${imageType}`
          : `我的简历_${new Date().toLocaleDateString()}.${imageType}`;
          
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      console.log('图片导出成功');
      
      // 关闭预览对话框
      setPreviewDialogOpen(false);
      setExportMode('none');
    } catch (err) {
      console.error('图片导出错误:', err);
      alert('图片导出失败，请重试');
    }
  };

  // 取消导出
  const cancelExport = () => {
    setPreviewDialogOpen(false);
    setPreviewImage('');
    setExportMode('none');
  };

  // 导出简历数据
  const handleExportResumeData = () => {
    const exportData = {
      settings: resumeSettings,
      pages: pages
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `我的简历_${new Date().toLocaleDateString()}.json`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导入简历数据
  const handleImportResumeData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (importedData.settings) {
          setResumeSettings(importedData.settings);
        }
        
        if (importedData.pages) {
          setPages(importedData.pages);
          setCurrentPageIndex(0);
        }
      } catch (error) {
        console.error('导入简历数据失败:', error);
        alert('导入失败，请确保文件格式正确');
      }
    };
    reader.readAsText(file);
    
    e.target.value = '';
  };

  // 当页面索引变化时，自动滚动到当前页面
  useEffect(() => {
    // 只有在页面已经渲染后才执行滚动
    if (resumeRef.current && pageRefs.current[currentPageIndex]) {
      // 计算目标页面在容器中的位置
      const targetElement = pageRefs.current[currentPageIndex];
      // 滚动到目标页面
      resumeRef.current.scrollTop = targetElement.offsetTop - 20;
    }
  }, [currentPageIndex]);
  
  // 滚动到指定页面 (仅用于点击页面管理时)
  const scrollToPage = (pageIndex) => {
    // 避免在相同页面进行不必要的滚动
    if (pageIndex === currentPageIndex) {
      return;
    }
    
    // 设置当前页面索引 (会触发上面的useEffect)
    setCurrentPageIndex(pageIndex);
  };

  // 添加组件点击处理函数
  const handleComponentClick = (componentId) => {
    // 设置当前打开的组件ID
    setOpenComponentId(componentId);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧编辑面板区域 (原右侧) */}
      <div style={{ 
        width: '420px', // 调整宽度以与红色框匹配
        padding: '20px', 
        overflowY: 'auto', 
        borderRight: '1px solid #ccc', // 将 borderLeft 改为 borderRight
        background: '#fff',
        position: 'fixed', // 添加固定定位
        left: 0,        // 固定在左侧
        top: 0,         // 固定在顶部
        bottom: 0,      // 延伸到底部
        zIndex: 100     // 确保在其他元素上方
      }}>
        {/* 导出/导入按钮组 */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '15px'
        }}>
          <button 
            onClick={startPdfExport}
            disabled={isGeneratingPreview}
            style={{ 
              flex: 1,
              padding: '10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isGeneratingPreview ? 'wait' : 'pointer',
              opacity: isGeneratingPreview ? 0.7 : 1
            }}
          >
            {isGeneratingPreview ? '生成预览中...' : '导出PDF'}
          </button>
          <button 
            onClick={() => startImageExport()}
            style={{ 
              flex: 1,
              padding: '10px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            导出图片
          </button>
          <button 
            onClick={handleExportResumeData}
            style={{ 
              flex: 1,
              padding: '10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            导出数据
          </button>
          <label style={{ 
            flex: 1,
            padding: '10px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'center'
          }}>
            导入数据
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportResumeData} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* 页面管理 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0 }}>页面管理</h3>
            <button
              onClick={() => addPage()}
              style={{
                padding: '5px 10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              添加页面
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {pages.map((page, index) => (
              <div
                key={page.id}
                onClick={() => {
                  // 设置当前页面索引
                  setCurrentPageIndex(index);
                  
                  // 滚动到对应页面
                  scrollToPage(index);
                }}
                style={{
                  padding: '10px',
                  border: `2px solid ${index === currentPageIndex ? '#2196F3' : '#ddd'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: index === currentPageIndex ? '#e3f2fd' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>页面 {index + 1}</span>
                {pages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(index);
                    }}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#ff5252',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 简历设置 */}
        <ResumeSettings 
          resumeSettings={resumeSettings} 
          updateResumeSettings={setResumeSettings} 
          pageSettings={pages[currentPageIndex]}
          updatePageSettings={(settings) => updatePageSettings(currentPageIndex, settings)}
          addComponent={addComponent} 
          addPage={addPage}
          exportPDF={startPdfExport}
          exportResumeData={handleExportResumeData}
          importResumeData={handleImportResumeData}
        />

        {/* 当前页面的组件列表 */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>当前页面组件</h3>
          {pages[currentPageIndex].components.map(comp => (
          <ComponentEditor 
            key={comp.id} 
            component={comp} 
            updateComponent={(updated) => updateComponent(comp.id, updated)}
            deleteComponent={() => deleteComponent(comp.id)}
            duplicateComponent={duplicateComponent}
            isOpen={openComponentId === comp.id}
            onToggle={(id) => {
              if (openComponentId === id) {
                setOpenComponentId(null);
              } else {
                setOpenComponentId(id);
              }
            }}
          />
        ))}
        </div>
      </div>

      {/* 右侧简历预览区域 */}
      <div 
        ref={resumeRef}
        style={{ 
          flex: 1,
          marginLeft: '420px', 
          padding: '20px', 
          overflow: 'auto', 
          background: '#f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '30px',
          position: 'relative' // 添加相对定位
        }}
      >
        {/* 页面指示器 */}
        <div style={{
          position: 'fixed',
          right: '20px',
          top: '70px',
          zIndex: 50,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span>第 {currentPageIndex + 1} 页</span>
          <span style={{ color: '#999' }}>/</span>
          <span style={{ color: '#ccc' }}>{pages.length} 页</span>
        </div>

        {pages.map((page, index) => (
          <div 
            key={page.id}
            ref={(el) => setPageRef(index, el)}
            style={{
              marginBottom: '30px',
              position: 'relative',
              boxShadow: index === currentPageIndex ? 
                '0 0 0 3px #2196F3, 0 5px 15px rgba(0,0,0,0.2)' : 
                '0 0 10px rgba(0,0,0,0.1)',
              backgroundColor: 'white',
            }}
          > 
            {/* 页面标识 */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              left: '0',
              padding: '8px 12px',
              backgroundColor: index === currentPageIndex ? '#2196F3' : '#666',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>页面 {index + 1}</span>
              {index === currentPageIndex && (
                <span style={{
                  backgroundColor: 'white',
                  color: '#2196F3',
                  fontSize: '12px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold'
                }}>
                  当前编辑
                </span>
              )}
            </div>
            <A4Resume 
              components={page.components}
              settings={{
                ...resumeSettings,
                ...page,
                previewScale: 0.75
              }}
              activeComponentId={openComponentId}
              onComponentClick={handleComponentClick}
              onUpdateComponent={updateComponent}
            />
          </div>
        ))}
      </div>

      {/* 预览对话框 */}
      {previewDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '90%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            width: '800px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: '0' }}>
                {exportMode === 'pdf' ? 'PDF导出预览' : '图片导出预览'}
              </h3>
              {isGeneratingPreview && <span style={{ color: '#999' }}>正在生成预览...</span>}
            </div>
            
            {/* 页面选择区域 */}
            {previewImages.length > 1 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}>
                <div style={{ width: '100%', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold' }}>选择要导出的页面：</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                    (已选择 {previewImages.filter(img => img.selected).length} / {previewImages.length} 页)
                  </span>
                </div>
                {previewImages.map((page, index) => (
                  <div 
                    key={page.pageId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      border: `2px solid ${page.selected ? '#4CAF50' : '#ddd'}`,
                      borderRadius: '4px',
                      backgroundColor: page.selected ? '#e8f5e9' : '#fff',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const updatedImages = previewImages.map((img, i) => 
                        i === index ? { ...img, selected: !img.selected } : img
                      );
                      setPreviewImages(updatedImages);
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={page.selected} 
                      onChange={() => {}} 
                      style={{ marginRight: '5px' }} 
                    />
                    页面 {index + 1}
                  </div>
                ))}
              </div>
            )}
            
            {/* 预览图显示区域 */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              alignItems: 'center'
            }}>
              {previewImages.filter(img => img.selected).map((page, index) => (
                <div 
                  key={page.pageId}
                  style={{
                    width: '210mm',  // A4纸宽度
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ position: 'absolute', top: '5px', left: '5px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                    页面 {page.index + 1}
                  </div>
                  <img 
                    src={page.url} 
                    alt={`页面 ${page.index + 1} 预览`} 
                    style={{
                      width: '100%',
                      display: 'block'
                    }}
                  />
                </div>
              ))}
              
              {previewImages.filter(img => img.selected).length === 0 && (
                <div style={{ 
                  padding: '30px', 
                  textAlign: 'center', 
                  color: '#999',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '72px', marginBottom: '20px' }}>😕</div>
                  <div>请至少选择一个要导出的页面</div>
                </div>
              )}
            </div>
            
            {/* 按钮区域 */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={cancelExport}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              
              {exportMode === 'pdf' ? (
                <button
                  onClick={confirmExport}
                  disabled={previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview ? '#ccc' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isGeneratingPreview ? '正在生成...' : '导出为PDF'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => confirmImageExport('png')}
                    disabled={previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview ? '#ccc' : '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview ? 'not-allowed' : 'pointer'
                    }}
                  >
                    导出为PNG
                  </button>
                  <button
                    onClick={() => confirmImageExport('jpeg', 0.9)}
                    disabled={previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview ? '#ccc' : '#9C27B0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: previewImages.filter(img => img.selected).length === 0 || isGeneratingPreview ? 'not-allowed' : 'pointer'
                    }}
                  >
                    导出为JPEG
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEditor;