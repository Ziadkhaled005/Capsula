import { createContext, useContext, useState, ReactNode } from "react";

type UploadNotification = {
  filename: string;
} | null;

type UploadContextType = {
  uploadNotification: UploadNotification;
  setUploadNotification: (n: UploadNotification) => void;
  showSuccessAlert: boolean;
  setShowSuccessAlert: (v: boolean) => void;
  enforceMaxSize: boolean;
  setEnforceMaxSize: (v: boolean) => void;
};

const UploadContext = createContext<UploadContextType>({
  uploadNotification: null,
  setUploadNotification: () => {},
  showSuccessAlert: false,
  setShowSuccessAlert: () => {},
  enforceMaxSize: true,
  setEnforceMaxSize: () => {},
});

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadNotification, setUploadNotification] = useState<UploadNotification>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [enforceMaxSize, setEnforceMaxSize] = useState(true);
  return (
    <UploadContext.Provider value={{ uploadNotification, setUploadNotification, showSuccessAlert, setShowSuccessAlert, enforceMaxSize, setEnforceMaxSize }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  return useContext(UploadContext);
}
