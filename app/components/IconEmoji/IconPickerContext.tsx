import React from "react";
import useIconState from "~/hooks/useIconState";

type ContextType = ReturnType<typeof useIconState>;

const Context = React.createContext<ContextType | null>(null);

export const IconPickerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const iconState = useIconState();
  return (
    <Context.Provider value={{ ...iconState }}>{children}</Context.Provider>
  );
};

export const useIconPickerContext = () => {
  const context = React.useContext(Context);
  if (!context) {
    throw new Error(
      "useIconPickerContext must be used with an IconPickerProvider"
    );
  }
  return context;
};
