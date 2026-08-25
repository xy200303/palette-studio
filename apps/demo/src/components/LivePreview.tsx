import { useMemo, useState, type CSSProperties } from 'react';
import {
  Alert,
  Button,
  Input,
  Pagination,
  Progress,
  Select,
  Slider,
  Switch,
  Table,
  Tag,
} from 'tdesign-react';
import type { ThemeResult } from '@palette-studio/core';
import A11yCard from './A11yCard';

const tableData = [
  { id: 1, name: '品牌主色板', status: '已发布', owner: '林一川' },
  { id: 2, name: '暗色主题适配', status: '进行中', owner: '陈慕' },
  { id: 3, name: 'Token 导出管道', status: '待评审', owner: '苏晚晴' },
];

const tableColumns = [
  { colKey: 'name', title: '项目', width: 160 },
  {
    colKey: 'status',
    title: '状态',
    width: 120,
    cell: ({ row }: { row: (typeof tableData)[number] }) => (
      <Tag
        theme={row.status === '已发布' ? 'success' : row.status === '进行中' ? 'primary' : 'warning'}
        variant="light"
      >
        {row.status}
      </Tag>
    ),
  },
  { colKey: 'owner', title: '负责人', width: 120 },
];

export default function LivePreview({ theme }: { theme: ThemeResult }) {
  const [dark, setDark] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [sliderVal, setSliderVal] = useState(56);
  const [page, setPage] = useState(2);
  const [keyword, setKeyword] = useState('');
  const [fruit, setFruit] = useState('apple');

  const vars = dark ? theme.tokens.dark : theme.tokens.light;

  const shellStyle = useMemo(
    () =>
      ({
        ...vars,
        background: vars['--td-bg-color-page'],
        color: vars['--td-text-color-primary'],
      }) as unknown as CSSProperties,
    [vars],
  );

  const cardStyle = useMemo(
    () => ({ background: vars['--td-bg-color-container'] }) as CSSProperties,
    [vars],
  );

  return (
    <section className="section" id="live">
      <div className="section-head">
        <div className="section-eyebrow">Live Preview</div>
        <h2 className="section-title">组件实时预览</h2>
        <p className="section-desc">
          generateTheme 产出的整套 Design Token 被实时注入下方容器的 CSS 变量，
          所有 TDesign 组件即刻换装。切换暗色可查看重新生成（非简单反转）的暗色色阶效果。
        </p>
      </div>

      <div className="strip-toolbar">
        <div className="seg">
          <button className={!dark ? 'active' : ''} onClick={() => setDark(false)}>亮色模式</button>
          <button className={dark ? 'active' : ''} onClick={() => setDark(true)}>暗色模式</button>
        </div>
      </div>

      <A11yCard theme={theme} />

      <div className="live-shell" style={shellStyle}>
        <div className="live-grid">
          <div className="live-card" style={cardStyle}>
            <h4>按钮 BUTTON</h4>
            <div className="live-row">
              <Button theme="primary">主要按钮</Button>
              <Button variant="outline" theme="primary">次按钮</Button>
            </div>
            <div className="live-row">
              <Button variant="dashed" theme="primary">虚线按钮</Button>
              <Button variant="text" theme="primary">文字按钮</Button>
            </div>
          </div>

          <div className="live-card" style={cardStyle}>
            <h4>标签 TAG</h4>
            <div className="live-row">
              <Tag theme="primary">品牌</Tag>
              <Tag theme="success" variant="light">成功</Tag>
              <Tag theme="warning" variant="light">警告</Tag>
              <Tag theme="danger" variant="light">危险</Tag>
            </div>
            <div className="live-row">
              <Tag theme="primary" variant="outline">描边</Tag>
              <Tag variant="outline">默认</Tag>
            </div>
          </div>

          <div className="live-card" style={cardStyle}>
            <h4>输入 INPUT / SELECT</h4>
            <Input value={keyword} onChange={(v) => setKeyword(String(v))} placeholder="搜索色板、Token…" clearable />
            <Select
              value={fruit}
              onChange={(v) => setFruit(String(v))}
              options={[
                { label: '品牌色阶', value: 'apple' },
                { label: '中性色阶', value: 'banana' },
                { label: '功能色阶', value: 'cherry' },
              ]}
            />
          </div>

          <div className="live-card" style={cardStyle}>
            <h4>开关 SWITCH / 滑杆 SLIDER</h4>
            <div className="live-row">
              <Switch value={switchOn} onChange={(v) => setSwitchOn(Boolean(v))} />
              <Switch defaultValue={false} />
            </div>
            <Slider value={sliderVal} onChange={(v) => setSliderVal(Number(v))} />
          </div>

          <div className="live-card" style={cardStyle}>
            <h4>进度 PROGRESS</h4>
            <Progress percentage={72} theme="line" status="active" />
            <Progress percentage={100} theme="line" status="success" />
          </div>

          <div className="live-card" style={cardStyle}>
            <h4>分页 PAGINATION</h4>
            <Pagination
              total={96}
              pageSize={10}
              current={page}
              onChange={(p) => setPage(p.current)}
              size="small"
              maxPageBtn={7}
              showPageSize={false}
              showJumper={false}
            />
          </div>

          <div className="live-card span2" style={cardStyle}>
            <h4>表格 TABLE</h4>
            <Table
              rowKey="id"
              data={tableData}
              columns={tableColumns}
              size="small"
              bordered={false}
              hover
            />
          </div>

          <div className="live-card" style={cardStyle}>
            <h4>提示 ALERT</h4>
            <Alert theme="success" message="色阶已生成并注入 Token" />
            <Alert theme="info" message="暗色模式为重新生成的色阶" />
          </div>
        </div>
      </div>
    </section>
  );
}
