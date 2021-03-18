import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const findProductOnCart = cart.find(product => product.id === productId);

      if (findProductOnCart) {
        updateProductAmount({
          productId,
          amount: findProductOnCart.amount + 1,
        });
      } else {
        const product = await api.get<Product>(`products/${productId}`)
          .then(response => (response.data));

        if (!product) throw new Error();

        const newCart = [...cart, { ...product, amount: 1 }];
        
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        toast.success('Produto adicionado com sucesso');
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const findProduct = cart.find((product) => (
        product.id === productId
      ));

      if (!findProduct) throw new Error();

      const newCart = cart.filter(product => (
        product.id !== productId
      ));

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      toast.success('Produto removido com sucesso');
    } catch {
      toast.error('Erro na remoção do produto');
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productStock = await api.get<Stock>(`stock/${productId}`)
        .then((response) => {
          return response.data;
        });

      if (productStock.amount <= 0) {
        return;
      }

      if (amount > productStock.amount || amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map(product => {
        return product.id === productId
          ? {...product, amount}
          : product;
      });

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
