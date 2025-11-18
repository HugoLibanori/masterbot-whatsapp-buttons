// Tipagem para configuração de pagamento Pix estático
export interface PixStaticCode {
  merchant_name: string;
  key: string;
  key_type: 'EMAIL' | 'PHONE' | 'CPF' | 'EVP';
}

// Configuração individual de método de pagamento (pode ser expandido no futuro)
export interface PixPaymentSetting {
  type: 'pix_static_code';
  pix_static_code: PixStaticCode;
}

// Conteúdo JSON dentro do botão payment_info
export interface PaymentInfoButtonParams {
  payment_settings: PixPaymentSetting[];
}

// Botão do tipo Pix interativo
export interface IButtonPix {
  name: 'payment_info';
  buttonParamsJson: string; // será o JSON.stringify(PaymentInfoButtonParams)
}

// Estrutura completa da mensagem Pix
export interface MyButtonPix {
  text?: string; // campo obrigatório no envio, mesmo vazio
  interactiveButtons: IButtonPix[];
}
