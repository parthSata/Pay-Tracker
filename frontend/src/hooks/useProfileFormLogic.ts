import { useRef } from "react";
import { toast } from "sonner";

interface UseProfileFormLogicProps {
  setVal: (key: string, value: any) => void;
  uploadFile: (file: File, type: "logo" | "signature" | "avatar") => Promise<void>;
}

export function useProfileFormLogic({ setVal, uploadFile }: UseProfileFormLogicProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature" | "avatar") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds the 10MB limit.");
        return;
      }
      uploadFile(file, type);
    }
  };

  const removeImage = (type: "logoUrl" | "signatureUrl" | "profilePic") => {
    setVal(type, "");
    toast.success(
      `${
        type === "logoUrl" ? "Logo" : type === "signatureUrl" ? "Signature" : "Avatar"
      } removed locally. Save to apply.`
    );
  };

  return {
    avatarInputRef,
    handleFileChange,
    removeImage,
  };
}
