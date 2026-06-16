export const BOOKS = [
  {
    id: 'money',
    title: '货币金融学',
    titleEn: 'Money, Banking & Financial Markets',
    appId: 'mpqj6lz8sg9ovagh',
    price: 0,
    spine: '#C9956A',
    accent: '#8C6235',
    cover: '/images/cover_money.jpg',
    chapters: 12,
    tag: '免费开放',
    desc: '从央行到信用创造,从利率到资产价格 —— 一本可以"玩"的入门教材。点击章节,亲手拉动政策杠杆,直接观察对经济的反馈。',
    pitch: '入门必读 · 免费开放给所有读者'
  },
  {
    id: 'cycle',
    title: '金融周期',
    titleEn: 'The Long Good Buy',
    appId: 'mpkboyj2fc3l4u7q',
    price: 9.9,
    spine: '#1A1A1A',
    accent: '#000000',
    cover: '/images/cover_cycle.jpg',
    chapters: 10,
    desc: '理解信用扩张、杠杆累积与资产价格的长周期律动。互动沙盘里调整宏观参数,看危机如何被孕育、被点燃、被收拾。',
    pitch: '宏观从业者的必修 · 一节一个可调沙盘'
  },
  {
    id: 'asset',
    title: '大类资产研究',
    titleEn: 'Global Macro & Asset Research',
    appId: 'mp8l3nracsix91cs',
    price: 9.9,
    spine: '#5B7FA8',
    accent: '#2D5A85',
    cover: '/images/cover_asset.jpg',
    chapters: 14,
    desc: '股、债、商、汇 —— 从美林时钟到全天候组合。每章配有可交互的资产配置模拟器,把"配置"二字从口号落到参数。',
    pitch: '资产配置实战 · 14 章可交互模拟'
  },
  {
    id: 'vol',
    title: '波动率交易',
    titleEn: 'Volatility Trading',
    appId: 'mpaju0v8qb5z1h2m',
    price: 9.9,
    spine: '#1F3A5F',
    accent: '#0F1F3D',
    cover: '/images/cover_vol.jpg',
    chapters: 11,
    desc: 'Vega、Gamma、Vanna、Volga,微笑、偏度、期限结构 —— 把波动率当作资产来交易的实战手册。',
    pitch: '专业波动率交易员视角 · 含希腊字母互动模型'
  },
  {
    id: 'option',
    title: '期权入门学与练',
    titleEn: 'Options Learning Lab',
    appId: 'mpvr44zosv8bkocl',
    price: 9.9,
    spine: '#A88333',
    accent: '#7A5E22',
    cover: null,
    chapters: 13,
    desc: '从希腊字母到组合策略 —— 每一节都配一个可拖动的盈亏图,在边学边练里建立直觉。',
    pitch: '从 0 到 1 的期权 · 边学边练'
  }
];

export function findBook(id) {
  return BOOKS.find(b => b.id === id);
}

export function paidBooks() {
  return BOOKS.filter(b => b.price > 0);
}

export function singlePriceSum() {
  return paidBooks().reduce((s, b) => s + b.price, 0);
}
