import { Project } from "../features/api/types";
import React, {
  createContext,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  loadCartFromLocalStorage,
  saveCartToLocalStorage,
} from "../features/api/LocalStorage";
import { RoundContext } from "./RoundContext";

export interface CartContextState {
  cart: Project[];
  setCart: React.Dispatch<SetStateAction<Project[]>>;
}

export const initialCartState: CartContextState = {
  cart: [],
  setCart: () => {
    /**/
  },
};

export const CartContext = createContext<CartContextState>(initialCartState);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const roundContext = useContext(RoundContext);
  const currentRoundId = roundContext?.state?.currentRoundId;
  const [cart, setCart] = useState(initialCartState.cart);

  useEffect((): void => {
    if (currentRoundId) {
      const storedCart =
        loadCartFromLocalStorage(currentRoundId) ?? initialCartState.cart;
      setCart(storedCart);
    }
  }, [currentRoundId]);

  useEffect((): void => {
    if (currentRoundId) {
      saveCartToLocalStorage(cart, currentRoundId);
    }
  }, [cart, currentRoundId]);

  const providerProps: CartContextState = {
    cart,
    setCart,
  };

  return (
    <CartContext.Provider value={providerProps}>
      {children}
    </CartContext.Provider>
  );
};

/* Custom Hooks */
type UseCart = [
  cart: CartContextState["cart"],
  handleAddProjectsToCart: (projects: Project[]) => void,
  handleRemoveProjectsFromCart: (projects: Project[]) => void
];

export const useCart = (): UseCart => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  const { cart, setCart } = context;

  const handleAddProjectsToCart = (projectsToAdd: Project[]): void => {
    // Add projects to the cart if they are not already present
    const newCart = projectsToAdd.reduce((acc, projectToAdd) => {
      const isProjectAlreadyInCart = acc.find(
        (project) =>
          project.projectRegistryId === projectToAdd.projectRegistryId
      );
      return isProjectAlreadyInCart ? acc : acc.concat(projectToAdd);
    }, cart);

    setCart(newCart);
  };

  const handleRemoveProjectsFromCart = (projectsToRemove: Project[]): void => {
    // Remove projects from the cart if they are present
    const newCart = cart.filter(
      (project) =>
        !projectsToRemove.find(
          (projectToRemove) =>
            projectToRemove.projectRegistryId === project.projectRegistryId
        )
    );
    setCart(newCart);
  };

  return [cart, handleAddProjectsToCart, handleRemoveProjectsFromCart];
};
