// src/contexts/AuditAlertContext.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";

interface AuditAlertContextProps {
  auditEnabled: boolean;
  setAuditEnabled: (enabled: boolean) => void;
}

const AuditAlertContext = createContext<AuditAlertContextProps | undefined>(undefined);

export const AuditAlertProvider = ({ children }: { children: ReactNode }) => {
  const [auditEnabled, setAuditEnabled] = useState(false);

  return (
    <AuditAlertContext.Provider value={{ auditEnabled, setAuditEnabled }}>
      {children}
    </AuditAlertContext.Provider>
  );
};

export const useAuditAlert = () => {
  const context = useContext(AuditAlertContext);
  if (!context) {
    throw new Error("useAuditAlert must be used within an AuditAlertProvider");
  }
  return context;
};