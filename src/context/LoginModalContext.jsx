import { createContext, useCallback, useMemo, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const LoginModalContext = createContext(null);

export const LoginModalProvider = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const value = useMemo(
    () => ({ isLoginModalOpen, openLoginModal, closeLoginModal }),
    [isLoginModalOpen, openLoginModal, closeLoginModal],
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
    </LoginModalContext.Provider>
  );
};
