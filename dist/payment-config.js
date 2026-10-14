// Only public merchant receiving information belongs here. Never add credentials.
export const paymentMethods = [
  { id: 'wechat', name: 'WeChat', zh: '微信支付', ko: '위챗페이', qr: './assets/payment/wechat.jpg', recipient: 'Aaa(**源)', crop: { width:828, x:208, y:264, size:410 } },
  { id: 'alipay', name: 'Alipay', zh: '支付宝', ko: '알리페이', qr: './assets/payment/alipay.jpg', recipient: '**源', crop: { width:1280, x:215, y:684, size:850 } },
  { id: 'kakao', name: 'KakaoPay', zh: 'KakaoPay', ko: '카카오페이', qr: '', recipient: '' },
  { id: 'bank', name: 'Bank transfer', zh: '银行卡转账', ko: '은행 송금', bank: '', account: '', recipient: '' }
];
