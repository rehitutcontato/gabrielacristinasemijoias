import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORE_CONFIG } from '../data/products';

const CartContext = createContext();

const CART_STORAGE_KEY = 'gc_semijoias_cart_v1';
const FAVS_STORAGE_KEY = 'gc_semijoias_favs_v1';
const STORAGE_EXPIRATION_DAYS = 30;

export const CartProvider = ({ children }) => {
  // Load initial cart with expiration check (30 days)
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const { items, timestamp } = JSON.parse(stored);
        const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (ageInDays < STORAGE_EXPIRATION_DAYS) {
          return items || [];
        }
      }
    } catch (e) {
      console.error('Error loading cart from storage', e);
    }
    return [];
  });

  // Load favorites
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(FAVS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, product: null, message: '' });

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          items: cart,
          timestamp: Date.now()
        })
      );
    } catch (e) {
      console.error('Error saving cart to storage', e);
    }
  }, [cart]);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVS_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites to storage', e);
    }
  }, [favorites]);

  const showToast = (product, message = 'Peça adicionada à sacola!') => {
    setToast({ show: true, product, message });
    setTimeout(() => {
      setToast({ show: false, product: null, message: '' });
    }, 2800);
  };

  const addToCart = (product, quantity = 1) => {
    if (!product.in_stock) return;
    
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });

    showToast(product);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isFavorited = (productId) => favorites.includes(productId);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const formattedSubtotal = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;

  // Formatter for WhatsApp Deep Link Message
  const getWhatsAppCheckoutUrl = (customerName = '') => {
    if (cart.length === 0) return '';

    let message = `✨ *Olá, ${STORE_CONFIG.founderName}! Gostaria de fazer o pedido das seguintes peças da ${STORE_CONFIG.storeName}:*\n\n`;

    if (customerName.trim()) {
      message += `👤 *Cliente:* ${customerName.trim()}\n\n`;
    }

    message += `🛍️ *Itens Escolhidos:*\n`;
    cart.forEach((item) => {
      const itemTotal = (item.product.price * item.quantity).toFixed(2).replace('.', ',');
      message += `• *${item.quantity}x* ${item.product.name}\n`;
      message += `   (R$ ${item.product.price.toFixed(2).replace('.', ',')} cada) — *R$ ${itemTotal}*\n`;
    });

    message += `\n💎 *Subtotal do Pedido:* ${formattedSubtotal}`;
    message += `\n💳 *Forma de Pagamento:* Pix ou Cartão (em até 3x sem juros)`;
    message += `\n\n📦 *Poderia por favor calcular meu frete e me passar os dados para pagamento? Muito obrigada!* ✨`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encoded}`;
  };

  const getDirectProductWhatsAppUrl = (product, quantity = 1) => {
    const itemTotal = (product.price * quantity).toFixed(2).replace('.', ',');
    let message = `✨ *Olá, ${STORE_CONFIG.founderName}! Vi essa peça no catálogo e amei:*\n\n`;
    message += `💎 *${quantity}x ${product.name}*\n`;
    message += `💰 *Valor:* R$ ${itemTotal}\n`;
    message += `✨ *Banho:* ${product.material}\n\n`;
    message += `Está disponível para pronta entrega? Como podemos finalizar o pedido? Obrigado(a)! ✨`;

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encoded}`;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        formattedSubtotal,
        isCartOpen,
        setIsCartOpen,
        favorites,
        toggleFavorite,
        isFavorited,
        toast,
        showToast,
        getWhatsAppCheckoutUrl,
        getDirectProductWhatsAppUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
