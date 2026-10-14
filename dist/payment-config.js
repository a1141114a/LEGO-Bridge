// Only public merchant receiving information belongs here. Never add credentials.
export const paymentMethods = [
  { id: 'wechat', name: 'WeChat', zh: '微信支付', ko: '위챗페이', qr: './assets/payment/wechat-custom.svg', recipient: 'Aaa(**源)', crop: { width:410, x:0, y:0, size:410 } },
  { id: 'alipay', name: 'Alipay', zh: '支付宝', ko: '알리페이', qr: './assets/payment/alipay-custom.svg', recipient: '**源', crop: { width:850, x:0, y:0, size:850 } },
  { id: 'kakao', name: 'KakaoPay', zh: 'KakaoPay', ko: '카카오페이', qr: '', recipient: '' },
  { id: 'bank', name: 'Bank transfer', zh: '银行卡转账', ko: '은행 송금', bank: '', account: '', recipient: '' }
];
