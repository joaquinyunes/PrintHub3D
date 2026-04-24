import { Router } from 'express';

const router = Router();

router.post('/create-payment', async (req, res) => {
  try {
    const { productName, price, deposit = false } = req.body;
    
    if (!productName || !price) {
      return res.status(400).json({ message: 'Faltan datos' });
    }
    
    const amount = deposit ? Math.round(price * 0.3) : price;

    // Por ahora, redirigir a WhatsApp
    const phone = "5493794000000";
    const text = deposit
      ? `Hola! Quiero pagar la seña (30%) de: *${productName}* ($${amount})`
      : `Hola! Quiero comprar: *${productName}* ($${amount})`;
    
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    
    res.json({
      url: waUrl,
      amount,
      deposit,
      message: 'Redirigiendo a WhatsApp para completar el pago'
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Error al crear pago' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      console.log('Payment received:', data.id);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Error en webhook' });
  }
});

export default router;