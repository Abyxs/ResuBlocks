import React from 'react';
import NumberInput from '../../NumberInput';

const PortfolioItemStyleEditor = ({ component, handleContentChange }) => {
  const handlePortfolioItemChange = (index, field, value) => {
    const newPortfolioItems = [...(component.content.portfolioItems || [])];
    newPortfolioItems[index] = {
      ...newPortfolioItems[index],
      [field]: value
    };
    handleContentChange('portfolioItems', newPortfolioItems);
  };

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: '15px' }}>项目框样式设置</h3>
      
      {(component.content.portfolioItems || []).map((item, index) => (
        <div key={item.id} style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          border: '1px solid #eee',
          borderRadius: '4px'
        }}>
          <h4 style={{ margin: '0 0 15px 0' }}>项目 {index + 1}: {item.title}</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>背景颜色:</label>
            <input 
              type="color" 
              value={item.backgroundColor || '#f9f9f9'} 
              onChange={(e) => handlePortfolioItemChange(index, 'backgroundColor', e.target.value)}
              style={{ width: '100%', height: '30px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>边框颜色:</label>
            <input 
              type="color" 
              value={item.borderColor || '#eeeeee'} 
              onChange={(e) => handlePortfolioItemChange(index, 'borderColor', e.target.value)}
              style={{ width: '100%', height: '30px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>边框宽度 (px):</label>
            <NumberInput 
              value={item.borderWidth || 1} 
              onChange={(value) => handlePortfolioItemChange(index, 'borderWidth', value)}
              min={0}
              max={10}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>边框圆角 (px):</label>
            <NumberInput 
              value={item.borderRadius || 4} 
              onChange={(value) => handlePortfolioItemChange(index, 'borderRadius', value)}
              min={0}
              max={20}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>内边距 (px):</label>
            <NumberInput 
              value={item.itemPadding !== undefined ? item.itemPadding : 15}
              onChange={(value) => handlePortfolioItemChange(index, 'itemPadding', value)}
              min={0}
            />
          </div>
          
          // 在高度输入框部分，确保高度设置正确
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>高度 (px):</label>
            <input 
              type="number" 
              min="0" 
              value={item.height !== undefined && item.height !== '' ? item.height : ''} 
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  handlePortfolioItemChange(index, 'height', '');
                } else {
                  const height = parseInt(value);
                  if (!isNaN(height) && height >= 0) {
                    // 确保高度值被正确设置，但不要超过页面高度
                    const safeHeight = Math.min(height, 800); // 设置一个合理的最大值
                    handlePortfolioItemChange(index, 'height', safeHeight);
                    console.log('设置高度为:', safeHeight);
                  }
                }
              }}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="不设置则自动适应内容"
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              当前设置: {item.height !== undefined && item.height !== '' ? `${item.height}px (固定高度)` : '自动适应内容'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              注意设置一个合适的高度（如100px）以确保项目框有足够的空间显示内容
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>标题颜色:</label>
            <input 
              type="color" 
              value={item.titleColor || '#333333'} 
              onChange={(e) => handlePortfolioItemChange(index, 'titleColor', e.target.value)}
              style={{ width: '100%', height: '30px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>描述文字颜色:</label>
            <input 
              type="color" 
              value={item.descriptionColor || '#666666'} 
              onChange={(e) => handlePortfolioItemChange(index, 'descriptionColor', e.target.value)}
              style={{ width: '100%', height: '30px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>链接颜色:</label>
            <input 
              type="color" 
              value={item.linkColor || '#2196F3'} 
              onChange={(e) => handlePortfolioItemChange(index, 'linkColor', e.target.value)}
              style={{ width: '100%', height: '30px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              id={`boxShadow-${index}`}
              checked={item.boxShadow || false} 
              onChange={(e) => handlePortfolioItemChange(index, 'boxShadow', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor={`boxShadow-${index}`}>添加阴影效果</label>
          </div>
          
          <button 
            onClick={() => {
              handlePortfolioItemChange(index, 'backgroundColor', '#f9f9f9');
              handlePortfolioItemChange(index, 'borderColor', '#eeeeee');
              handlePortfolioItemChange(index, 'borderWidth', 1);
              handlePortfolioItemChange(index, 'borderRadius', 4);
              handlePortfolioItemChange(index, 'itemPadding', 15);
              // 设置默认高度为100px
              handlePortfolioItemChange(index, 'height', 100);
              handlePortfolioItemChange(index, 'titleColor', '#333333');
              handlePortfolioItemChange(index, 'descriptionColor', '#666666');
              handlePortfolioItemChange(index, 'linkColor', '#2196F3');
              handlePortfolioItemChange(index, 'boxShadow', false);
              // 删除旧的高度相关属性
              const newPortfolioItems = [...(component.content.portfolioItems || [])];
              const updatedItem = { ...newPortfolioItems[index] };
              delete updatedItem.fixedHeight;
              delete updatedItem.minHeight;
              delete updatedItem.bottomMargin;
              newPortfolioItems[index] = updatedItem;
              handleContentChange('portfolioItems', newPortfolioItems);
            }}
            style={{ 
              padding: '8px', 
              backgroundColor: '#607D8B', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              width: '100%'
            }}
          >
            重置样式
          </button>
        </div>
      ))}
    </div>
  );
};

export default PortfolioItemStyleEditor;