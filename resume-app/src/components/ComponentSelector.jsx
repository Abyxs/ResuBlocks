import React from 'react';
import { 
  User, 
  Star, 
  FileText, 
  BookOpen, 
  Briefcase, 
  Award, 
  Heart, 
  Layout,
  Image // 添加 Image 图标
} from 'lucide-react';

const ComponentSelector = ({ onSelect, onClose }) => {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '10px',
        borderBottom: '1px solid #eee'
      }}>
        <h3 style={{ margin: 0 }}>选择组件类型</h3>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '18px', 
            cursor: 'pointer' 
          }}
        >
          ×
        </button>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '10px',
        padding: '10px'
      }}>
        {/* 个人信息 */}
        <div 
          onClick={() => onSelect('personalInfo')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>个人信息</div>
        </div>
        
        {/* 技能专长 */}
        <div 
          onClick={() => onSelect('skills')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>技能专长</div>
        </div>
        
        {/* 教育背景 */}
        <div 
          onClick={() => onSelect('education')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>教育背景</div>
        </div>
        
        {/* 工作经验 */}
        <div 
          onClick={() => onSelect('experience')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>工作经验</div>
        </div>
        
        {/* 个人简介 */}
        <div 
          onClick={() => onSelect('summary')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>个人简介</div>
        </div>
        
        {/* 成就与奖项 */}
        <div 
          onClick={() => onSelect('achievements')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>成就与奖项</div>
        </div>
        
        {/* 个人爱好 */}
        <div 
          onClick={() => onSelect('hobbies')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>个人爱好</div>
        </div>
        
        {/* 个人成果展示 */}
        <div 
          onClick={() => onSelect('portfolio')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>个人成果展示</div>
        </div>
        
        {/* 添加图片组件选项 */}
        <div 
          onClick={() => onSelect('image')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>图片</div>
        </div>
        
        {/* 空白组件 */}
        <div 
          onClick={() => onSelect('blank')}
          style={{ 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <div>空白组件</div>
        </div>
      </div>
    </div>
  );
};

export default ComponentSelector;